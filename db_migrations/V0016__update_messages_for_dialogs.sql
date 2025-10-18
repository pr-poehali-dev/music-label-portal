-- Добавляем поля для двусторонних диалогов
ALTER TABLE t_p35759334_music_label_portal.messages 
ADD COLUMN IF NOT EXISTS receiver_id INTEGER,
ADD COLUMN IF NOT EXISTS is_from_boss BOOLEAN DEFAULT FALSE;

-- Создаем индекс для быстрого поиска диалогов
CREATE INDEX IF NOT EXISTS idx_messages_dialog ON t_p35759334_music_label_portal.messages(sender_id, receiver_id);

-- Комментарии
COMMENT ON COLUMN t_p35759334_music_label_portal.messages.receiver_id IS 'ID получателя (NULL если сообщение всем)';
COMMENT ON COLUMN t_p35759334_music_label_portal.messages.is_from_boss IS 'Отправлено ли руководителем';