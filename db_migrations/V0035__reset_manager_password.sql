-- Reset manager password back to 12345 using fresh passlib hash
UPDATE t_p35759334_music_label_portal.users 
SET password_hash = '$2b$12$ADtig2FbOrl282NgEECiju.LLktTf3eO8FM6FXRgXyiT5E9hf0nPK' 
WHERE username = 'manager';
