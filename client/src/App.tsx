import { useMemo, useState } from 'react';
import { BrainCircuit, X } from 'lucide-react';

import { FilterBar } from '@/components/FilterBar';
import { TaskFormDialog } from '@/components/TaskFormDialog';
import { TaskList } from '@/components/TaskList';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Toaster } from '@/components/ui/Sonner';
import { useTasks } from '@/hooks/useTasks';
import { TaskPriority, TaskStatus, type SubTask, type SuggestPlanItem, type Task } from '@/types/task';
import { toast } from 'sonner';

function priorityBadgeVariant(priority: TaskPriority) {
  if (priority === TaskPriority.High) return 'destructive' as const;
  if (priority === TaskPriority.Low) return 'secondary' as const;
  return 'default' as const;
}

function App() {
  const {
    tasks,
    filteredTasks,
    loading,
    error,
    filter,
    setFilter,
    refresh,
    create,
    update,
    remove,
    suggestPlan,
    breakdownTask,
    aiLoading,
  } = useTasks();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[] | null>(null);
  const [plan, setPlan] = useState<SuggestPlanItem[] | null>(null);
  const [planOpen, setPlanOpen] = useState(false);

  const editOpen = Boolean(editTask);

  const headline = useMemo(() => {
    if (filter === 'all') return 'All tasks';
    return filter === TaskStatus.Pending ? 'Pending tasks' : 'Completed tasks';
  }, [filter]);

  const handleSuggestPlan = async () => {
    try {
      const result = await suggestPlan();
      if (result.length === 0) {
        toast.info('No pending tasks to plan');
        return;
      }
      setPlan(result);
      setPlanOpen(true);
    } catch {
      // toast already shown in hook
    }
  };

  const handleToggleSubTask = async (taskId: string, updatedSubTask: SubTask) => {
    const task = filteredTasks.find((t) => t.id === taskId);
    if (!task?.subTasks) return;
    const newSubTasks = task.subTasks.map((s) =>
      s.id === updatedSubTask.id ? updatedSubTask : s,
    );
    await update(taskId, { subTasks: newSubTasks });
  };

  const handleBreakdown = async (taskId: string) => {
    const result = await breakdownTask(taskId);
    if ('status' in result && result.status === 'needs_clarification') {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setClarificationQuestions(result.questions);
        setEditTask(task);
      }
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Toaster />

      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your personal tasks with a fast, clean workflow.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void handleSuggestPlan()}
              disabled={aiLoading}
              className="gap-2"
            >
              {aiLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <BrainCircuit className="h-4 w-4" />
              )}
              Suggest Plan
            </Button>
            <Button onClick={() => setCreateOpen(true)} disabled={aiLoading}>
              Create task
            </Button>
          </div>
        </div>
      </header>

      {planOpen && plan && (
        <div className="border-b bg-muted/40">
          <div className="mx-auto max-w-4xl px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">AI Suggested Plan for Today</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPlanOpen(false)}
                disabled={aiLoading}
                aria-label="Close plan"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ol className="space-y-2">
              {plan.map((item, idx) => (
                <li key={item.taskId} className="flex items-start gap-3 rounded-md border bg-card p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.task.title}</span>
                      <Badge variant={priorityBadgeVariant(item.task.priority as TaskPriority)}>
                        {item.task.priority}
                      </Badge>
                      {item.task.dueDate && (
                        <Badge variant="outline">Due {item.task.dueDate}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium">{headline}</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading…' : `${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <FilterBar value={filter} onChange={setFilter} disabled={aiLoading} />
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
          onEdit={(t) => {
            setClarificationQuestions(null);
            setEditTask(t);
          }}
          onDelete={async (id) => {
            await remove(id);
          }}
          onBreakdown={async (taskId) => {
            await handleBreakdown(taskId);
          }}
          onToggleSubTask={handleToggleSubTask}
          aiBusy={aiLoading}
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
          if (!open) {
            setEditTask(null);
            setClarificationQuestions(null);
          }
        }}
        mode="edit"
        task={editTask ?? undefined}
        clarificationQuestions={clarificationQuestions ?? undefined}
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
