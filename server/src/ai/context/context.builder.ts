import type { Task, TaskHistoryEntry } from '../../tasks/dto/TaskResponse.dto';
import { TaskStatus } from '../../tasks/enums/TaskStatus.enum';

export interface AIContext {
  activeTasks: Task[];
  completedTasks: Task[];
  recentHistory: TaskHistoryEntry[];
}

export interface EnrichedBreakdownInput {
  currentTask: Task;
  context: AIContext;
  relatedTasks: Task[];
}

export function buildAIContext(
  tasks: Task[],
  history: TaskHistoryEntry[],
): AIContext {
  return {
    activeTasks: tasks.filter((t) => t.status !== TaskStatus.Completed),
    completedTasks: tasks.filter((t) => t.status === TaskStatus.Completed),
    recentHistory: history.slice(-20),
  };
}

export function findRelatedTasks(target: Task, tasks: Task[]): Task[] {
  const firstWord = target.title.toLowerCase().split(' ')[0];

  if (!firstWord || firstWord.length < 3) return [];

  return tasks
    .filter(
      (t) => t.id !== target.id && t.title.toLowerCase().includes(firstWord),
    )
    .slice(0, 5);
}

export function buildEnrichedInput(
  task: Task,
  tasks: Task[],
  history: TaskHistoryEntry[],
): EnrichedBreakdownInput {
  return {
    currentTask: task,
    context: buildAIContext(tasks, history),
    relatedTasks: findRelatedTasks(task, tasks),
  };
}
