-- Таблица для хранения загруженных отчётов (до разбивки по артистам)
CREATE TABLE IF NOT EXISTS t_p35759334_music_label_portal.uploaded_reports (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    uploaded_by INTEGER NOT NULL REFERENCES t_p35759334_music_label_portal.users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_rows INTEGER DEFAULT 0,
    processed BOOLEAN DEFAULT FALSE
);

-- Таблица для хранения разбитых отчётов по артистам (до отправки в ЛК)
CREATE TABLE IF NOT EXISTS t_p35759334_music_label_portal.artist_report_files (
    id SERIAL PRIMARY KEY,
    uploaded_report_id INTEGER NOT NULL REFERENCES t_p35759334_music_label_portal.uploaded_reports(id),
    artist_username VARCHAR(255) NOT NULL,
    artist_full_name VARCHAR(255),
    data JSONB NOT NULL,
    deduction_percent DECIMAL(5,2) DEFAULT 0,
    sent_to_artist_id INTEGER REFERENCES t_p35759334_music_label_portal.users(id),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_artist_report_files_uploaded_report ON t_p35759334_music_label_portal.artist_report_files(uploaded_report_id);
CREATE INDEX IF NOT EXISTS idx_artist_report_files_artist ON t_p35759334_music_label_portal.artist_report_files(artist_username);
CREATE INDEX IF NOT EXISTS idx_artist_report_files_sent ON t_p35759334_music_label_portal.artist_report_files(sent_to_artist_id);