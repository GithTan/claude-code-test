-- Run this in Supabase SQL Editor

ALTER TABLE ops_projects
  ADD COLUMN IF NOT EXISTS owner_role TEXT DEFAULT 'operations'
    CHECK (owner_role IN ('operations', 'finance', 'admin'));

ALTER TABLE ops_projects
  ADD COLUMN IF NOT EXISTS client_contract_approval BOOLEAN DEFAULT FALSE;

ALTER TABLE ops_projects
  ADD COLUMN IF NOT EXISTS client_drawing_approval BOOLEAN DEFAULT FALSE;

ALTER TABLE ops_projects
  ADD COLUMN IF NOT EXISTS engineer_technical_approval BOOLEAN DEFAULT FALSE;

ALTER TABLE ops_projects
  ADD COLUMN IF NOT EXISTS supplier_contract_approval BOOLEAN DEFAULT FALSE;

ALTER TABLE ops_projects
  ADD COLUMN IF NOT EXISTS escalation_notified_at TIMESTAMPTZ;
