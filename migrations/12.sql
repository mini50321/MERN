
ALTER TABLE news_updates ADD COLUMN posted_by_user_id TEXT;
ALTER TABLE news_updates ADD COLUMN is_user_post BOOLEAN DEFAULT 0;
