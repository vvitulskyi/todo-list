import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.provider';
import type { SubTask, Task, TaskHistoryEntry } from './dto/TaskResponse.dto';
import { TaskPriority } from './enums/TaskPriority.enum';
import { TaskStatus } from './enums/TaskStatus.enum';

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  sub_tasks: SubTask[] | null;
  created_at: string;
  updated_at: string;
}

interface TaskHistoryRow {
  task_id: string;
  action: string;
  timestamp: string;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    dueDate: row.due_date ?? undefined,
    subTasks: row.sub_tasks ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class TasksRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async getAll(): Promise<Task[]> {
    const result = await this.pool.query<TaskRow>(
      'SELECT id, title, description, priority, status, due_date, sub_tasks, created_at, updated_at FROM tasks ORDER BY created_at ASC',
    );
    return result.rows.map(rowToTask);
  }

  async findById(id: string): Promise<Task | null> {
    const result = await this.pool.query<TaskRow>(
      'SELECT id, title, description, priority, status, due_date, sub_tasks, created_at, updated_at FROM tasks WHERE id = $1',
      [id],
    );
    return result.rows[0] ? rowToTask(result.rows[0]) : null;
  }

  async insert(task: Task, embedding: number[] | null): Promise<void> {
    await this.pool.query(
      `INSERT INTO tasks (id, title, description, priority, status, due_date, sub_tasks, created_at, updated_at, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        task.id,
        task.title,
        task.description ?? null,
        task.priority,
        task.status,
        task.dueDate ?? null,
        task.subTasks ? JSON.stringify(task.subTasks) : null,
        task.createdAt,
        task.updatedAt,
        embedding ? `[${embedding.join(',')}]` : null,
      ],
    );
  }

  async update(task: Task, embedding: number[] | null): Promise<void> {
    await this.pool.query(
      `UPDATE tasks
       SET title = $2, description = $3, priority = $4, status = $5,
           due_date = $6, sub_tasks = $7, updated_at = $8, embedding = $9
       WHERE id = $1`,
      [
        task.id,
        task.title,
        task.description ?? null,
        task.priority,
        task.status,
        task.dueDate ?? null,
        task.subTasks ? JSON.stringify(task.subTasks) : null,
        task.updatedAt,
        embedding ? `[${embedding.join(',')}]` : null,
      ],
    );
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  }

  async findSimilar(embedding: number[], limit = 5): Promise<Task[]> {
    const result = await this.pool.query<TaskRow>(
      `SELECT id, title, description, priority, status, due_date, sub_tasks, created_at, updated_at
       FROM tasks
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1
       LIMIT $2`,
      [`[${embedding.join(',')}]`, limit],
    );
    return result.rows.map(rowToTask);
  }

  async getHistory(): Promise<TaskHistoryEntry[]> {
    const result = await this.pool.query<TaskHistoryRow>(
      'SELECT task_id, action, timestamp FROM task_history ORDER BY id ASC',
    );
    return result.rows.map((row) => ({
      taskId: row.task_id,
      action: row.action as TaskHistoryEntry['action'],
      timestamp: row.timestamp,
    }));
  }

  async appendHistory(entry: TaskHistoryEntry): Promise<void> {
    await this.pool.query(
      'INSERT INTO task_history (task_id, action, timestamp) VALUES ($1, $2, $3)',
      [entry.taskId, entry.action, entry.timestamp],
    );
  }
}
