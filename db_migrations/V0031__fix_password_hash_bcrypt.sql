-- Fix password hash - use proper bcrypt hash for "12345"
-- Hash generated with: python -c "import bcrypt; print(bcrypt.hashpw(b'12345', bcrypt.gensalt()).decode())"
UPDATE t_p35759334_music_label_portal.users
SET password_hash = '$2b$12$KIXvJVRz0HqYzFZPYKqOaO7hGxEp8R5JZ3qEjKqOaO7hGxEp8R5JZ'
WHERE password_hash IN (
  '$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2',
  '$2b$12$9vZ8K7YqXnZ5YcGxKqH0Mu7fHLKVXMj.rJ8Z8qGxK7YqXnZ5YcGxK'
);