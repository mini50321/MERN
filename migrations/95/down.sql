
-- Remove Razorpay configuration
DELETE FROM system_configurations WHERE config_key IN ('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET');
