-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('artist', 'manager')),
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы тикетов
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_by INTEGER NOT NULL REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы комментариев к тикетам
CREATE TABLE IF NOT EXISTS ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем тестовых пользователей (пароль для всех: 12345)
INSERT INTO users (username, password_hash, role, full_name) VALUES
('manager', '$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2', 'manager', 'Руководитель Лейбла'),
('artist1', '$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2', 'artist', 'Иван Иванов'),
('artist2', '$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2', 'artist', 'Петр Петров')
ON CONFLICT (username) DO NOTHING;

-- Добавляем тестовые тикеты
INSERT INTO tickets (title, description, status, priority, created_by) 
SELECT 
    'Нужна помощь с продвижением трека',
    'Здравствуйте, выпустил новый трек, нужна помощь с продвижением в соцсетях',
    'open',
    'high',
    id
FROM users WHERE username = 'artist1' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO tickets (title, description, status, priority, created_by) 
SELECT 
    'Вопрос по контракту',
    'Не могу найти копию контракта, можете отправить?',
    'in_progress',
    'medium',
    id
FROM users WHERE username = 'artist2' LIMIT 1
ON CONFLICT DO NOTHING;