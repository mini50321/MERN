
CREATE TABLE badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  badge_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_value INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO badges (badge_key, title, description, icon, condition_type, condition_value, display_order) VALUES
  ('getting_started', 'Getting Started', 'Complete your first daily action', '🌱', 'first_action', 1, 1),
  ('consistency_star', 'Consistency Star', 'Maintain a 7-day streak', '⭐', 'streak', 7, 2),
  ('emerging_achiever', 'Emerging Achiever', 'Reach level 5', '🎯', 'level', 5, 3),
  ('reflective_learner', 'Reflective Learner', 'View your first weekly report', '📊', 'weekly_report', 1, 4),
  ('proactive_thinker', 'Proactive Thinker', 'Ask 10 questions to AI Advisor', '💡', 'advisor_questions', 10, 5);
