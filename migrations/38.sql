
-- Learning courses table
CREATE TABLE learning_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  duration_hours REAL,
  modules_count INTEGER DEFAULT 0,
  thumbnail_gradient TEXT,
  video_url TEXT,
  content TEXT,
  instructor_name TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User course progress
CREATE TABLE user_course_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  course_id INTEGER NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  completed_modules TEXT,
  is_completed BOOLEAN DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

-- User connections for C-Connect
CREATE TABLE user_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_user_id TEXT NOT NULL,
  receiver_user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(requester_user_id, receiver_user_id)
);

-- Direct messages for C-Connect
CREATE TABLE direct_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_user_id TEXT NOT NULL,
  receiver_user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_direct_messages_participants ON direct_messages(sender_user_id, receiver_user_id);
CREATE INDEX idx_user_connections_requester ON user_connections(requester_user_id);
CREATE INDEX idx_user_connections_receiver ON user_connections(receiver_user_id);
