# Password Hash Migration Guide

## Overview

This migration updates all users in the database who have the old default password hash to a new proper bcrypt hash. The password remains "12345" but with a fresh, more secure bcrypt hash.

## Details

- **Table**: `t_p35759334_music_label_portal.users`
- **Column**: `password_hash`
- **Password**: `12345`
- **Old Hash**: `$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2`
- **New Hash**: `$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYvXSw1ogeK`

## Files Created

### 1. SQL Migration File
**File**: `db_migrations/V0029__update_default_password_hash.sql`

This SQL migration file updates all users with the old hash to the new hash. The new hash uses bcrypt cost factor 12 (instead of 10) for better security.

### 2. Backend Migration Function
**Directory**: `backend/migrate-db/`

A serverless function that:
- Generates a fresh bcrypt hash for "12345"
- Counts users with the old hash
- Updates all users with the old hash to the new hash
- Returns the number of users updated

**Function URL**: https://functions.poehali.dev/05c06730-31f5-43a6-a240-50721bb848c6

### 3. Python Scripts

#### `generate_hash.py`
Simple script to generate a bcrypt hash for "12345" and create the migration file.

#### `apply_migration.py`
Script to:
1. Verify the bcrypt hash in the SQL migration
2. Call the backend function to apply the migration

#### `update_password_hash.py`
Comprehensive script that can:
1. Generate a new bcrypt hash
2. Create the migration file
3. Apply the migration directly to the database (if DATABASE_URL is set)

## How to Apply the Migration

### Option 1: Using the Backend Function (Recommended)

The backend function has already been deployed. To apply the migration:

```bash
# Using Python
python3 apply_migration.py

# Or using curl
curl -X POST https://functions.poehali.dev/05c06730-31f5-43a6-a240-50721bb848c6
```

### Option 2: Using SQL Directly

If you have direct database access:

```bash
psql $DATABASE_URL -f db_migrations/V0029__update_default_password_hash.sql
```

### Option 3: Using the Python Script

If you have DATABASE_URL environment variable set:

```bash
export DATABASE_URL="your_database_connection_string"
python3 update_password_hash.py
```

## Verification

After applying the migration, you can verify:

1. **Via Backend Function Response**:
   The response will include:
   ```json
   {
     "message": "Successfully updated X users",
     "users_updated": X,
     "old_hash": "...",
     "new_hash": "..."
   }
   ```

2. **Via Direct Database Query**:
   ```sql
   -- Count users with old hash (should be 0 after migration)
   SELECT COUNT(*) FROM t_p35759334_music_label_portal.users 
   WHERE password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2';
   
   -- Count users with new hash
   SELECT COUNT(*) FROM t_p35759334_music_label_portal.users 
   WHERE password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYvXSw1ogeK';
   ```

3. **Test Login**:
   Try logging in with username and password "12345" to verify the hash works correctly.

## Migration History

- **V0001**: Initial users table creation with default password hash
- **V0029**: Update default password hash to new bcrypt hash (this migration)

## Security Notes

- The new hash uses bcrypt cost factor 12 instead of 10, making it more resistant to brute-force attacks
- The password remains "12345" - users should change their passwords after first login
- This migration only affects users who still have the default password hash from the initial migration

## Rollback

If needed, you can rollback by running:

```sql
UPDATE t_p35759334_music_label_portal.users
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2'
WHERE password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYvXSw1ogeK';
```

## Dependencies

- Python 3.11+
- bcrypt==4.1.2
- psycopg2-binary==2.9.9 (for direct database access)
- requests (for calling the backend function)
