-- Production tracking & deletion approval columns for ops_projects
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS production_start_date DATE;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS deletion_pending BOOLEAN DEFAULT FALSE;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS deletion_requested_by TEXT;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
