
CREATE TABLE user_followers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_user_id TEXT NOT NULL,
  following_user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_user_id, following_user_id)
);

CREATE INDEX idx_user_followers_follower ON user_followers(follower_user_id);
CREATE INDEX idx_user_followers_following ON user_followers(following_user_id);

CREATE TABLE connection_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_user_id TEXT NOT NULL,
  receiver_user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sender_user_id, receiver_user_id)
);

CREATE INDEX idx_connection_requests_receiver ON connection_requests(receiver_user_id);
CREATE INDEX idx_connection_requests_sender ON connection_requests(sender_user_id);

CREATE TABLE blocked_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_user_id TEXT NOT NULL,
  blocked_user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(blocker_user_id, blocked_user_id)
);

CREATE INDEX idx_blocked_users_blocker ON blocked_users(blocker_user_id);
