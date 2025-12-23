import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateTaskDto } from './dto/CreateTask.dto';
import { TaskStatus } from './enums/TaskStatus.enum';
import type { Task } from './dto/TaskResponse.dto';
import type { UpdateTaskDto } from './dto/UpdateTask.dto';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(private readonly repo: TasksRepository) {}

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

      normalized.push({
        ...t,
        status,
        createdAt,
        updatedAt,
      });
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
      createdAt: now,
      updatedAt: now,
    };

    const tasks = await this.repo.getAll();
    tasks.push(task);
    await this.repo.writeAll(tasks);
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
      updatedAt: now,
    };
    tasks[idx] = updated;
    await this.repo.writeAll(tasks);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const tasks = await this.repo.getAll();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new NotFoundException('Task not found');
    tasks.splice(idx, 1);
    await this.repo.writeAll(tasks);
  }
}
