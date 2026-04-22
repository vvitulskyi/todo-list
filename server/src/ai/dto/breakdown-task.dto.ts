import { IsString } from 'class-validator';
import type { BreakdownValidated } from '../validation/breakdown.schema';

export class BreakdownTaskDto {
  @IsString()
  taskId!: string;
}

export type BreakdownTaskResult = BreakdownValidated;

export interface BreakdownNeedsClarificationResponse {
  status: 'needs_clarification';
  questions: string[];
}
