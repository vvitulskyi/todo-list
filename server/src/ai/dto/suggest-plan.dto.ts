export interface SuggestPlanItem {
  taskId: string;
  reason: string;
}

export interface SuggestPlanResponseDto {
  taskId: string;
  reason: string;
  task: {
    id: string;
    title: string;
    priority: string;
    status: string;
    createdAt: string;
    dueDate: string | null;
  };
}
