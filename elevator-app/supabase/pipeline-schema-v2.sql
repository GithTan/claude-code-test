-- Run this in Supabase SQL Editor to update the pipelines table

-- Make supplier optional (no longer required)
ALTER TABLE pipelines ALTER COLUMN supplier DROP NOT NULL;
ALTER TABLE pipelines ALTER COLUMN supplier SET DEFAULT '';

-- Add new elevator classification columns
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS elevator_type TEXT;
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS home_elevator_type TEXT;
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS with_structure BOOLEAN;
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS unit_count INTEGER DEFAULT 1;

-- Make customer_id optional in installation_projects
ALTER TABLE installation_projects ALTER COLUMN customer_id DROP NOT NULL;
