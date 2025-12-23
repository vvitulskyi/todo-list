export enum TaskPriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum TaskStatus {
  Pending = 'pending',
  Completed = 'completed',
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  status?: TaskStatus;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;


