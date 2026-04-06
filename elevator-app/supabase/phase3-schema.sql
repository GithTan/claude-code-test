-- Phase 3: Pipeline link, last-updated-by tracking
-- Run in Supabase SQL Editor

-- Link ops_projects back to their originating pipeline
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL;

-- Track who last updated a project (name string, not user ID)
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS last_updated_by TEXT;
