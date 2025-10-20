-- Создание таблицы новостей
CREATE TABLE IF NOT EXISTS t_p35759334_music_label_portal.news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'update', -- update, faq, job
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0, -- для сортировки
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES t_p35759334_music_label_portal.users(id)
);

-- Индекс для быстрого поиска активных новостей
CREATE INDEX IF NOT EXISTS idx_news_active ON t_p35759334_music_label_portal.news(is_active, priority DESC);

-- Индекс для фильтрации по типу
CREATE INDEX IF NOT EXISTS idx_news_type ON t_p35759334_music_label_portal.news(type);

-- Добавляем несколько начальных новостей
INSERT INTO t_p35759334_music_label_portal.news (title, content, type, priority) VALUES
('Добро пожаловать в портал!', 'Здесь вы найдете важные обновления сервиса, ответы на популярные вопросы и актуальные вакансии.', 'update', 100),
('Как загрузить релиз?', 'Перейдите в раздел "Релизы" и нажмите кнопку "Добавить релиз". Заполните все необходимые поля и загрузите трек.', 'faq', 90),
('Когда будет следующий отчет?', 'Отчеты формируются 30 февраля, 30 апреля, 30 июня и 30 октября. Следите за таймером на главной странице!', 'faq', 80);