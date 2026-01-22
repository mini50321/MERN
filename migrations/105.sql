-- User wallets for storing referral rewards
CREATE TABLE user_wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  balance REAL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  total_earned REAL DEFAULT 0,
  total_redeemed REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet transactions ledger
CREATE TABLE wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  transaction_type TEXT NOT NULL,
  reference_type TEXT,
  reference_id INTEGER,
  description TEXT,
  balance_after REAL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);

-- Enhanced referral tracking with status stages
ALTER TABLE referral_tracking ADD COLUMN referral_stage TEXT DEFAULT 'registered';
ALTER TABLE referral_tracking ADD COLUMN first_transaction_at TIMESTAMP;
ALTER TABLE referral_tracking ADD COLUMN reward_unlocked_at TIMESTAMP;
ALTER TABLE referral_tracking ADD COLUMN referrer_reward_amount REAL DEFAULT 0;
ALTER TABLE referral_tracking ADD COLUMN referred_reward_amount REAL DEFAULT 0;
ALTER TABLE referral_tracking ADD COLUMN device_fingerprint TEXT;
ALTER TABLE referral_tracking ADD COLUMN ip_address TEXT;
ALTER TABLE referral_tracking ADD COLUMN is_fraud_flagged BOOLEAN DEFAULT 0;
ALTER TABLE referral_tracking ADD COLUMN fraud_reason TEXT;

-- Referral reward configuration
CREATE TABLE referral_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default referral configuration
INSERT INTO referral_config (config_key, config_value, description) VALUES 
  ('referrer_reward_amount', '100', 'Amount rewarded to referrer (in INR)'),
  ('referred_reward_amount', '50', 'Welcome bonus for referred user (in INR)'),
  ('reward_trigger', 'first_transaction', 'When reward is unlocked: registration, verification, first_transaction'),
  ('reward_cooloff_days', '7', 'Days to wait before reward can be unlocked'),
  ('reward_expiry_days', '90', 'Days after which unused rewards expire'),
  ('max_referrals_per_day', '10', 'Maximum referrals a user can make per day'),
  ('apply_code_hours', '48', 'Hours after signup during which referral code can be applied'),
  ('is_referral_enabled', 'true', 'Whether referral program is active');
