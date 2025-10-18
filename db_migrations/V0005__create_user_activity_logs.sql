CREATE TABLE IF NOT EXISTS user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_activity_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX idx_user_activity_action_type ON user_activity_logs(action_type);

COMMENT ON TABLE user_activity_logs IS 'Логи активности пользователей для мониторинга';
COMMENT ON COLUMN user_activity_logs.action_type IS 'Тип действия: login, logout, create_ticket, update_ticket, view_page и т.д.';
COMMENT ON COLUMN user_activity_logs.metadata IS 'Дополнительная информация о действии в формате JSON';
