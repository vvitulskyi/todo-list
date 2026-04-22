import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { Task, TaskHistoryEntry } from '../tasks/dto/TaskResponse.dto';
import { buildEnrichedInput } from './context/context.builder';
import type { SuggestPlanItem } from './dto/suggest-plan.dto';
import { LLMClient } from './llm/llm.client';
import { breakdownTaskPrompt } from './prompts/breakdown-task.prompt';
import { suggestPlanPrompt } from './prompts/suggest-plan.prompt';
import {
  BreakdownSchema,
  type BreakdownValidated,
} from './validation/breakdown.schema';

const MAX_RETRIES = 3;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly llm = new LLMClient();

  async suggestPlan(tasks: Task[]): Promise<SuggestPlanItem[]> {
    const user = JSON.stringify({ tasks });
    const { content } = await this.llm.chat(suggestPlanPrompt, user);
    const parsed = this.safeParse<SuggestPlanItem[]>(content);

    if (!Array.isArray(parsed)) {
      throw new BadRequestException('AI returned unexpected format for plan');
    }

    return parsed;
  }

  async breakdownTask(
    task: Task,
    allTasks: Task[],
    history: TaskHistoryEntry[],
    attempt = 1,
  ): Promise<BreakdownValidated> {
    try {
      const enrichedInput = buildEnrichedInput(task, allTasks, history);
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
