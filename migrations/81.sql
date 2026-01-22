
CREATE TABLE home_hero_banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  image_url TEXT NOT NULL,
  gradient TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hero_banners_active_order ON home_hero_banners(is_active, display_order);

INSERT INTO home_hero_banners (title, subtitle, image_url, gradient, display_order, is_active) VALUES
('One-Stop Healthcare Solutions Platform', 'For Doctors, Manufacturers, Dealers, Freelancers, Biomedical Engineers & Healthcare Technicians', 'https://mocha-cdn.com/019aa4be-ddf3-7171-a6f8-d818a2612e58/news-medical-imaging.png', 'from-blue-600 via-indigo-600 to-purple-600', 0, 1),
('Comprehensive Healthcare Ecosystem', 'Connect, Collaborate, and Grow Together in Healthcare', 'https://mocha-cdn.com/019aa4be-ddf3-7171-a6f8-d818a2612e58/news-biomedical-research.png', 'from-cyan-600 via-blue-600 to-indigo-600', 1, 1),
('Your Healthcare Professional Network', 'Jobs, Services, Products & Collaboration Opportunities', 'https://mocha-cdn.com/019aa4be-ddf3-7171-a6f8-d818a2612e58/news-patient-monitoring.png', 'from-purple-600 via-pink-600 to-rose-600', 2, 1);
