
-- Restore separate yearly plans
INSERT INTO subscription_plans (tier_name, price, currency, duration_months, benefits, display_order, is_active)
SELECT 
  tier_name || '_yearly',
  monthly_price * 10,
  currency,
  12,
  benefits,
  display_order + 3,
  is_active
FROM subscription_plans
WHERE tier_name NOT LIKE '%yearly';

-- Remove the new columns
ALTER TABLE subscription_plans DROP COLUMN monthly_price;
ALTER TABLE subscription_plans DROP COLUMN yearly_price;
