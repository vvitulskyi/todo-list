import { useMemo, useState } from 'react';
import { CheckSquare, ListTodo, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/AlertDialog';
import { cn } from '@/lib/utils';
import { TaskPriority, TaskStatus, type Task, type SubTask } from '@/types/task';

function priorityBadgeVariant(priority: TaskPriority) {
  if (priority === TaskPriority.High) return 'destructive' as const;
  if (priority === TaskPriority.Low) return 'secondary' as const;
  return 'default' as const;
}

function formatPriority(p: TaskPriority) {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function sortSubTasksByDoneAndOriginalOrder(subTasks: SubTask[]): SubTask[] {
  const indexed = subTasks.map((s, originalIndex) => ({ s, originalIndex }));
  const incomplete = indexed
    .filter(({ s }) => !s.done)
    .sort((a, b) => a.originalIndex - b.originalIndex);
  const complete = indexed
    .filter(({ s }) => s.done)
    .sort((a, b) => a.originalIndex - b.originalIndex);
  return [...incomplete, ...complete].map(({ s }) => s);
}

export function TaskItem({
  task,
  onToggleCompleted,
  onEdit,
  onDelete,
  onBreakdown,
  onToggleSubTask,
  busy,
}: {
  task: Task;
  onToggleCompleted: (id: string, nextCompleted: boolean) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  onBreakdown: (taskId: string) => Promise<void>;
  onToggleSubTask: (taskId: string, subTask: SubTask) => Promise<void>;
  busy?: boolean;
}) {
  const [localBusy, setLocalBusy] = useState(false);
  const [breakdownBusy, setBreakdownBusy] = useState(false);
  const isBusy = Boolean(busy || localBusy);
  const subTaskControlsDisabled = isBusy || breakdownBusy;

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const dueText = due && !Number.isNaN(due.getTime()) ? due.toISOString().slice(0, 10) : task.dueDate;

  const subTasksList = task.subTasks;
  const hasSubTasks = Array.isArray(subTasksList) && subTasksList.length > 0;

  const sortedSubTasks = useMemo(() => {
    if (!subTasksList?.length) return [];
    return sortSubTasksByDoneAndOriginalOrder(subTasksList);
  }, [subTasksList]);

  const doneSubTaskCount = subTasksList?.filter((s) => s.done).length ?? 0;
  const totalSubTasks = subTasksList?.length ?? 0;
  const progressPct =
    totalSubTasks > 0 ? Math.round((doneSubTaskCount / totalSubTasks) * 100) : 0;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <input
            aria-label={
              task.status === TaskStatus.Completed ? 'Mark as pending' : 'Mark as completed'
            }
            type="checkbox"
            className="mt-1 h-4 w-4 accent-black"
            checked={task.status === TaskStatus.Completed}
            disabled={isBusy}
            onChange={async (e) => {
              setLocalBusy(true);
              try {
                await onToggleCompleted(task.id, e.target.checked);
              } finally {
                setLocalBusy(false);
              }
            }}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={cn(
                  'truncate font-medium',
                  task.status === TaskStatus.Completed && 'line-through text-muted-foreground',
                )}
              >
                {task.title}
              </h3>
              <Badge variant={priorityBadgeVariant(task.priority)}>{formatPriority(task.priority)}</Badge>
              <Badge variant={task.status === TaskStatus.Completed ? 'secondary' : 'outline'}>
                {task.status}
              </Badge>
              {dueText ? <Badge variant="outline">Due {dueText}</Badge> : null}
            </div>
            {task.description ? <p className="mt-2 text-sm text-muted-foreground">{task.description}</p> : null}
            <p className="mt-2 text-xs text-muted-foreground">
              Updated {new Date(task.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={isBusy || breakdownBusy || task.status === TaskStatus.Completed}
            aria-label="Generate subtasks"
            title="Generate subtasks with AI"
            onClick={async () => {
              setBreakdownBusy(true);
              try {
                await onBreakdown(task.id);
              } finally {
                setBreakdownBusy(false);
              }
            }}
          >
            {breakdownBusy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : hasSubTasks ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <ListTodo className="h-4 w-4" />
            )}
          </Button>

          <Button variant="outline" size="icon" onClick={() => onEdit(task)} disabled={isBusy} aria-label="Edit task">
            <Pencil />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" disabled={isBusy} aria-label="Delete task">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The task will be removed permanently.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    void onDelete(task.id);
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {hasSubTasks && (
        <div className="mt-4 border-t pt-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Subtasks
            </p>
            <p className="text-xs text-muted-foreground">
              {doneSubTaskCount} of {totalSubTasks} done
            </p>
          </div>
          <div
            className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Subtasks completed"
          >
            <div
              className="h-full rounded-full bg-foreground/25 transition-[width] duration-200 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <ol className="space-y-2">
            {sortedSubTasks.map((subtask, idx) => (
              <li key={subtask.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-sm transition-colors',
                    'hover:bg-muted/50',
                    subTaskControlsDisabled && 'pointer-events-none opacity-60',
                  )}
                >
                  <input
                    type="checkbox"
                    aria-label={
                      subtask.done ? 'Mark subtask as pending' : 'Mark subtask as done'
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 accent-black"
                    checked={subtask.done}
                    disabled={subTaskControlsDisabled}
                    onChange={() => {
                      void onToggleSubTask(task.id, { ...subtask, done: !subtask.done });
                    }}
                  />
                  <span
                    className={cn(
                      'min-w-0 flex-1 leading-snug',
                      subtask.done && 'text-muted-foreground line-through',
                    )}
                  >
                    <span className="mr-1.5 tabular-nums text-xs text-muted-foreground">
                      {idx + 1}.
                    </span>
                    {subtask.title}
                  </span>
                </label>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
