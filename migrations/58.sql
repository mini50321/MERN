
CREATE TABLE subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier_name TEXT NOT NULL UNIQUE,
  price REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  duration_months INTEGER DEFAULT 1,
  benefits TEXT,
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO subscription_plans (tier_name, price, currency, duration_months, benefits, display_order) VALUES
('free', 0, 'USD', 1, '["Basic profile features", "View news and exhibitions", "Limited job applications"]', 1),
('premium', 9.99, 'USD', 1, '["All Free features", "Unlimited job applications", "Priority support", "Advanced analytics", "Profile verification badge"]', 2),
('professional', 29.99, 'USD', 1, '["All Premium features", "Featured profile listings", "Direct messaging", "Course access", "Business tools", "API access"]', 3);
