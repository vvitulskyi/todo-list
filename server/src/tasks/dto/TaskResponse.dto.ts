import type { TaskPriority } from '../enums/TaskPriority.enum';
import type { TaskStatus } from '../enums/TaskStatus.enum';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  status: TaskStatus;
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
  createdAt: string;
  updatedAt: string;
}
