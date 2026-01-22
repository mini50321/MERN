
-- Add Razorpay payment configuration to system_configurations
INSERT INTO system_configurations (config_key, config_category, description, is_sensitive) VALUES
('RAZORPAY_KEY_ID', 'payment_service', 'Razorpay Key ID for payment processing', 0),
('RAZORPAY_KEY_SECRET', 'payment_service', 'Razorpay Secret Key (Keep secure)', 1),
('RAZORPAY_WEBHOOK_SECRET', 'payment_service', 'Razorpay Webhook Secret for verification', 1);
