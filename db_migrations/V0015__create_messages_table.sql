-- Создаем таблицу для личных сообщений руководителю
CREATE TABLE IF NOT EXISTS t_p35759334_music_label_portal.messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES t_p35759334_music_label_portal.users(id)
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX idx_messages_sender_id ON t_p35759334_music_label_portal.messages(sender_id);
CREATE INDEX idx_messages_created_at ON t_p35759334_music_label_portal.messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON t_p35759334_music_label_portal.messages(is_read);

-- Комментарии для документации
COMMENT ON TABLE t_p35759334_music_label_portal.messages IS 'Личные сообщения от менеджеров и артистов руководителю';
COMMENT ON COLUMN t_p35759334_music_label_portal.messages.sender_id IS 'ID отправителя (менеджер или артист)';
COMMENT ON COLUMN t_p35759334_music_label_portal.messages.message IS 'Текст сообщения';
COMMENT ON COLUMN t_p35759334_music_label_portal.messages.is_read IS 'Прочитано ли сообщение руководителем';