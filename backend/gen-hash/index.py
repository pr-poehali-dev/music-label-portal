import json
import bcrypt
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Generate bcrypt hash for testing'''
    
    password = "12345"
    salt = bcrypt.gensalt(rounds=12)
    hash_value = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    # Verify it works
    is_valid = bcrypt.checkpw(password.encode('utf-8'), hash_value.encode('utf-8'))
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'password': password,
            'hash': hash_value,
            'verified': is_valid
        })
    }
