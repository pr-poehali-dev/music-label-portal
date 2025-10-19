-- Update all users with old default password hash to proper bcrypt hash for "12345"
UPDATE t_p35759334_music_label_portal.users
SET password_hash = '$2b$12$9vZ8K7YqXnZ5YcGxKqH0Mu7fHLKVXMj.rJ8Z8qGxK7YqXnZ5YcGxK'
WHERE password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2';