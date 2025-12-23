import { Injectable } from '@nestjs/common';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Task } from './dto/TaskResponse.dto';

type TasksFileShape = {
  tasks: Task[];
};

@Injectable()
export class TasksRepository {
  private readonly dataFilePath = join(process.cwd(), 'data', 'tasks.json');

  private writeLock: Promise<void> = Promise.resolve();

  private async withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.writeLock;
    let release!: () => void;
    this.writeLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  private async readFileShape(): Promise<TasksFileShape> {
    try {
      const raw = await readFile(this.dataFilePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<TasksFileShape>;
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      };
    } catch {
      return { tasks: [] };
    }
  }

  private async writeFileShape(shape: TasksFileShape): Promise<void> {
    await mkdir(dirname(this.dataFilePath), { recursive: true });
    const tmp = `${this.dataFilePath}.tmp`;
    await writeFile(tmp, JSON.stringify(shape, null, 2) + '\n', 'utf-8');
    await rename(tmp, this.dataFilePath);
  }

  async getAll(): Promise<Task[]> {
    const { tasks } = await this.readFileShape();
    return tasks;
  }

  async writeAll(tasks: Task[]): Promise<void> {
    await this.withWriteLock(async () => {
      await this.writeFileShape({ tasks });
    });
  }
}
