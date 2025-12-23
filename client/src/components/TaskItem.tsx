import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

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
import { TaskPriority, TaskStatus, type Task } from '@/types/task';

function priorityBadgeVariant(priority: TaskPriority) {
  if (priority === TaskPriority.High) return 'destructive' as const;
  if (priority === TaskPriority.Low) return 'secondary' as const;
  return 'default' as const;
}

function formatPriority(p: TaskPriority) {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function TaskItem({
  task,
  onToggleCompleted,
  onEdit,
  onDelete,
  busy,
}: {
  task: Task;
  onToggleCompleted: (id: string, nextCompleted: boolean) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  busy?: boolean;
}) {
  const [localBusy, setLocalBusy] = useState(false);
  const isBusy = Boolean(busy || localBusy);

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const dueText = due && !Number.isNaN(due.getTime()) ? due.toISOString().slice(0, 10) : task.dueDate;

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm">
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
  );
}


