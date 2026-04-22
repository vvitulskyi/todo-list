import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import * as api from '@/api/tasks';
import {
  type BreakdownTaskResult,
  type CreateTaskInput,
  type SuggestPlanItem,
  type Task,
  TaskStatus,
  type UpdateTaskInput,
} from '@/types/task';

export type TaskFilter = 'all' | TaskStatus;

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [aiLoading, setAiLoading] = useState(false);

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchTasks();
      data.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setTasks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (input: CreateTaskInput) => {
    try {
      const created = await api.createTask(input);
      setTasks((prev) => [created, ...prev]);
      toast.success('Task created');
      return created;
    } catch (e) {
      toast.error('Failed to create task');
      throw e;
    }
  }, []);

  const update = useCallback(async (id: string, input: UpdateTaskInput) => {
    try {
      const existing = tasks.find((t) => t.id === id);
      if (!existing) throw new Error('Task not found locally');

      const merged = { ...existing, ...input };
      const updated = await api.updateTask(id, {
        title: merged.title,
        priority: merged.priority,
        status: merged.status,
        description: merged.description ?? undefined,
        dueDate: merged.dueDate ?? undefined,
        subTasks: merged.subTasks ?? undefined,
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success('Task updated');
      return updated;
    } catch (e) {
      toast.error('Failed to update task');
      throw e;
    }
  }, [tasks]);

  const remove = useCallback(async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success('Task deleted');
    } catch (e) {
      toast.error('Failed to delete task');
      throw e;
    }
  }, []);

  const suggestPlan = useCallback(async (): Promise<SuggestPlanItem[]> => {
    setAiLoading(true);
    try {
      const plan = await api.suggestPlan();
      return plan;
    } catch (e) {
      toast.error('Failed to get AI plan suggestion');
      throw e;
    } finally {
      setAiLoading(false);
    }
  }, []);

  const breakdownTask = useCallback(
    async (taskId: string): Promise<BreakdownTaskResult> => {
      setAiLoading(true);
      try {
        const result = await api.breakdownTask(taskId);
        if (!('status' in result && result.status === 'needs_clarification')) {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? (result as Task) : t)),
          );
          toast.success('Subtasks generated and saved');
        }
        return result;
      } catch (e) {
        toast.error('Failed to generate subtasks');
        throw e;
      } finally {
        setAiLoading(false);
      }
    },
    [],
  );

  return {
    tasks,
    filteredTasks,
    loading,
    error,
    filter,
    setFilter,
    refresh,
    create,
    update,
    remove,
    suggestPlan,
    breakdownTask,
    aiLoading,
  };
}


