-- Phase 2b: Allow project_units to link to ops_projects (not just pipelines)
-- Run this in Supabase SQL Editor

ALTER TABLE project_units ADD COLUMN IF NOT EXISTS ops_project_id UUID REFERENCES ops_projects(id) ON DELETE CASCADE;

-- Make pipeline_id optional (was required before)
ALTER TABLE project_units ALTER COLUMN pipeline_id DROP NOT NULL;

-- Drop old unique constraint and replace with flexible one
ALTER TABLE project_units DROP CONSTRAINT IF EXISTS unique_pipeline_unit;
CREATE UNIQUE INDEX IF NOT EXISTS unique_pipeline_unit ON project_units (pipeline_id, unit_number) WHERE pipeline_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_ops_project_unit ON project_units (ops_project_id, unit_number) WHERE ops_project_id IS NOT NULL;
