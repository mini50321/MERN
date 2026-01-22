DELETE FROM referral_config;
DROP TABLE referral_config;

ALTER TABLE referral_tracking DROP COLUMN fraud_reason;
ALTER TABLE referral_tracking DROP COLUMN is_fraud_flagged;
ALTER TABLE referral_tracking DROP COLUMN ip_address;
ALTER TABLE referral_tracking DROP COLUMN device_fingerprint;
ALTER TABLE referral_tracking DROP COLUMN referred_reward_amount;
ALTER TABLE referral_tracking DROP COLUMN referrer_reward_amount;
ALTER TABLE referral_tracking DROP COLUMN reward_unlocked_at;
ALTER TABLE referral_tracking DROP COLUMN first_transaction_at;
ALTER TABLE referral_tracking DROP COLUMN referral_stage;

DROP INDEX idx_wallet_transactions_user;
DROP TABLE wallet_transactions;
DROP TABLE user_wallets;
