CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  artist_name VARCHAR(255) NOT NULL,
  track_link TEXT NOT NULL,
  contact_link TEXT,
  message TEXT,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  admin_comment TEXT
);

CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);