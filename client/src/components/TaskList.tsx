import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { TaskItem } from '@/components/TaskItem';
import type { Task } from '@/types/task';
import * as React from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

export function TaskList({
  tasks,
  loading,
  error,
  onRetry,
  onToggleCompleted,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onToggleCompleted: (id: string, nextCompleted: boolean) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollMargin, setScrollMargin] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      setScrollMargin(rect.top + window.scrollY);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [tasks.length]);

  const rowVirtualizer = useWindowVirtualizer({
    count: tasks.length,
    estimateSize: () => 120,
    overscan: 6,
    scrollMargin,
  });

  if (loading) {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-destructive">Failed to load tasks: {error}</p>
        <Button className="mt-3" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="font-medium">No tasks yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Create your first task to get started.</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} role="list" aria-label="Tasks list">
      <div
        className="relative"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const t = tasks[virtualRow.index]!;
          return (
            <div
              key={t.id}
              role="listitem"
              ref={(el) => {
                if (!el) return;
                rowVirtualizer.measureElement(el);
              }}
              className="absolute left-0 top-0 w-full px-0 py-1.5"
              style={{
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
              }}
            >
              <div className="grid gap-3">
                <TaskItem
                  task={t}
                  onToggleCompleted={onToggleCompleted}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


