import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { TaskPriority } from '../enums/TaskPriority.enum';
import { TaskStatus } from '../enums/TaskStatus.enum';

export class UpdateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate?: string;

  @IsEnum(TaskStatus)
  status!: TaskStatus;
}
