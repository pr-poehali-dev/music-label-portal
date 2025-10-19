#!/usr/bin/env python3
"""Quick verification that the bcrypt hash in the migration is correct"""

import bcrypt

password = "12345"
# Hash from the SQL migration file
new_hash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYvXSw1ogeK"

print("Verifying bcrypt hash...")
print(f"Password: {password}")
print(f"Hash: {new_hash}")
print()

try:
    if bcrypt.checkpw(password.encode('utf-8'), new_hash.encode('utf-8')):
        print("✓ SUCCESS: Hash is valid for password '12345'")
        print("\nYou can safely use this migration.")
    else:
        print("✗ FAILED: Hash does NOT match password '12345'")
        print("\nDO NOT use this migration. Generate a new hash.")
except Exception as e:
    print(f"✗ ERROR: {e}")
    print("\nHash format may be invalid.")
