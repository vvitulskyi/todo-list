import { EmbeddingService } from '../embedding/embedding.service';
import type { Task, TaskHistoryEntry } from '../../tasks/dto/TaskResponse.dto';
import { TaskStatus } from '../../tasks/enums/TaskStatus.enum';
import type { TasksRepository } from '../../tasks/tasks.repository';

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

export async function findRelatedTasks(
  target: Task,
  repo: TasksRepository,
  embeddingService: EmbeddingService,
  limit = 5,
): Promise<Task[]> {
  const text = embeddingService.buildText(target);
  const embedding = await embeddingService.embed(text);
  const similar = await repo.findSimilar(embedding, limit + 1);
  return similar.filter((t) => t.id !== target.id).slice(0, limit);
}

export async function buildEnrichedInput(
  task: Task,
  tasks: Task[],
  history: TaskHistoryEntry[],
  repo: TasksRepository,
  embeddingService: EmbeddingService,
): Promise<EnrichedBreakdownInput> {
  const context = buildAIContext(tasks, history);
  const relatedTasks = await findRelatedTasks(task, repo, embeddingService);

  return {
    currentTask: task,
    context,
    relatedTasks,
  };
}
