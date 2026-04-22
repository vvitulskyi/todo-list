import type { TaskPriority } from '../enums/TaskPriority.enum';
import type { TaskStatus } from '../enums/TaskStatus.enum';

export interface TaskHistoryEntry {
  taskId: string;
  action: 'created' | 'updated' | 'completed';
  timestamp: string;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  status: TaskStatus;
  subTasks?: SubTask[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskResponseDto {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  status: TaskStatus;
  subTasks: SubTask[] | null;
  createdAt: string;
  updatedAt: string;
}
