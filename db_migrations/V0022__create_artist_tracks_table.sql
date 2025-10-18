-- Таблица для хранения треков артистов
CREATE TABLE t_p35759334_music_label_portal.artist_tracks (
    id SERIAL PRIMARY KEY,
    artist_id INTEGER NOT NULL REFERENCES t_p35759334_music_label_portal.users(id),
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    duration INTEGER,
    description TEXT,
    genre VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITHOUT TIME ZONE,
    reviewed_by INTEGER REFERENCES t_p35759334_music_label_portal.users(id),
    review_comment TEXT
);

CREATE INDEX idx_artist_tracks_artist_id ON t_p35759334_music_label_portal.artist_tracks(artist_id);
CREATE INDEX idx_artist_tracks_status ON t_p35759334_music_label_portal.artist_tracks(status);
CREATE INDEX idx_artist_tracks_uploaded_at ON t_p35759334_music_label_portal.artist_tracks(uploaded_at DESC);