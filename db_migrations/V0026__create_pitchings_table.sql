CREATE TABLE IF NOT EXISTS pitchings (
    id SERIAL PRIMARY KEY,
    release_id INTEGER NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    release_name VARCHAR(255) NOT NULL,
    release_date DATE NOT NULL,
    genre VARCHAR(100) NOT NULL,
    artist_description TEXT NOT NULL,
    release_description TEXT NOT NULL,
    playlist_fit TEXT NOT NULL,
    current_reach TEXT NOT NULL,
    preview_link VARCHAR(500) NOT NULL,
    artist_photos TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pitchings_release_id ON pitchings(release_id);
CREATE INDEX IF NOT EXISTS idx_pitchings_status ON pitchings(status);
CREATE INDEX IF NOT EXISTS idx_pitchings_created_at ON pitchings(created_at DESC);
