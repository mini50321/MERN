
-- Fundraiser donations table
CREATE TABLE fundraiser_donations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fundraiser_id INTEGER NOT NULL,
  donor_user_id TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_anonymous BOOLEAN DEFAULT 0,
  message TEXT,
  payment_status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fundraiser_donations ON fundraiser_donations(fundraiser_id);
CREATE INDEX idx_donor_donations ON fundraiser_donations(donor_user_id);
