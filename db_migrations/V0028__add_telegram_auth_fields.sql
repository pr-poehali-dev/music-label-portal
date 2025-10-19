-- Добавляем поля для Telegram авторизации
ALTER TABLE t_p35759334_music_label_portal.users 
ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS telegram_first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS telegram_last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS telegram_photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS telegram_auth_date BIGINT;

-- Создаем индекс для быстрого поиска по Telegram ID
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON t_p35759334_music_label_portal.users(telegram_id);