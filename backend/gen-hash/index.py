import json
from passlib.hash import bcrypt
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Generate bcrypt hash using passlib'''
    
    password = "12345"
    hash_value = bcrypt.hash(password, rounds=12)
    
    # Verify it works
    is_valid = bcrypt.verify(password, hash_value)
    
    # Test old hash
    old_hash = "$2b$12$FJNPu53/hYpsDPpcyGTXKuRsxx4jdc5GrDvu.VnXLNPgXrs8fpFby"
    old_works = bcrypt.verify(password, old_hash)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'password': password,
            'new_hash': hash_value,
            'new_verified': is_valid,
            'old_hash': old_hash,
            'old_works': old_works
        })
    }