-- ============================================================
-- Vibe Planner — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Projects
CREATE TABLE projects (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  current_phase TEXT NOT NULL DEFAULT 'research',
  github_repo_url TEXT,
  github_context  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversations (one per project per phase)
CREATE TABLE conversations (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tickets
CREATE TABLE tickets (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  reason              TEXT NOT NULL DEFAULT '',
  phase               TEXT NOT NULL,
  assigned_to         TEXT,
  status              TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_by          TEXT NOT NULL DEFAULT 'user' CHECK (created_by IN ('user', 'pm')),
  context_snippet     TEXT NOT NULL DEFAULT '',
  acceptance_criteria TEXT,
  priority            TEXT CHECK (priority IN ('high', 'medium', 'low')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Work Logs
CREATE TABLE work_logs (
  id         TEXT PRIMARY KEY,
  ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  author     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Roles (global, no project scope)
CREATE TABLE roles (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#7c6dfa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project Docs
CREATE TABLE project_docs (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT '未命名文件',
  content    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX ON conversations (project_id);
CREATE INDEX ON messages (conversation_id);
CREATE INDEX ON tickets (project_id);
CREATE INDEX ON work_logs (ticket_id);
CREATE INDEX ON project_docs (project_id);

-- ── Auto-update updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER project_docs_updated_at
  BEFORE UPDATE ON project_docs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security (optional but recommended) ────────────
-- Enable RLS on all tables. For personal use, allow all with anon key.
-- For multi-user use, replace with user-scoped policies.

ALTER TABLE projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_docs ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write (personal tool — single user with anon key)
CREATE POLICY "allow_all" ON projects      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON messages      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON tickets       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON work_logs     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON roles         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON project_docs  FOR ALL USING (true) WITH CHECK (true);
