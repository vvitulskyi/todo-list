import { Controller, Post } from '@nestjs/common';
import { TaskStatus } from '../tasks/enums/TaskStatus.enum';
import { TasksService } from '../tasks/tasks.service';
import { AiService } from './ai.service';
import type { SuggestPlanResponseDto } from './dto/suggest-plan.dto';

@Controller('api/ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly tasksService: TasksService,
  ) {}

  @Post('suggest-plan')
  async suggestPlan(): Promise<SuggestPlanResponseDto[]> {
    const allTasks = await this.tasksService.getAll();
    const pending = allTasks.filter((t) => t.status !== TaskStatus.Completed);

    const planItems = await this.aiService.suggestPlan(pending);

    const taskMap = new Map(allTasks.map((t) => [t.id, t]));

    return planItems
      .filter((item) => taskMap.has(item.taskId))
      .map((item) => {
        const task = taskMap.get(item.taskId)!;
        return {
          taskId: item.taskId,
          reason: item.reason,
          task: {
            id: task.id,
            title: task.title,
            priority: task.priority,
            status: task.status,
            createdAt: task.createdAt,
            dueDate: task.dueDate ?? null,
          },
        };
      });
  }
}
