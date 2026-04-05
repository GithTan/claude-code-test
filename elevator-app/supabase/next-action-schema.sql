-- Next action tracking for ops_projects
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS next_action_date DATE;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS health TEXT DEFAULT 'on_track'
  CHECK (health IN ('on_track', 'needs_attention', 'blocked', 'overdue'));
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ;

-- Activity log table
CREATE TABLE IF NOT EXISTS project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ops_project_id UUID REFERENCES ops_projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  performed_by TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE project_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON project_activity FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Comments table
CREATE TABLE IF NOT EXISTS project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ops_project_id UUID REFERENCES ops_projects(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON project_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Billing milestones table
CREATE TABLE IF NOT EXISTS billing_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ops_project_id UUID REFERENCES ops_projects(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('downpayment','pre_shipment','delivery','installation','final_collection')),
  amount NUMERIC(14,2),
  due_date DATE,
  paid_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','invoiced','paid','overdue')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE billing_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON billing_milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Maintenance/warranty tracking
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS maintenance_start_date DATE;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS maintenance_end_date DATE;
ALTER TABLE ops_projects ADD COLUMN IF NOT EXISTS renewal_negotiation_status TEXT DEFAULT 'none'
  CHECK (renewal_negotiation_status IN ('none','in_negotiation','paid','lost'));
