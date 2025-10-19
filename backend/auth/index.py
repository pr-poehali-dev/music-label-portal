import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Авторизация пользователей музыкального лейбла
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с request_id, function_name
    Returns: HTTP response с токеном или ошибкой
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    import psycopg2
    
    body_data = json.loads(event.get('body', '{}'))
    username = body_data.get('username', '')
    password = body_data.get('password', '')
    vk_data = body_data.get('vk_data')
    
    if not username:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Username required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    if vk_data:
        vk_id = vk_data.get('vk_id')
        
        cur.execute(
            "SELECT id, username, role, full_name, vk_photo FROM t_p35759334_music_label_portal.users WHERE vk_id = %s",
            (vk_id,)
        )
        user = cur.fetchone()
        
        if user:
            cur.execute(
                """UPDATE t_p35759334_music_label_portal.users 
                   SET vk_first_name = %s, vk_last_name = %s, vk_photo = %s, 
                       vk_email = %s, vk_access_token = %s 
                   WHERE vk_id = %s""",
                (vk_data.get('first_name'), vk_data.get('last_name'), 
                 vk_data.get('photo'), vk_data.get('email'), 
                 vk_data.get('access_token'), vk_id)
            )
            conn.commit()
        else:
            full_name = f"{vk_data.get('first_name', '')} {vk_data.get('last_name', '')}".strip()
            
            cur.execute(
                """INSERT INTO t_p35759334_music_label_portal.users 
                   (username, password_hash, role, full_name, vk_id, vk_first_name, 
                    vk_last_name, vk_photo, vk_email, vk_access_token) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
                   RETURNING id, username, role, full_name, vk_photo""",
                (username, 'vk_oauth', 'artist', full_name, vk_id, 
                 vk_data.get('first_name'), vk_data.get('last_name'), 
                 vk_data.get('photo'), vk_data.get('email'), vk_data.get('access_token'))
            )
            user = cur.fetchone()
            conn.commit()
    else:
        from passlib.hash import bcrypt
        
        safe_username = username.replace("'", "''")
        
        cur.execute(
            f"SELECT id, username, role, full_name, vk_photo, password_hash FROM t_p35759334_music_label_portal.users WHERE username = '{safe_username}'"
        )
        user_row = cur.fetchone()
        
        if not user_row:
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        stored_hash = user_row[5]
        
        password_valid = False
        
        try:
            password_valid = bcrypt.verify(password, stored_hash)
        except Exception as e:
            password_valid = False
        
        if not password_valid:
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        user = user_row[:5]
    
    cur.close()
    conn.close()
    
    if not user:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Invalid credentials'})
        }
    
    user_data = {
        'id': user[0],
        'username': user[1],
        'role': user[2],
        'full_name': user[3],
        'vk_photo': user[4] if len(user) > 4 else None
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'user': user_data, 'token': f'mock_token_{user[0]}'})
    }