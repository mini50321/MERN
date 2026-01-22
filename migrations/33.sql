
-- Fundraisers table
CREATE TABLE fundraisers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  case_type TEXT NOT NULL,
  goal_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  beneficiary_name TEXT NOT NULL,
  beneficiary_contact TEXT,
  creator_user_id TEXT NOT NULL,
  verification_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'active',
  end_date DATE,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fundraisers_creator ON fundraisers(creator_user_id);
CREATE INDEX idx_fundraisers_status ON fundraisers(verification_status, status);
