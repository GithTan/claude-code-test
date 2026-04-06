-- Phase 2: Multi-unit specs, Action Items, Finished Projects
-- Run this in Supabase SQL Editor

-- 1. New columns on ops_projects
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS handed_over_date DATE;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS year_completed INTEGER;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS drive_type TEXT;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS use_type TEXT;

-- 2. project_units: per-unit elevator specs for pipeline projects
CREATE TABLE IF NOT EXISTS project_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  unit_number INTEGER NOT NULL DEFAULT 1,
  unit_label TEXT,
  is_home_elevator BOOLEAN DEFAULT false,
  with_structure BOOLEAN DEFAULT false,
  drive_type TEXT CHECK (drive_type IN ('traction', 'platform', 'hydraulic')),
  use_type TEXT CHECK (use_type IN ('passenger', 'service')),
  brand TEXT,
  capacity_kg INTEGER,
  stops INTEGER,
  openings INTEGER,
  floors INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_pipeline_unit UNIQUE (pipeline_id, unit_number)
);

-- 3. action_items: "Needs to be Addressed" board
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  checked_by_name TEXT,
  checked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- RLS for action_items (all authenticated users can read/write)
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage action_items"
  ON action_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS for project_units (all authenticated users)
ALTER TABLE project_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage project_units"
  ON project_units FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
