import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { Task, TaskHistoryEntry } from '../tasks/dto/TaskResponse.dto';
import { TasksRepository } from '../tasks/tasks.repository';
import { buildEnrichedInput } from './context/context.builder';
import { EmbeddingService } from './embedding/embedding.service';
import { LLMClient } from './llm/llm.client';
import { breakdownTaskPrompt } from './prompts/breakdown-task.prompt';
import { suggestPlanPrompt } from './prompts/suggest-plan.prompt';
import {
  BreakdownSchema,
  type BreakdownValidated,
} from './validation/breakdown.schema';
import {
  SuggestPlanSchema,
  type SuggestPlanValidated,
} from './validation/suggest-plan.schema';

const MAX_RETRIES = 3;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly llm: LLMClient,
  ) {}

  async suggestPlan(tasks: Task[]): Promise<SuggestPlanValidated> {
    const user = JSON.stringify({ tasks });
    const { content } = await this.llm.chat(suggestPlanPrompt, user);
    const parsed = this.safeParse<unknown>(content);
    return this.safeValidateSuggestPlan(parsed);
  }

  async breakdownTask(
    task: Task,
    allTasks: Task[],
    history: TaskHistoryEntry[],
    attempt = 1,
  ): Promise<BreakdownValidated> {
    const enrichedInput = await buildEnrichedInput(
      task,
      allTasks,
      history,
      this.tasksRepository,
      this.embeddingService,
    );

    try {
      const { content } = await this.llm.chat(
        breakdownTaskPrompt,
        JSON.stringify(enrichedInput),
      );
      const raw = this.safeParse<unknown>(content);
      return this.safeValidateBreakdown(raw);
    } catch (error) {
      if (attempt >= MAX_RETRIES) {
        this.logger.error(
          `AI breakdown failed after ${MAX_RETRIES} attempts for task ${task.id}`,
          error instanceof Error ? error.message : String(error),
        );
        throw new BadRequestException('AI failed after multiple attempts');
      }

      this.logger.warn(
        `AI breakdown attempt ${attempt} failed for task ${task.id}, retrying…`,
      );
      return this.breakdownTask(task, allTasks, history, attempt + 1);
    }
  }

  private safeValidateSuggestPlan(data: unknown): SuggestPlanValidated {
    const result = SuggestPlanSchema.safeParse(data);

    if (!result.success) {
      throw new BadRequestException(
        `AI returned unexpected format for plan: ${result.error.issues.map((i) => i.message).join(', ')}`,
      );
    }

    return result.data;
  }

  private safeValidateBreakdown(data: unknown): BreakdownValidated {
    const result = BreakdownSchema.safeParse(data);

    if (!result.success) {
      throw new Error(
        `Invalid AI response structure: ${result.error.issues.map((i) => i.message).join(', ')}`,
      );
    }

    return result.data;
  }

  private safeParse<T>(json: string | null): T {
    try {
      return JSON.parse(json ?? '{}') as T;
    } catch {
      throw new BadRequestException('Invalid AI response format');
    }
  }
}
