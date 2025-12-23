import type { CreateTaskInput, Task, UpdateTaskInput } from '@/types/task';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function fetchTasks(): Promise<Task[]> {
  return handle<Task[]>(await fetch('/api/tasks'));
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return handle<Task>(
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  return handle<Task>(
    await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteTask(id: string): Promise<void> {
  await handle<void>(
    await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  );
}


