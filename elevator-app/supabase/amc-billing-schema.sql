-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS amc_billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amc_contract_id UUID NOT NULL REFERENCES amc_contracts(id) ON DELETE CASCADE,
  billing_month DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'billed', 'paid')),
  billed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (amc_contract_id, billing_month)
);

ALTER TABLE amc_billing_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage amc_billing_records" ON amc_billing_records;
CREATE POLICY "Authenticated users can manage amc_billing_records"
  ON amc_billing_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
