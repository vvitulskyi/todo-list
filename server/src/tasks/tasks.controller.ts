import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/CreateTask.dto';
import type { TaskResponseDto } from './dto/TaskResponse.dto';
import { UpdateTaskDto } from './dto/UpdateTask.dto';
import { TasksService } from './tasks.service';

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getAll(): Promise<TaskResponseDto[]> {
    const tasks = await this.tasksService.getAll();
    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      priority: task.priority,
      dueDate: task.dueDate ?? null,
      status: task.status,
      subTasks: task.subTasks ?? null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));
  }

  @Post()
  async create(@Body() dto: CreateTaskDto): Promise<TaskResponseDto> {
    const task = await this.tasksService.create(dto);
    return {
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      priority: task.priority,
      dueDate: task.dueDate ?? null,
      status: task.status,
      subTasks: task.subTasks ?? null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.tasksService.update(id, dto);
    return {
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      priority: task.priority,
      dueDate: task.dueDate ?? null,
      status: task.status,
      subTasks: task.subTasks ?? null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.tasksService.remove(id);
  }
}
