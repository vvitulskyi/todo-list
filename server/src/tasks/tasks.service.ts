import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AiService } from '../ai/ai.service';
import type { CreateTaskDto } from './dto/CreateTask.dto';
import type { SubTask, Task, TaskHistoryEntry } from './dto/TaskResponse.dto';
import type { UpdateTaskDto } from './dto/UpdateTask.dto';
import { TaskStatus } from './enums/TaskStatus.enum';
import { TasksRepository } from './tasks.repository';

export type GenerateSubTasksResult =
  | { status: 'needs_clarification'; questions: string[] }
  | Task;

@Injectable()
export class TasksService {
  constructor(
    private readonly repo: TasksRepository,
    @Inject(forwardRef(() => AiService))
    private readonly aiService: AiService,
  ) {}

  private normalizeTasks(tasks: Task[]): {
    normalized: Task[];
    changed: boolean;
  } {
    let changed = false;

    const normalized: Task[] = [];
    for (const t of tasks) {
      if (!t?.id || !t?.title || !t?.priority) {
        changed = true;
        continue;
      }
      const status: TaskStatus = t.status ?? TaskStatus.Pending;
      if (t.status !== status) changed = true;

      const createdAt = t.createdAt ?? new Date().toISOString();
      const updatedAt = t.updatedAt ?? createdAt;
      if (t.createdAt !== createdAt || t.updatedAt !== updatedAt)
        changed = true;

      normalized.push({ ...t, status, createdAt, updatedAt });
    }

    if (normalized.length !== tasks.length) changed = true;
    return { normalized, changed };
  }

  async getAll(): Promise<Task[]> {
    const tasks = await this.repo.getAll();
    const { normalized, changed } = this.normalizeTasks(tasks);
    if (changed) await this.repo.writeAll(normalized);
    return normalized;
  }

  async getHistory(): Promise<TaskHistoryEntry[]> {
    return this.repo.getHistory();
  }

  async findOne(id: string): Promise<Task> {
    const tasks = await this.repo.getAll();
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const now = new Date().toISOString();
    const status: TaskStatus = dto.status ?? TaskStatus.Pending;

    const task: Task = {
      id: randomUUID(),
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      dueDate: dto.dueDate,
      status,
      subTasks: [],
      createdAt: now,
      updatedAt: now,
    };

    const tasks = await this.repo.getAll();
    tasks.push(task);
    await this.repo.writeAll(tasks);

    await this.repo.appendHistory({
      taskId: task.id,
      action: 'created',
      timestamp: now,
    });

    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const tasks = await this.repo.getAll();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new NotFoundException('Task not found');

    const existing = tasks[idx];
    const now = new Date().toISOString();
    const updated: Task = {
      ...existing,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      dueDate: dto.dueDate,
      status: dto.status,
      subTasks: dto.subTasks ?? existing.subTasks,
      updatedAt: now,
    };
    tasks[idx] = updated;
    await this.repo.writeAll(tasks);

    const action: TaskHistoryEntry['action'] =
      dto.status === TaskStatus.Completed &&
      existing.status !== TaskStatus.Completed
        ? 'completed'
        : 'updated';

    await this.repo.appendHistory({ taskId: id, action, timestamp: now });

    return updated;
  }

  async remove(id: string): Promise<void> {
    const tasks = await this.repo.getAll();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new NotFoundException('Task not found');
    tasks.splice(idx, 1);
    await this.repo.writeAll(tasks);
  }

  async generateSubTasksWithAI(
    taskId: string,
  ): Promise<GenerateSubTasksResult> {
    const [task, allTasks, history] = await Promise.all([
      this.findOne(taskId),
      this.getAll(),
      this.getHistory(),
    ]);

    const aiResult = await this.aiService.breakdownTask(
      task,
      allTasks,
      history,
    );

    if (aiResult.needsClarification) {
      return {
        status: 'needs_clarification',
        questions: aiResult.questions,
      };
    }

    const subTasks: SubTask[] = aiResult.subtasks.map((title) => ({
      id: randomUUID(),
      title,
      done: false,
    }));

    return this.update(taskId, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
      subTasks,
    });
  }
}
