import json
from passlib.hash import bcrypt
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Generate bcrypt hash using passlib'''
    
    password = "12345"
    hash_value = bcrypt.hash(password, rounds=12)
    
    # Verify it works
    is_valid = bcrypt.verify(password, hash_value)
    
    # Test current hash from DB
    current_hash = "$2b$12$LWK6UX9rYT1jkzW3OUdWv.Uqq1/0FK5ns5fSzFgxyYXbdWpMXFC8C"
    current_works = bcrypt.verify(password, current_hash)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'password': password,
            'new_hash': hash_value,
            'new_verified': is_valid,
            'current_hash': current_hash,
            'current_works': current_works
        })
    }