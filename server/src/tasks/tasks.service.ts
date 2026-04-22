import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EmbeddingService } from '../ai/embedding/embedding.service';
import type { CreateTaskDto } from './dto/CreateTask.dto';
import type { Task, TaskHistoryEntry } from './dto/TaskResponse.dto';
import type { UpdateTaskDto } from './dto/UpdateTask.dto';
import { TaskStatus } from './enums/TaskStatus.enum';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(
    private readonly repo: TasksRepository,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async getAll(): Promise<Task[]> {
    return this.repo.getAll();
  }

  async getHistory(): Promise<TaskHistoryEntry[]> {
    return this.repo.getHistory();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.repo.findById(id);
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

    const embeddingText = this.embeddingService.buildText(task);
    const embedding = await this.embeddingService.embed(embeddingText);

    await this.repo.insert(task, embedding);
    await this.repo.appendHistory({
      taskId: task.id,
      action: 'created',
      timestamp: now,
    });

    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Task not found');

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

    const embeddingText = this.embeddingService.buildText(updated);
    const embedding = await this.embeddingService.embed(embeddingText);

    await this.repo.update(updated, embedding);

    const action: TaskHistoryEntry['action'] =
      dto.status === TaskStatus.Completed &&
      existing.status !== TaskStatus.Completed
        ? 'completed'
        : 'updated';

    await this.repo.appendHistory({ taskId: id, action, timestamp: now });

    return updated;
  }

  async remove(id: string): Promise<void> {
    const task = await this.repo.findById(id);
    if (!task) throw new NotFoundException('Task not found');
    await this.repo.delete(id);
  }
}
