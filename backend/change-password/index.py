"""
Business: Change user password with verification
Args: event with body containing username, old_password, new_password
Returns: Success or error response
"""

import json
import os
from passlib.hash import bcrypt
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
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
    
    body_data = json.loads(event.get('body', '{}'))
    username = body_data.get('username', '').strip()
    old_password = body_data.get('old_password', '')
    new_password = body_data.get('new_password', '')
    
    if not username or not old_password or not new_password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Username, old password and new password are required'})
        }
    
    if len(new_password) < 4:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'New password must be at least 4 characters'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'})
        }
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    safe_username = username.replace("'", "''")
    cursor.execute(f"SELECT id, username, password_hash, role FROM t_p35759334_music_label_portal.users WHERE username = '{safe_username}'")
    user_row = cursor.fetchone()
    
    if not user_row:
        cursor.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid credentials'})
        }
    
    user = {'id': user_row[0], 'username': user_row[1], 'password_hash': user_row[2], 'role': user_row[3]}
    
    if not bcrypt.verify(old_password, user['password_hash']):
        cursor.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Old password is incorrect'})
        }
    
    new_hash = bcrypt.hash(new_password, rounds=12)
    
    safe_hash = new_hash.replace("'", "''")
    cursor.execute(
        f"UPDATE t_p35759334_music_label_portal.users SET password_hash = '{safe_hash}' WHERE id = {user['id']}"
    )
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'message': 'Password changed successfully'
        })
    }