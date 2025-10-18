-- Обновляем роли пользователей (добавляем менеджера отдельно от руководителя)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('artist', 'manager', 'director'));

-- Добавляем дедлайн к тикетам
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;

-- Обновляем существующего manager на director
UPDATE users SET role = 'director' WHERE username = 'manager';

-- Добавляем тестовых менеджеров
INSERT INTO users (username, password_hash, role, full_name) VALUES
('manager1', '$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2', 'manager', 'Менеджер Александр'),
('manager2', '$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2', 'manager', 'Менеджер Мария')
ON CONFLICT (username) DO NOTHING;