-- Добавляем связь tasks -> tickets
ALTER TABLE tasks ADD COLUMN ticket_id INTEGER REFERENCES tickets(id);

-- Создаем индекс для быстрого поиска задач по тикету
CREATE INDEX idx_tasks_ticket_id ON tasks(ticket_id);

-- Добавляем комментарий для понимания структуры
COMMENT ON COLUMN tasks.ticket_id IS 'ID тикета, к которому относится задача. NULL если задача создана независимо.';