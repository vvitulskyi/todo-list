export enum TaskPriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum TaskStatus {
  Pending = 'pending',
  Completed = 'completed',
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
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

export interface SuggestPlanItem {
  taskId: string;
  reason: string;
  task: {
    id: string;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    createdAt: string;
    dueDate: string | null;
  };
}

export type BreakdownTaskResult =
  | { status: 'needs_clarification'; questions: string[] }
  | Task;

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  subTasks?: SubTask[];
}
