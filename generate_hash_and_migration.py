#!/usr/bin/env python3
import bcrypt
import os

# Generate bcrypt hash for password "12345"
password = "12345"
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
new_hash = hashed.decode('utf-8')

print("=" * 60)
print("BCRYPT HASH GENERATION")
print("=" * 60)
print(f"Password: {password}")
print(f"New Hash: {new_hash}")
print()

# Verify it works
if bcrypt.checkpw(password.encode('utf-8'), hashed):
    print("Hash verification: SUCCESS ✓")
else:
    print("Hash verification: FAILED ✗")
    exit(1)

print()
print("=" * 60)
print("MIGRATION SQL")
print("=" * 60)

# Old hash from the initial migration
old_hash = "$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2"

# Create migration content
migration_content = f"""-- Update default password hash for all users with old hash
-- Old hash: {old_hash}
-- New hash: {new_hash}
-- Password: 12345

UPDATE t_p35759334_music_label_portal.users
SET password_hash = '{new_hash}'
WHERE password_hash = '{old_hash}';
"""

print(migration_content)

# Write migration file
migration_file = "db_migrations/V0029__update_default_password_hash.sql"
with open(migration_file, 'w', encoding='utf-8') as f:
    f.write(migration_content)

print("=" * 60)
print(f"Migration file created: {migration_file}")
print("=" * 60)
