У меня уже был реализован простой проект todo-list, так что я продолжил работу в нем. Все, что мне оставалось - єто создать ИИ-агент слой, который будет реализовывать логику анализа тасок.

Я использовал ChatGPT для составления High-Level архитектуры учитывая задачу:

```
Frontend (React)
   ↓
NestJS API (Tasks + AI endpoints)
   ↓
AI Orchestration Layer
   ├── Prompt Layer
   ├── Validation + Retry
   ├── RAG Context Builder
   ├── Agent Logic
   ↓
LLM (OpenAI)
   ↓
Structured Response
   ↓
TasksService → JSON storage
```

За тем в ChatGPT составил подробный план по итерационному внедрению фичи. После ревью плана итерации передавал его в Cursor, а после генерации делал ревью кода и точечные ручные правки. 

Все остальное делал в одном чате, стория чата ниже ↓


# AI integration architecture and implementation
_Exported on 4/21/2026 at 20:51:33 GMT+2 from Cursor (3.1.15)_

---

**User**

Делаем интеграцию с ИИ (с правильной архитектурой). Задача такая: "Агент должен анализировать текущий список задач и предлагать, с чего начать день, с объяснением логики. Он должен учитывать приоритет, возраст задачи, статус, а не просто возвращать первую по рангу. По названию и описанию задачи агент генерирует структурированный список подзадач и сразу создает его в приложении. Если задача сформулирована нечетко, агент должен уточнить перед генерацией. Список подзадач создается как попунктный план в новом поле для подзадач (subTasks).".

Начнем работу по шагам:

🧱 ШАГ 1 — Архитектура AI Module (как в проде)

Мы НЕ пишем “один сервис с LLM”.

Мы делаем слой:

ai/
 ├── ai.module.ts
 ├── ai.controller.ts
 ├── ai.service.ts
 ├── llm/
 │    ├── llm.client.ts
 │    ├── llm.types.ts
 ├── prompts/
 │    ├── suggest-plan.prompt.ts
 │    ├── breakdown-task.prompt.ts
 ├── dto/
 │    ├── suggest-plan.dto.ts
 │    ├── breakdown-task.dto.ts
🧠 ШАГ 2 — УСТАНОВКА (если нужно)
npm install openai

(или Anthropic, но сейчас проще через OpenAI API)

🧱 ШАГ 3 — LLM CLIENT (ядро интеграции)
llm.client.ts
import OpenAI from "openai";

export class LLMClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chat(system: string, user: string) {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
    });

    return response.choices[0].message.content;
  }
}
📌 Почему это важно (собес)

Ты отделяешь:

инфраструктуру LLM
бизнес-логику
промпты
🧱 ШАГ 4 — AI SERVICE (оркестратор)
ai.service.ts
import { Injectable } from "@nestjs/common";
import { LLMClient } from "./llm/llm.client";
import { suggestPlanPrompt } from "./prompts/suggest-plan.prompt";
import { breakdownTaskPrompt } from "./prompts/breakdown-task.prompt";

@Injectable()
export class AiService {
  private llm = new LLMClient();

  async suggestPlan(tasks: any[]) {
    const system = suggestPlanPrompt;

    const user = JSON.stringify({ tasks });

    const result = await this.llm.chat(system, user);

    return this.safeParse(result);
  }

  async breakdownTask(task: any) {
    const system = breakdownTaskPrompt;

    const user = JSON.stringify({ task });

    const result = await this.llm.chat(system, user);

    return this.safeParse(result);
  }

  private safeParse(json: string | null) {
    try {
      return JSON.parse(json || "{}");
    } catch (e) {
      throw new Error("Invalid AI response format");
    }
  }
}
🧱 ШАГ 5 — PROMPTS (самое важное в AI системах)
suggest-plan.prompt.ts
export const suggestPlanPrompt = `
You are a task prioritization system.

You must order tasks for a user's day.

Rules:
- high priority first
- older tasks are more urgent
- ignore completed tasks
- consider dueDate if exists

Return ONLY valid JSON:
[
  {
    "taskId": string,
    "reason": string
  }
]
`;
breakdown-task.prompt.ts
export const breakdownTaskPrompt = `
You are a software planning assistant.

Break a task into small actionable subtasks.

Rules:
- steps must be executable
- avoid vague items
- if task is unclear, ask questions

Return ONLY JSON:
{
  "needsClarification": boolean,
  "questions": string[],
  "subtasks": string[]
}
`;
🧱 ШАГ 6 — CONTROLLER
ai.controller.ts
import { Controller, Post, Body } from "@nestjs/common";
import { AiService } from "./ai.service";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("suggest-plan")
  suggestPlan(@Body() body: { tasks: any[] }) {
    return this.aiService.suggestPlan(body.tasks);
  }

  @Post("breakdown-task")
  breakdown(@Body() body: { task: any }) {
    return this.aiService.breakdownTask(body.task);
  }
}
🧱 ШАГ 7 — MODULE
ai.module.ts
import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";

