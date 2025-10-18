CREATE TABLE IF NOT EXISTS artist_reports (
    id SERIAL PRIMARY KEY,
    artist_id INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    platform VARCHAR(100) NOT NULL,
    territory VARCHAR(100),
    right_type VARCHAR(100),
    contract_type VARCHAR(100),
    usage_type VARCHAR(100),
    performer VARCHAR(255),
    track_name VARCHAR(255),
    album_name VARCHAR(255),
    label VARCHAR(255),
    plays INTEGER DEFAULT 0,
    author_reward_license DECIMAL(10, 2) DEFAULT 0.00,
    author_reward_license_changed DECIMAL(10, 2) DEFAULT 0.00,
    total_reward DECIMAL(10, 2) DEFAULT 0.00,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER,
    
    CONSTRAINT unique_artist_report UNIQUE (artist_id, period_start, platform, track_name, album_name)
);

CREATE INDEX idx_artist_reports_artist_id ON artist_reports(artist_id);
CREATE INDEX idx_artist_reports_period ON artist_reports(period_start, period_end);
CREATE INDEX idx_artist_reports_platform ON artist_reports(platform);
CREATE INDEX idx_artist_reports_uploaded_at ON artist_reports(uploaded_at DESC);

COMMENT ON TABLE artist_reports IS 'Отчёты по стримингу музыки для артистов';
COMMENT ON COLUMN artist_reports.artist_id IS 'ID артиста из таблицы users';
COMMENT ON COLUMN artist_reports.period_start IS 'Начало отчётного периода';
COMMENT ON COLUMN artist_reports.period_end IS 'Конец отчётного периода';
COMMENT ON COLUMN artist_reports.platform IS 'Площадка (Яндекс Музыка, VK Музыка, МТС Music и т.д.)';
COMMENT ON COLUMN artist_reports.plays IS 'Количество прослушиваний';
COMMENT ON COLUMN artist_reports.author_reward_license IS 'Вознаграждение авторское (ЛИЦЕНЗИАРА)';
COMMENT ON COLUMN artist_reports.total_reward IS 'Итого вознаграждение';