import { useMemo, useState } from 'react';

import { FilterBar } from '@/components/FilterBar';
import { TaskFormDialog } from '@/components/TaskFormDialog';
import { TaskList } from '@/components/TaskList';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Toaster } from '@/components/ui/Sonner';
import { useTasks } from '@/hooks/useTasks';
import { TaskStatus, type Task } from '@/types/task';

function App() {
  const { filteredTasks, loading, error, filter, setFilter, refresh, create, update, remove } = useTasks();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const editOpen = Boolean(editTask);

  const headline = useMemo(() => {
    if (filter === 'all') return 'All tasks';
    return filter === TaskStatus.Pending ? 'Pending tasks' : 'Completed tasks';
  }, [filter]);

  return (
    <div className="min-h-dvh bg-background">
      <Toaster />

      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your personal tasks with a fast, clean workflow.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>Create task</Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">{headline}</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading…' : `${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <FilterBar value={filter} onChange={setFilter} />
        </div>

        <Separator className="my-5" />

        <TaskList
          tasks={filteredTasks}
          loading={loading}
          error={error}
          onRetry={() => void refresh()}
          onToggleCompleted={async (id, nextCompleted) => {
            await update(id, {
              status: nextCompleted ? TaskStatus.Completed : TaskStatus.Pending,
            });
          }}
          onEdit={(t) => setEditTask(t)}
          onDelete={async (id) => {
            await remove(id);
          }}
        />
      </main>

      <TaskFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onCreate={async (input) => {
          await create(input);
        }}
        onUpdate={async () => {
        }}
      />

      <TaskFormDialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) setEditTask(null);
        }}
        mode="edit"
        task={editTask ?? undefined}
        onCreate={async () => {
        }}
        onUpdate={async (id, input) => {
          await update(id, input);
        }}
      />
    </div>
  );
}

export default App;
