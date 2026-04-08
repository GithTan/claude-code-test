-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS amc_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amc_contract_id UUID NOT NULL REFERENCES amc_contracts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  performed_by TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE amc_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage amc_activity" ON amc_activity;

CREATE POLICY "Authenticated users can manage amc_activity"
  ON amc_activity
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
