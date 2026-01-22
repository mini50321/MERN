
-- Add monthly_price and yearly_price columns
ALTER TABLE subscription_plans ADD COLUMN monthly_price REAL;
ALTER TABLE subscription_plans ADD COLUMN yearly_price REAL;

-- Migrate existing data and consolidate yearly plans
UPDATE subscription_plans 
SET monthly_price = price, 
    yearly_price = price * 10
WHERE duration_months = 1;

-- Delete the separate yearly plan entries
DELETE FROM subscription_plans WHERE duration_months = 12;

-- Drop the old price and duration_months columns (we'll keep them for now for backwards compatibility)
-- The new columns monthly_price and yearly_price will be the source of truth
