import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Apply database migration to update password hashes
    Args: event - dict with httpMethod, body
          context - object with request_id, function_name
    Returns: HTTP response with migration result
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    import psycopg2
    import bcrypt
    
    # Old hashes to replace
    old_hashes = [
        "$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2",
        "$2b$12$9vZ8K7YqXnZ5YcGxKqH0Mu7fHLKVXMj.rJ8Z8qGxK7YqXnZ5YcGxK",
        "$2b$12$KIXvJVRz0HqYzFZPYKqOaO7hGxEp8R5JZ3qEjKqOaO7hGxEp8R5JZ"
    ]
    
    # Generate new bcrypt hash for password "12345"
    password = "12345"
    salt = bcrypt.gensalt()
    new_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    # Verify the new hash
    if not bcrypt.checkpw(password.encode('utf-8'), new_hash.encode('utf-8')):
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Hash verification failed'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        # Count users with old hashes
        cur.execute(
            "SELECT COUNT(*) FROM t_p35759334_music_label_portal.users WHERE password_hash = ANY(%s)",
            (old_hashes,)
        )
        old_count = cur.fetchone()[0]
        
        if old_count == 0:
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'message': 'No users to update',
                    'users_updated': 0,
                    'new_hash': new_hash
                })
            }
        
        # Update password hashes
        cur.execute(
            "UPDATE t_p35759334_music_label_portal.users SET password_hash = %s WHERE password_hash = ANY(%s)",
            (new_hash, old_hashes)
        )
        
        # Verify the update
        cur.execute(
            "SELECT COUNT(*) FROM t_p35759334_music_label_portal.users WHERE password_hash = %s",
            (new_hash,)
        )
        new_count = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Log the hash for debugging
        print(f"Generated hash: {new_hash}")
        print(f"Updated {new_count} users")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': f'Successfully updated {new_count} users',
                'users_updated': new_count,
                'new_hash': new_hash,
                'password': password
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }