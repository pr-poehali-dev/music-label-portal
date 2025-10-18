-- Обновляем таблицу релизов для хранения альбомов/синглов
ALTER TABLE t_p35759334_music_label_portal.releases 
ADD COLUMN IF NOT EXISTS artist_id INTEGER REFERENCES t_p35759334_music_label_portal.users(id),
ADD COLUMN IF NOT EXISTS release_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS cover_url VARCHAR(1000),
ADD COLUMN IF NOT EXISTS release_date DATE,
ADD COLUMN IF NOT EXISTS preorder_date DATE,
ADD COLUMN IF NOT EXISTS sales_start_date DATE,
ADD COLUMN IF NOT EXISTS genre VARCHAR(100),
ADD COLUMN IF NOT EXISTS copyright VARCHAR(255),
ADD COLUMN IF NOT EXISTS price_category DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS title_language VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES t_p35759334_music_label_portal.users(id),
ADD COLUMN IF NOT EXISTS review_comment TEXT;

-- Переименовываем таблицу треков и обновляем структуру
ALTER TABLE t_p35759334_music_label_portal.artist_tracks RENAME TO release_tracks;

ALTER TABLE t_p35759334_music_label_portal.release_tracks
ADD COLUMN IF NOT EXISTS release_id INTEGER REFERENCES t_p35759334_music_label_portal.releases(id),
ADD COLUMN IF NOT EXISTS track_number INTEGER,
ADD COLUMN IF NOT EXISTS composer VARCHAR(255),
ADD COLUMN IF NOT EXISTS author_lyrics VARCHAR(255),
ADD COLUMN IF NOT EXISTS language_audio VARCHAR(50),
ADD COLUMN IF NOT EXISTS explicit_content BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lyrics_text TEXT,
ADD COLUMN IF NOT EXISTS tiktok_preview_start INTEGER;

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_releases_artist_id ON t_p35759334_music_label_portal.releases(artist_id);
CREATE INDEX IF NOT EXISTS idx_releases_status ON t_p35759334_music_label_portal.releases(status);
CREATE INDEX IF NOT EXISTS idx_release_tracks_release_id ON t_p35759334_music_label_portal.release_tracks(release_id);