#!/usr/bin/env python3
import bcrypt

password = "12345"
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
new_hash = hashed.decode('utf-8')

print(f"New bcrypt hash for '{password}': {new_hash}")

# Verify
if bcrypt.checkpw(password.encode('utf-8'), hashed):
    print("Verification: SUCCESS")
    
    # Create migration file
    old_hash = "$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2"
    
    migration_content = f"""-- Update default password hash for all users with old hash
-- Migration: V0029__update_default_password_hash.sql
-- Old hash: {old_hash}
-- New hash: {new_hash}
-- Password: 12345

UPDATE t_p35759334_music_label_portal.users
SET password_hash = '{new_hash}'
WHERE password_hash = '{old_hash}';
"""
    
    with open('db_migrations/V0029__update_default_password_hash.sql', 'w') as f:
        f.write(migration_content)
    
    print(f"\nMigration file created: db_migrations/V0029__update_default_password_hash.sql")
    print(f"\nMigration SQL:\n{migration_content}")