@Module({
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
🧱 ШАГ 8 — ПОДКЛЮЧЕНИЕ В APP

В app.module.ts:

import { AiModule } from "./ai/ai.module";

@Module({
  imports: [AiModule],
})
export class AppModule {}

---

**Cursor**

Now I have a complete picture of the codebase. Let me create the plan.

---

**User**

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

**Cursor**

Now I'll update all the model-related files at once.

Now update `tasks.controller.ts` to include `subTasks` in every mapped response:

Now export `TasksService` from `TasksModule`:

Now I'll create the entire AI infrastructure layer:

Now add `openai` to `server/package.json` and create `.env.example`:

Now let's update the client. First, read the existing API and hooks files:

Now let me update the client types, API, and hooks:

Now update `useTasks.ts` to add the AI mutations:

Now read the UI components:

Now I have everything I need. Let me update `TaskItem.tsx`, `TaskList.tsx`, and `App.tsx`:

Now update `TaskList.tsx` to thread `onBreakdown` through:

Now update `App.tsx` to add the "Suggest Plan" feature and wire up breakdown:

Now let's check for linter errors in all the files we touched:

Let's do a quick sanity check to make sure the server TypeScript compiles:

Both compile cleanly. Let's mark the final todo as complete:

All 7 todos are done. Here's a summary of everything that was implemented:

---

## What was built

### Server — `server/src/ai/`

| File | Role |
|------|------|
| `llm/llm.types.ts` | `ChatMessage` / `LLMResponse` interfaces — typed LLM contract |
| `llm/llm.client.ts` | Wraps `openai` SDK; single `chat(system, user)` method, `gpt-4o-mini`, temp `0.2` |
| `prompts/suggest-plan.prompt.ts` | Rules: high→low priority, older = more urgent, dueDate overrides priority |
| `prompts/breakdown-task.prompt.ts` | Rules: concrete verb-first steps, `needsClarification` when vague |
| `dto/suggest-plan.dto.ts` | `SuggestPlanItem`, `SuggestPlanResponseDto` interfaces |
| `dto/breakdown-task.dto.ts` | `BreakdownTaskDto` (validated), `BreakdownTaskLLMResult`, clarification response |
| `ai.service.ts` | Orchestrates LLM calls; `suggestPlan()`, `breakdownTask()`, `safeParse()` |
| `ai.controller.ts` | `POST /api/ai/suggest-plan` (auto-fetches pending tasks) · `POST /api/ai/breakdown-task` (fetches task → LLM → saves subtasks or returns questions) |
| `ai.module.ts` | Imports `TasksModule`; provides `AiService`; exports for reuse |

### Server — existing files updated

- `TaskResponse.dto.ts` / `UpdateTask.dto.ts` — `subTasks?: string[]` added with `@IsArray @IsString({ each: true })` validation
- `tasks.service.ts` — `create()` initialises `subTasks: []`; `update()` preserves or replaces `subTasks`
- `tasks.controller.ts` — all three response mappings include `subTasks: task.subTasks ?? null`
- `tasks.module.ts` — `exports: [TasksService]` added so `AiModule` can inject it
- `app.module.ts` — `AiModule` imported
- `server/package.json` — `openai` declared explicitly

### Client

- `types/task.ts` — `subTasks: string[] | null` on `Task`; `SuggestPlanItem` and `BreakdownTaskResult` types
- `api/tasks.ts` — `suggestPlan()` and `breakdownTask(taskId)` API functions
- `hooks/useTasks.ts` — `suggestPlan`, `breakdownTask`, `aiLoading` exposed
- `TaskItem.tsx` — `ListTodo/CheckSquare` button triggers AI breakdown per task; numbered subtask list renders below the card
- `TaskList.tsx` — `onBreakdown` prop threaded through
- `App.tsx` — "Suggest Plan" header button with spinner; inline ordered plan panel with reasoning; clarification questions surfaced via toast

### To run

Create a `.env` file at the repo root (copy from `.env.example`) and set your key:

```
OPENAI_API_KEY=sk-...
```

Then `npm run dev` as usual.

---

**User**

Переходим ко второму этапу: делаем breakdown-task + сохранение subTasks в TasksService

🧱 ШАГ 1 — ОБНОВЛЯЕМ DOMAIN MODEL
Task (server)

Добавляем поле:

subTasks?: {
  id: string;
  title: string;
  done: boolean;
}[];
📌 Почему так

Мы не храним “текст”, мы храним структуру управления состоянием UI

🧱 ШАГ 2 — DTO ДЛЯ AI RESPONSE (ВАЖНО)

Создаём строгий контракт:

breakdown-task.result.dto.ts
export interface BreakdownTaskResult {
  needsClarification: boolean;
  questions: string[];
  subtasks: string[];
}
🧱 ШАГ 3 — УЛУЧШАЕМ AI SERVICE

Теперь AI не просто возвращает JSON — он влияет на систему.

ai.service.ts (обновление breakdown)
async breakdownTask(task: any) {
  const system = breakdownTaskPrompt;

  const user = JSON.stringify({ task });

  const result = await this.llm.chat(system, user);

  const parsed = this.safeParse(result);

  return parsed as {
    needsClarification: boolean;
    questions: string[];
    subtasks: string[];
  };
}
🧱 ШАГ 4 — ИНТЕГРАЦИЯ В TASKS SERVICE

Вот тут начинается “реальный backend AI”.

📌 Добавляем метод
tasks.service.ts
async generateSubTasksWithAI(taskId: string) {
  const task = await this.findOne(taskId);

  const aiResult = await this.aiService.breakdownTask(task);

  if (aiResult.needsClarification) {
    return {
      status: "needs_clarification",
      questions: aiResult.questions,
    };
  }

  const subTasks = aiResult.subtasks.map((title) => ({
    id: crypto.randomUUID(),
    title,
    done: false,
  }));

  const updatedTask = {
    ...task,
    subTasks,
    updatedAt: new Date().toISOString(),
  };

  return this.update(taskId, updatedTask);
}
🧱 ШАГ 5 — ПОДКЛЮЧАЕМ AI SERVICE В TASKS SERVICE
constructor(
  private readonly aiService: AiService,
) {}
🧱 ШАГ 6 — ДОБАВЛЯЕМ ENDPOINT
tasks.controller.ts
@Post(":id/breakdown")
generateSubTasks(@Param("id") id: string) {
  return this.tasksService.generateSubTasksWithAI(id);
}

---

**Cursor**

Let me read the relevant files to understand the current state before making changes.

Now I have a complete picture. The key architectural change here is:
- `subTasks` becomes structured objects `{ id, title, done }` instead of plain strings
- `generateSubTasksWithAI` moves into `TasksService` (with `AiService` injected)
- New endpoint `POST /api/tasks/:id/breakdown` on `TasksController`
- `forwardRef` handles the circular dep (`TasksModule` ↔ `AiModule`)

**Step 1 — Domain model: `SubTask` structured type**

Now update `UpdateTask.dto.ts` with a proper `SubTaskDto` class using `ValidateNested`:

Also update the `breakdown-task.dto.ts` in the AI layer to align the result contract with the new terminology:

**Step 2 — `TasksService` gets `AiService` injected + new methods**

First update `tasks.service.ts`:

Now update `tasks.module.ts` to import `AiModule` with `forwardRef`:

Update `ai.module.ts` to use `forwardRef` symmetrically:

Also update `ai.service.ts` to align the return type with the cleaned-up `BreakdownTaskResult` DTO:

**Step 3 — Controller changes**

Add `POST :id/breakdown` to `tasks.controller.ts` and remove the old `breakdown-task` from `ai.controller.ts`:

Now remove the redundant `breakdown-task` endpoint from `ai.controller.ts` and fix the stale import:

**Step 4 — Client updates**

First compile-check the server to make sure everything is solid before touching the client:

Server compiles cleanly. Now update the client:

Update `types/task.ts` — add `SubTask` interface, update `Task.subTasks`, update `BreakdownTaskResult` to match new server response shape:

Update `api/tasks.ts` — `breakdownTask` now calls the new `POST /api/tasks/:id/breakdown` endpoint:

Update `useTasks.ts` — fix the `BreakdownTaskResult` discriminant (`status` instead of `needsClarification`):

Now update `App.tsx` to match the new discriminant:

Now update `TaskItem.tsx` to render the `done` toggle on each subtask:

Now also add the `onToggleSubTask` prop through `TaskList` and wire it up in `App.tsx`:

Now add `onToggleSubTask` in `App.tsx`. First I need a handler that calls `api.updateTask` with the updated subtask array, and also add the handler to `useTasks`:

The `UpdateTaskInput` type and `useTasks.update` don't include `subTasks` yet. Let me fix that:

Now update the `update` callback in `useTasks.ts` to forward `subTasks`:

Also update `api/tasks.ts` — `updateTask` sends `UpdateTaskInput` which now includes `subTasks`:

Also clean up the unused `as never` cast in `App.tsx` now that `UpdateTaskInput` includes `subTasks`:

The `SubTask` import in `api/tasks.ts` is unused (it's only used as part of `UpdateTaskInput`). Let me clean that up:

Now run both TypeScript checks:

Both compile clean. Let's also run the linter:

All done. Here's a summary of everything changed in this step:

---

## What changed

### Server — domain model

`SubTask` is now a structured object `{ id: string; title: string; done: boolean }` — not a plain string. This is the right shape for state management: the UI can toggle `done` without re-generating anything.

- `TaskResponse.dto.ts` — added `SubTask` interface; updated `Task.subTasks` and `TaskResponseDto.subTasks`
- `UpdateTask.dto.ts` — replaced `@IsString({ each: true })` with a full `SubTaskDto` class + `@ValidateNested({ each: true }) @Type(() => SubTaskDto)` — validated correctly through the HTTP pipeline

### Server — AI orchestration moved into `TasksService`

`TasksService` now owns the full breakdown flow:

- `findOne(id)` — single-task lookup (throws `NotFoundException`)
- `generateSubTasksWithAI(taskId)` — calls `AiService.breakdownTask()`, maps raw `string[]` subtasks to `SubTask[]` objects with `randomUUID()` ids, persists via `update()`, returns either the updated `Task` or `{ status: 'needs_clarification', questions }` 

`AiService` is injected into `TasksService` via `@Inject(forwardRef(() => AiService))`. Both modules use `forwardRef(() => ...)` to resolve the circular dependency cleanly.

### Server — endpoints

| Before | After |
|---|---|
| `POST /api/ai/breakdown-task` (in `AiController`) | removed |
| — | `POST /api/tasks/:id/breakdown` (in `TasksController`) |
| `POST /api/ai/suggest-plan` | unchanged |

### Client

- `SubTask` interface added to `types/task.ts`; `BreakdownTaskResult` discriminant changed to `status: 'needs_clarification'`
- `UpdateTaskInput` now includes `subTasks?: SubTask[]`
- `api/tasks.ts` — `breakdownTask` calls `POST /api/tasks/:id/breakdown` (no body needed)
- `useTasks.ts` — forwards `subTasks` in the `update` call
- `TaskItem.tsx` — subtask list shows checkboxes with `done` strikethrough state and a `(x/N done)` counter
- `TaskList.tsx` / `App.tsx` — `onToggleSubTask` wired end-to-end; toggling a subtask checkbox persists the updated array via `PUT /api/tasks/:id`

---

**User**

🧱 АРХИТЕКТУРА УЛУЧШЕНИЯ

Мы добавим слой:

LLM → raw response → validator → retry loop → safe output → system
🧱 ШАГ 1 — ДОБАВЛЯЕМ ZOD (валидатор)
npm install zod
🧱 ШАГ 2 — ОПРЕДЕЛЯЕМ СХЕМУ BREAKDOWN
ai/validation/breakdown.schema.ts
import { z } from "zod";

export const BreakdownSchema = z.object({
  needsClarification: z.boolean(),
  questions: z.array(z.string()),
  subtasks: z.array(z.string()),
});

export type BreakdownValidated = z.infer<typeof BreakdownSchema>;
🧱 ШАГ 3 — SAFE PARSE + VALIDATION

Мы не просто JSON.parse → мы делаем “жёсткую проверку”

ai.service.ts

Добавляем:

import { BreakdownSchema } from "./validation/breakdown.schema";
🔥 УЛУЧШЕННЫЙ safeParse
private safeValidateBreakdown(data: any) {
  const result = BreakdownSchema.safeParse(data);

  if (!result.success) {
    throw new Error("Invalid AI response structure");
  }

  return result.data;
}
🧱 ШАГ 4 — RETRY LAYER (КЛЮЧЕВОЙ МОМЕНТ)

Теперь делаем устойчивость.

📌 Идея:

Если LLM сломалась → пробуем ещё раз

ai.service.ts
async breakdownTask(task: any, attempt = 1): Promise<any> {
  const MAX_RETRIES = 3;

  try {
    const system = breakdownTaskPrompt;
    const user = JSON.stringify({ task });

    const result = await this.llm.chat(system, user);

    const parsed = JSON.parse(result);

    return this.safeValidateBreakdown(parsed);
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      throw new Error("AI failed after multiple attempts");
    }

    return this.breakdownTask(task, attempt + 1);
  }
}

---

**Cursor**

Now create the validation schema and update `ai.service.ts`:

Now update `breakdown-task.dto.ts` so `BreakdownTaskResult` uses `BreakdownValidated` as its source of truth instead of duplicating the shape:

Clean. Here's what was built and why each piece matters:

---

## What changed

### New file: `ai/validation/breakdown.schema.ts`

```typescript
export const BreakdownSchema = z.object({
  needsClarification: z.boolean(),
  questions: z.array(z.string()),
  subtasks: z.array(z.string()),
});
```

Zod is the right tool here because LLM output is an **untyped external boundary** — just like a third-party API. TypeScript generics (`safeParse<T>`) only enforce types at compile time; at runtime the cast is silent. Zod validates the actual shape at runtime and produces structured error messages showing exactly which field failed.

### Updated: `ai.service.ts`

The two concerns are now cleanly separated:

| Method | Responsibility |
|---|---|
| `safeParse<T>` | JSON parsing only — throws if string is malformed |
| `safeValidateBreakdown` | Schema validation — throws with a descriptive Zod error if shape is wrong |
| `breakdownTask(task, attempt)` | Retry orchestration — catches any error from either layer and re-attempts up to `MAX_RETRIES = 3` |

The retry loop catches **all** failure modes in one place: network errors from `LLMClient`, JSON parse failures, and Zod schema mismatches. After 3 failures it logs the root cause and throws `BadRequestException` to the controller.

### Updated: `breakdown-task.dto.ts`

`BreakdownTaskResult` is now `type BreakdownTaskResult = BreakdownValidated` — the DTO is derived from the Zod schema, not a duplicate of it. One source of truth.

---

**User**

🧱 НОВАЯ ЦЕЛЬ СИСТЕМЫ

Теперь AI будет отвечать так:

“Я учитываю не только текущие задачи, но и историю пользователя + похожие задачи”

🏗️ АРХИТЕКТУРА RAG СЛОЯ

Добавляем слой памяти:

Tasks DB (JSON)
   ↓
Context Builder
   ↓
Retriever (similar tasks + history)
   ↓
Prompt Enrichment
   ↓
LLM
🧱 ШАГ 1 — ЧТО МЫ СЧИТАЕМ “КОНТЕКСТОМ”

У тебя есть 2 источника:

1. 📌 Current Tasks (уже есть)
pending / completed
priority
dueDate
2. 📌 Task History (новое логическое поле)

Добавим:

taskHistory?: {
  taskId: string;
  action: "created" | "updated" | "completed";
  timestamp: string;
}[];
👉 Почему это важно

AI начинает понимать:

что пользователь делает часто
какие задачи “зависают”
как меняется поведение
🧱 ШАГ 2 — CONTEXT BUILDER (СЕРДЦЕ RAG)

Создаём слой:

ai/context/context.builder.ts
📌 Он собирает всё в один объект:
export function buildAIContext(tasks: any[], history: any[]) {
  return {
    activeTasks: tasks.filter(t => t.status !== "completed"),
    completedTasks: tasks.filter(t => t.status === "completed"),

    recentHistory: history.slice(-20),
  };
}
🧱 ШАГ 3 — “RETRIEVAL” ЛОГИКА (упрощённый RAG)

Мы НЕ используем vector DB пока.

Но делаем semantic-like retrieval:

📌 Похожесть задач (простая версия)
function findRelatedTasks(task, tasks) {
  return tasks
    .filter(t =>
      t.title.toLowerCase().includes(task.title.toLowerCase().split(" ")[0])
    )
    .slice(0, 5);
}
👉 Это мини-RAG без embeddings

Позже можно заменить на:

pgvector
Pinecone
Weaviate
🧱 ШАГ 4 — PROMPT ENRICHMENT (КЛЮЧЕВОЙ МОМЕНТ)

Теперь мы не отправляем просто task.

Мы отправляем:

{
  currentTask,
  activeTasks,
  relatedTasks,
  history
}
📌 ОБНОВЛЁННЫЙ breakdown prompt
You are an AI planning assistant.

You MUST consider full context:

- current task
- active tasks
- related tasks history

Use context to:
- avoid duplication
- reuse patterns
- improve breakdown quality

If similar tasks exist, reuse structure patterns.

Return JSON only:
{
  "needsClarification": boolean,
  "questions": string[],
  "subtasks": string[]
}
🧱 ШАГ 5 — ОБНОВЛЯЕМ AI SERVICE
async breakdownTask(task: any, tasks: any[], history: any[]) {
  const context = buildAIContext(tasks, history);

  const related = findRelatedTasks(task, tasks);

  const enrichedInput = {
    task,
    context,
    relatedTasks: related,
  };

  const result = await this.llm.chat(
    breakdownTaskPrompt,
    JSON.stringify(enrichedInput)
  );

  const parsed = JSON.parse(result);

  return this.safeValidateBreakdown(parsed);
}

---

**Cursor**

Now I have everything. Let me implement this systematically:

**Step 1 — Domain model: `TaskHistoryEntry` + repository history support**

Now extend `TasksRepository` to persist and retrieve history alongside tasks in the same `tasks.json` file:

Now update `TasksService` to record history events and expose `getHistory()`:

**Step 2 — Context Builder**

**Step 3 — Update `ai.service.ts` with enriched context**

**Step 4 — Context-aware breakdown prompt**

All done. Here's the full picture of what was built:

---

## What changed

### New architecture

```
POST /api/tasks/:id/breakdown
        │
TasksService.generateSubTasksWithAI()
        │
   parallel fetch: findOne() + getAll() + getHistory()
        │
        ▼
AiService.breakdownTask(task, allTasks, history)
        │
        ▼
buildEnrichedInput()  ← context.builder.ts
   ├── buildAIContext()     → { activeTasks, completedTasks, recentHistory[-20] }
   └── findRelatedTasks()   → tasks sharing the same first keyword (mini-RAG)
        │
        ▼
LLM (enriched prompt + full context JSON)
        │
        ▼
Zod validation → retry loop (max 3) → BreakdownValidated
```

### `TasksRepository` — history store

History is co-located in `tasks.json` as a separate `history` array:

```json
{ "tasks": [...], "history": [...] }
```

`appendHistory()` runs inside the write lock so it's safe under concurrent updates. `writeAll()` now does a read-before-write to preserve the `history` array when updating tasks.

### `TasksService` — event recording

| Method | Event emitted |
|---|---|
| `create()` | `created` |
| `update()` where status flips to `completed` | `completed` |
| `update()` otherwise | `updated` |
| `remove()` | nothing (task no longer exists) |

`generateSubTasksWithAI` fetches all three dependencies in parallel (`Promise.all`) before calling the AI.

### `context.builder.ts` — pure functions, no DI

- `buildAIContext` — separates active from completed tasks, keeps last 20 history entries
- `findRelatedTasks` — keyword overlap on the first meaningful word (≥ 3 chars), skips the target task itself, returns up to 5 — this is the placeholder hook for future vector embeddings
- `buildEnrichedInput` — composes the full object sent to the LLM as the `user` message

### Prompt — context-aware

The system prompt now explicitly instructs the LLM to: reuse patterns from `completedTasks`, avoid duplicating `activeTasks`, and use `relatedTasks` for structural hints.

