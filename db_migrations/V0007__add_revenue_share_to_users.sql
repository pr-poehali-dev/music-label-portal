ALTER TABLE users ADD COLUMN IF NOT EXISTS revenue_share_percent INTEGER DEFAULT 50;

COMMENT ON COLUMN users.revenue_share_percent IS 'Процент вознаграждения артиста от общей суммы (0-100)';

UPDATE users SET revenue_share_percent = 50 WHERE revenue_share_percent IS NULL AND role = 'artist';