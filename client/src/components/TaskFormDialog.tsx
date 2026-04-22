import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { TaskPriority, TaskStatus, type CreateTaskInput, type Task, type UpdateTaskInput } from '@/types/task';

type Mode = 'create' | 'edit';

function normalizeDueDate(value: string | null | undefined) {
  if (!value) return '';
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return value;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  mode,
  task,
  onCreate,
  onUpdate,
  busy,
  clarificationQuestions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  task?: Task;
  onCreate: (input: CreateTaskInput) => Promise<void>;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  busy?: boolean;
  clarificationQuestions?: string[];
}) {
  const hasClarification =
    mode === 'edit' &&
    Array.isArray(clarificationQuestions) &&
    clarificationQuestions.length > 0;

  const titleText = mode === 'create' ? 'Create task' : 'Edit task';
  const descText =
    mode === 'create'
      ? 'Add a new task with a title, priority, and optional details.'
      : hasClarification
        ? 'The AI needs a clearer task before it can generate subtasks. Answer the questions below by updating the title or description, then save.'
        : 'Update task details. Changes are saved to the backend.';

  const initial = useMemo(() => {
    const base = {
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? TaskPriority.Medium,
      dueDate: normalizeDueDate(task?.dueDate),
      status: task?.status ?? TaskStatus.Pending,
    };
    return base;
  }, [task]);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [priority, setPriority] = useState<TaskPriority>(initial.priority);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [status, setStatus] = useState<TaskStatus>(initial.status);
  const [errors, setErrors] = useState<{ title?: string; priority?: string; dueDate?: string }>({});

  const openNativeDatePicker = (el: HTMLInputElement) => {
    const anyEl = el as HTMLInputElement & { showPicker?: () => void };
    anyEl.showPicker?.();
  };

  useEffect(() => {
    if (!open) return;
    setTitle(initial.title);
    setDescription(initial.description);
    setPriority(initial.priority);
    setDueDate(initial.dueDate);
    setStatus(initial.status);
    setErrors({});
  }, [open, initial]);

  const validate = () => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = 'Title is required.';
    if (!priority) next.priority = 'Priority is required.';
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) next.dueDate = 'Use YYYY-MM-DD.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    if (mode === 'create') {
      await onCreate({
        title: title.trim(),
        description: description.trim() ? description.trim() : undefined,
        priority,
        dueDate: dueDate || undefined,
        status,
      });
      onOpenChange(false);
      return;
    }

    if (!task) return;
    await onUpdate(task.id, {
      title: title.trim(),
      description: description.trim() ? description.trim() : undefined,
      priority,
      dueDate: dueDate || undefined,
      status,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
          <DialogDescription>{descText}</DialogDescription>
        </DialogHeader>

        {hasClarification ? (
          <div
            className="rounded-md border border-border bg-card p-3"
            role="region"
            aria-label="Clarification questions from AI"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Please clarify
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-foreground">
              {clarificationQuestions!.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Prepare monthly report"
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger id="task-priority" aria-invalid={Boolean(errors.priority)}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.High}>High</SelectItem>
                  <SelectItem value={TaskPriority.Medium}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.Low}>Low</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority ? <p className="text-sm text-destructive">{errors.priority}</p> : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                onClick={(e) => openNativeDatePicker(e.currentTarget)}
                onFocus={(e) => openNativeDatePicker(e.currentTarget)}
                aria-invalid={Boolean(errors.dueDate)}
              />
              {errors.dueDate ? <p className="text-sm text-destructive">{errors.dueDate}</p> : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger id="task-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TaskStatus.Pending}>Pending</SelectItem>
                <SelectItem value={TaskStatus.Completed}>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button onClick={() => void submit()} type="button" disabled={busy}>
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


