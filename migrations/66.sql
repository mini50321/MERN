
CREATE TABLE weekly_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  completed_actions_count INTEGER DEFAULT 0,
  new_skills_added INTEGER DEFAULT 0,
  streak_start INTEGER DEFAULT 0,
  streak_end INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  ai_summary TEXT,
  ai_recommendations TEXT,
  ai_predictions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_reports_user_week ON weekly_reports(user_id, week_start);
