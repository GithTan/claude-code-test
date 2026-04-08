CREATE TABLE IF NOT EXISTS sensitive_page_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT NOT NULL,
  page_label TEXT,
  page_path TEXT,
  viewed_by TEXT,
  viewer_role TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sensitive_page_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage sensitive_page_access" ON sensitive_page_access;

CREATE POLICY "Authenticated users can manage sensitive_page_access"
  ON sensitive_page_access
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
