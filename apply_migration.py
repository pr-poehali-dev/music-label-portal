#!/usr/bin/env python3
"""
Script to apply the password hash migration
This script will call the migrate-db backend function to update all users
with the old default password hash to a new bcrypt hash.
"""

import requests
import json
import bcrypt

def verify_hash():
    """Verify that the new hash in the SQL migration is correct"""
    password = "12345"
    # This is the hash used in the SQL migration
    new_hash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYvXSw1ogeK"
    
    print("Verifying SQL migration hash...")
    print(f"Password: {password}")
    print(f"Hash: {new_hash}")
    
    try:
        if bcrypt.checkpw(password.encode('utf-8'), new_hash.encode('utf-8')):
            print("✓ Hash verification: SUCCESS\n")
            return True
        else:
            print("✗ Hash verification: FAILED\n")
            return False
    except Exception as e:
        print(f"✗ Hash verification error: {e}\n")
        return False

def apply_migration_via_function():
    """Call the backend function to apply the migration"""
    function_url = "https://functions.poehali.dev/05c06730-31f5-43a6-a240-50721bb848c6"
    
    print("=" * 70)
    print("APPLYING MIGRATION VIA BACKEND FUNCTION")
    print("=" * 70)
    print(f"Function URL: {function_url}\n")
    
    try:
        response = requests.post(function_url, json={})
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}\n")
        
        if response.status_code == 200:
            print("=" * 70)
            print("✓ MIGRATION APPLIED SUCCESSFULLY")
            print("=" * 70)
            return True
        else:
            print("=" * 70)
            print("✗ MIGRATION FAILED")
            print("=" * 70)
            return False
            
    except Exception as e:
        print(f"Error calling migration function: {e}")
        print("=" * 70)
        print("✗ MIGRATION FAILED")
        print("=" * 70)
        return False

def main():
    print("=" * 70)
    print("PASSWORD HASH MIGRATION")
    print("=" * 70)
    print()
    
    # Step 1: Verify the hash
    print("[Step 1] Verifying bcrypt hash in SQL migration...")
    if not verify_hash():
        print("ERROR: Hash verification failed. Please regenerate the hash.")
        return
    
    # Step 2: Apply migration
    print("[Step 2] Applying migration via backend function...")
    apply_migration_via_function()

if __name__ == "__main__":
    main()
