ALTER TABLE t_p35759334_music_label_portal.users
ADD COLUMN vk_id VARCHAR(50) NULL,
ADD COLUMN vk_first_name VARCHAR(255) NULL,
ADD COLUMN vk_last_name VARCHAR(255) NULL,
ADD COLUMN vk_photo VARCHAR(500) NULL,
ADD COLUMN vk_email VARCHAR(255) NULL,
ADD COLUMN vk_access_token TEXT NULL;

CREATE INDEX idx_users_vk_id ON t_p35759334_music_label_portal.users(vk_id);

COMMENT ON COLUMN t_p35759334_music_label_portal.users.vk_id IS 'ID пользователя ВКонтакте для OAuth авторизации';
COMMENT ON COLUMN t_p35759334_music_label_portal.users.vk_first_name IS 'Имя из профиля ВКонтакте';
COMMENT ON COLUMN t_p35759334_music_label_portal.users.vk_last_name IS 'Фамилия из профиля ВКонтакте';
COMMENT ON COLUMN t_p35759334_music_label_portal.users.vk_photo IS 'URL фото профиля ВКонтакте';
COMMENT ON COLUMN t_p35759334_music_label_portal.users.vk_email IS 'Email из профиля ВКонтакте';
COMMENT ON COLUMN t_p35759334_music_label_portal.users.vk_access_token IS 'Токен доступа ВКонтакте для API';
