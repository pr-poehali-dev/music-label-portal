-- Update default password hash for all users with old hash
-- Migration: V0029__update_default_password_hash.sql
-- 
-- This migration updates all users who have the old default password hash
-- to a new bcrypt hash. The password remains "12345" but with a fresh hash.
--
-- Old hash: $2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2
-- New hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYvXSw1ogeK
-- Password: 12345
--
-- The new hash uses cost factor 12 (instead of 10) for better security.
-- This hash was generated using: bcrypt.hashpw(b"12345", bcrypt.gensalt(rounds=12))

UPDATE t_p35759334_music_label_portal.users
SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYvXSw1ogeK'
WHERE password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2';
