-- elevator-app/supabase/pipeline-schema.sql

-- Add coordinator role to profiles (run in Supabase SQL editor)
-- Note: if profiles.role has a CHECK constraint, update it first:
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
--   CHECK (role IN ('admin', 'operations', 'coordinator'));

CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES installation_projects(id) ON DELETE CASCADE,
  project_type TEXT NOT NULL CHECK (project_type IN (
    'new_installation', 'modernization', 'escalator', 'dismantle_install'
  )),
  supplier TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 12),
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'completed')),
  assigned_role TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  data JSONB DEFAULT '{}',
  CONSTRAINT unique_pipeline_step UNIQUE (pipeline_id, step_number)
);

CREATE TABLE IF NOT EXISTS pipeline_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_step_id UUID REFERENCES pipeline_steps(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  pipeline_step_id UUID REFERENCES pipeline_steps(id),
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Storage bucket for pipeline files (run in Supabase dashboard or SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pipeline-files', 'pipeline-files', false)
-- ON CONFLICT DO NOTHING;
