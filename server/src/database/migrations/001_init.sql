CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  due_date TEXT,
  sub_tasks JSONB,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  embedding VECTOR(1536)
);

CREATE TABLE IF NOT EXISTS task_history (
  id SERIAL PRIMARY KEY,
  task_id UUID NOT NULL,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL
);
