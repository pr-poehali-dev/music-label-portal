-- Индексы для таблицы releases
-- Поиск релизов по артисту (самый частый запрос)
CREATE INDEX IF NOT EXISTS idx_releases_artist_id ON t_p35759334_music_label_portal.releases(artist_id);

-- Поиск релизов по статусу (для фильтрации модерации)
CREATE INDEX IF NOT EXISTS idx_releases_status ON t_p35759334_music_label_portal.releases(status);

-- Сортировка релизов по дате создания
CREATE INDEX IF NOT EXISTS idx_releases_created_at ON t_p35759334_music_label_portal.releases(created_at DESC);

-- Комбинированный индекс для поиска релизов артиста по статусу
CREATE INDEX IF NOT EXISTS idx_releases_artist_status ON t_p35759334_music_label_portal.releases(artist_id, status);

-- Индексы для таблицы release_tracks
-- Поиск треков по релизу
CREATE INDEX IF NOT EXISTS idx_tracks_release_id ON t_p35759334_music_label_portal.release_tracks(release_id);

-- Поиск треков по артисту
CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON t_p35759334_music_label_portal.release_tracks(artist_id);

-- Сортировка треков внутри релиза по номеру
CREATE INDEX IF NOT EXISTS idx_tracks_release_track_num ON t_p35759334_music_label_portal.release_tracks(release_id, track_number);

-- Индексы для таблицы users
-- Поиск по username (для авторизации)
CREATE INDEX IF NOT EXISTS idx_users_username ON t_p35759334_music_label_portal.users(username);

-- Поиск по VK ID (для авторизации через VK)
CREATE INDEX IF NOT EXISTS idx_users_vk_id ON t_p35759334_music_label_portal.users(vk_id);

-- Фильтрация по ролям
CREATE INDEX IF NOT EXISTS idx_users_role ON t_p35759334_music_label_portal.users(role);

-- Индексы для таблицы notifications
-- Поиск уведомлений пользователя
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON t_p35759334_music_label_portal.notifications(user_id);

-- Фильтрация непрочитанных уведомлений
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON t_p35759334_music_label_portal.notifications(user_id, read);

-- Сортировка по дате создания
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON t_p35759334_music_label_portal.notifications(created_at DESC);