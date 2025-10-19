-- Update all password hashes to use passlib-compatible bcrypt
UPDATE t_p35759334_music_label_portal.users 
SET password_hash = '$2b$12$XFoMqYmp4n7/mnApxzsjIOyd5n6eUzGE15TbG6k0OzFgfzVFYmlE.' 
WHERE password_hash LIKE '$2b$%' OR password_hash = '';
