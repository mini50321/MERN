
DROP INDEX IF EXISTS idx_blocked_users_blocker;
DROP TABLE IF EXISTS blocked_users;

DROP INDEX IF EXISTS idx_connection_requests_sender;
DROP INDEX IF EXISTS idx_connection_requests_receiver;
DROP TABLE IF EXISTS connection_requests;

DROP INDEX IF EXISTS idx_user_followers_following;
DROP INDEX IF EXISTS idx_user_followers_follower;
DROP TABLE IF EXISTS user_followers;
