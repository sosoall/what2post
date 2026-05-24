CREATE TABLE waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'waitlist',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_waitlist_email ON waitlist (email);
CREATE INDEX idx_waitlist_status ON waitlist (status);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT (signup from frontend)
CREATE POLICY "Allow public insert" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE for anon — only service role can read
CREATE POLICY "No public read" ON waitlist
  FOR SELECT
  USING (false);
