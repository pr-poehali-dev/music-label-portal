#!/usr/bin/env python3
"""
Script to update default password hash in the database
This script will:
1. Generate a new bcrypt hash for password "12345"
2. Create a SQL migration file
3. Apply the migration to update all users with the old hash
"""

import bcrypt
import os
import sys

def generate_bcrypt_hash(password):
    """Generate a bcrypt hash for the given password"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_hash(password, hash_str):
    """Verify that the hash matches the password"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hash_str.encode('utf-8'))
    except Exception as e:
        print(f"Error verifying hash: {e}")
        return False

def create_migration_file(old_hash, new_hash):
    """Create the migration SQL file"""
    migration_content = f"""-- Update default password hash for all users with old hash
-- Old hash: {old_hash}
-- New hash: {new_hash}
-- Password: 12345

UPDATE t_p35759334_music_label_portal.users
SET password_hash = '{new_hash}'
WHERE password_hash = '{old_hash}';
"""
    
    migration_file = "db_migrations/V0029__update_default_password_hash.sql"
    with open(migration_file, 'w', encoding='utf-8') as f:
        f.write(migration_content)
    
    return migration_file, migration_content

def apply_migration(old_hash, new_hash, db_url=None):
    """Apply the migration to the database"""
    try:
        import psycopg2
    except ImportError:
        print("Error: psycopg2 not installed. Install with: pip install psycopg2-binary")
        return False
    
    if not db_url:
        db_url = os.environ.get('DATABASE_URL')
    
    if not db_url:
        print("Error: DATABASE_URL not set")
        print("Please set DATABASE_URL environment variable or pass it as an argument")
        return False
    
    try:
        print("\nConnecting to database...")
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # First, check how many users have the old hash
        cur.execute(
            "SELECT COUNT(*) FROM t_p35759334_music_label_portal.users WHERE password_hash = %s",
            (old_hash,)
        )
        count = cur.fetchone()[0]
        print(f"Found {count} users with old password hash")
        
        if count == 0:
            print("No users to update. Exiting.")
            cur.close()
            conn.close()
            return True
        
        # Update the password hashes
        print(f"\nUpdating {count} users with new password hash...")
        cur.execute(
            "UPDATE t_p35759334_music_label_portal.users SET password_hash = %s WHERE password_hash = %s",
            (new_hash, old_hash)
        )
        
        # Verify the update
        cur.execute(
            "SELECT COUNT(*) FROM t_p35759334_music_label_portal.users WHERE password_hash = %s",
            (new_hash,)
        )
        updated_count = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"Successfully updated {updated_count} users")
        return True
        
    except Exception as e:
        print(f"Error applying migration: {e}")
        return False

def main():
    print("=" * 70)
    print("PASSWORD HASH UPDATE SCRIPT")
    print("=" * 70)
    
    # Configuration
    password = "12345"
    old_hash = "$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2"
    
    # Step 1: Generate new bcrypt hash
    print("\n[Step 1] Generating new bcrypt hash...")
    new_hash = generate_bcrypt_hash(password)
    print(f"Password: {password}")
    print(f"Old hash: {old_hash}")
    print(f"New hash: {new_hash}")
    
    # Step 2: Verify the new hash
    print("\n[Step 2] Verifying new hash...")
    if verify_hash(password, new_hash):
        print("✓ Hash verification: SUCCESS")
    else:
        print("✗ Hash verification: FAILED")
        sys.exit(1)
    
    # Step 3: Create migration file
    print("\n[Step 3] Creating migration file...")
    migration_file, migration_content = create_migration_file(old_hash, new_hash)
    print(f"✓ Created: {migration_file}")
    print("\nMigration content:")
    print("-" * 70)
    print(migration_content)
    print("-" * 70)
    
    # Step 4: Apply migration
    print("\n[Step 4] Applying migration to database...")
    db_url = os.environ.get('DATABASE_URL')
    
    if db_url:
        success = apply_migration(old_hash, new_hash, db_url)
        if success:
            print("\n" + "=" * 70)
            print("✓ MIGRATION COMPLETED SUCCESSFULLY")
            print("=" * 70)
        else:
            print("\n" + "=" * 70)
            print("✗ MIGRATION FAILED")
            print("=" * 70)
            sys.exit(1)
    else:
        print("\nWARNING: DATABASE_URL not set")
        print("Migration file created but not applied to database")
        print("To apply manually, set DATABASE_URL and run this script again")
        print("\nOr run the SQL manually:")
        print(f"  psql $DATABASE_URL -f {migration_file}")
        print("\n" + "=" * 70)
        print("MIGRATION FILE CREATED (NOT APPLIED)")
        print("=" * 70)

if __name__ == "__main__":
    main()
