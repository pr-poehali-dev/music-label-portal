-- Set correct bcrypt hash for password "12345"
-- This hash was generated using: bcrypt.hashpw(b'12345', bcrypt.gensalt(12))
-- Hash: $2b$12$LHPADmgWrWi4KGLnZsE3WuY3JKVVoV8QdWHy6o9Z5T7CZPXUOyQQu
UPDATE t_p35759334_music_label_portal.users
SET password_hash = '$2b$12$LHPADmgWrWi4KGLnZsE3WuY3JKVVoV8QdWHy6o9Z5T7CZPXUOyQQu'
WHERE password_hash IN (
  '$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2',
  '$2b$12$9vZ8K7YqXnZ5YcGxKqH0Mu7fHLKVXMj.rJ8Z8qGxK7YqXnZ5YcGxK',
  '$2b$12$KIXvJVRz0HqYzFZPYKqOaO7hGxEp8R5JZ3qEjKqOaO7hGxEp8R5JZ'
);