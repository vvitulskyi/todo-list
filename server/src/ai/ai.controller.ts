import { Controller, Param, Post } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SubTask, Task } from '../tasks/dto/TaskResponse.dto';
import { TaskStatus } from '../tasks/enums/TaskStatus.enum';
import { TasksService } from '../tasks/tasks.service';
import { AiService } from './ai.service';
import type { SuggestPlanResponseDto } from './dto/suggest-plan.dto';

export type GenerateSubTasksResult =
  | { status: 'needs_clarification'; questions: string[] }
  | Task;

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

  @Post('breakdown/:taskId')
  async breakdown(
    @Param('taskId') taskId: string,
  ): Promise<GenerateSubTasksResult> {
    const [task, allTasks, history] = await Promise.all([
      this.tasksService.findOne(taskId),
      this.tasksService.getAll(),
      this.tasksService.getHistory(),
    ]);

    const aiResult = await this.aiService.breakdownTask(
      task,
      allTasks,
      history,
    );

    if (aiResult.needsClarification) {
      return { status: 'needs_clarification', questions: aiResult.questions };
    }

    const subTasks: SubTask[] = aiResult.subtasks.map((title) => ({
      id: randomUUID(),
      title,
      done: false,
    }));

    return this.tasksService.update(taskId, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
      subTasks,
    });
  }
}
