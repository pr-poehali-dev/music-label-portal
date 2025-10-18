-- Add social media links for artists
ALTER TABLE t_p35759334_music_label_portal.users 
ADD COLUMN IF NOT EXISTS yandex_music_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS vk_group_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS social_links_filled BOOLEAN DEFAULT FALSE;

-- Add account blocking system
ALTER TABLE t_p35759334_music_label_portal.users 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS frozen_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(500),
ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45);

-- Create table for blocked IPs and devices
CREATE TABLE IF NOT EXISTS t_p35759334_music_label_portal.blocked_access (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45),
    device_fingerprint VARCHAR(500),
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_by INTEGER REFERENCES t_p35759334_music_label_portal.users(id),
    reason TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create table for artist statistics
CREATE TABLE IF NOT EXISTS t_p35759334_music_label_portal.artist_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p35759334_music_label_portal.users(id),
    date DATE NOT NULL,
    vk_subscribers INTEGER DEFAULT 0,
    vk_subscribers_change INTEGER DEFAULT 0,
    tiktok_followers INTEGER DEFAULT 0,
    tiktok_followers_change INTEGER DEFAULT 0,
    yandex_listeners INTEGER DEFAULT 0,
    yandex_listeners_change INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Create table for releases
CREATE TABLE IF NOT EXISTS t_p35759334_music_label_portal.releases (
    id SERIAL PRIMARY KEY,
    artist_id INTEGER REFERENCES t_p35759334_music_label_portal.users(id),
    title VARCHAR(500) NOT NULL,
    release_date DATE,
    cover_url VARCHAR(1000),
    yandex_music_url VARCHAR(500),
    vk_url VARCHAR(500),
    spotify_url VARCHAR(500),
    apple_music_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table for social media links (company)
CREATE TABLE IF NOT EXISTS t_p35759334_music_label_portal.company_social (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    icon VARCHAR(100),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert default company social links
INSERT INTO t_p35759334_music_label_portal.company_social (platform, url, icon, display_order) 
VALUES 
    ('VK', 'https://vk.com/420smm', 'vk', 1),
    ('Telegram', 'https://t.me/420smm', 'send', 2),
    ('Instagram', 'https://instagram.com/420smm', 'instagram', 3)
ON CONFLICT DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_artist_stats_user_date ON t_p35759334_music_label_portal.artist_stats(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_releases_artist ON t_p35759334_music_label_portal.releases(artist_id);
CREATE INDEX IF NOT EXISTS idx_blocked_access_ip ON t_p35759334_music_label_portal.blocked_access(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_access_device ON t_p35759334_music_label_portal.blocked_access(device_fingerprint);
