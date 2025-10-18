import json
import os
import requests
from datetime import datetime
from typing import Dict, Any, Optional

def get_vk_stats(group_url: str, access_token: str) -> Optional[Dict[str, int]]:
    group_id = group_url.split('/')[-1]
    
    try:
        response = requests.get(
            'https://api.vk.com/method/groups.getById',
            params={
                'group_id': group_id,
                'fields': 'members_count',
                'access_token': access_token,
                'v': '5.131'
            },
            timeout=10
        )
        data = response.json()
        
        if 'response' in data and len(data['response']) > 0:
            return {'followers': data['response'][0].get('members_count', 0)}
    except Exception:
        pass
    
    return None

def get_yandex_music_stats(artist_url: str, token: str) -> Optional[Dict[str, int]]:
    artist_id = artist_url.split('/')[-1]
    
    try:
        response = requests.get(
            f'https://api.music.yandex.net/artists/{artist_id}',
            headers={'Authorization': f'OAuth {token}'},
            timeout=10
        )
        data = response.json()
        
        if 'result' in data:
            return {'listeners': data['result'].get('counts', {}).get('tracks', 0)}
    except Exception:
        pass
    
    return None

def collect_stats(conn, vk_token: str, ya_token: str) -> int:
    import psycopg2.extras
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cur.execute('''
        SELECT id, username, vk_group, yandex_music, tiktok
        FROM users
        WHERE role = 'artist' AND vk_group IS NOT NULL AND yandex_music IS NOT NULL
    ''')
    
    artists = cur.fetchall()
    updated_count = 0
    
    for artist in artists:
        artist_id = artist['id']
        vk_url = artist['vk_group']
        ya_url = artist['yandex_music']
        
        vk_stats = get_vk_stats(vk_url, vk_token) if vk_url else None
        ya_stats = get_yandex_music_stats(ya_url, ya_token) if ya_url else None
        
        if vk_stats or ya_stats:
            vk_followers = vk_stats['followers'] if vk_stats else 0
            ya_listeners = ya_stats['listeners'] if ya_stats else 0
            
            cur.execute('''
                SELECT vk_followers, yandex_listeners
                FROM artist_stats
                WHERE user_id = %s
                ORDER BY date DESC
                LIMIT 1
            ''', (artist_id,))
            
            prev_stats = cur.fetchone()
            prev_vk = prev_stats['vk_followers'] if prev_stats else 0
            prev_ya = prev_stats['yandex_listeners'] if prev_stats else 0
            
            vk_change = vk_followers - prev_vk
            ya_change = ya_listeners - prev_ya
            
            cur.execute('''
                INSERT INTO artist_stats (user_id, date, vk_followers, vk_change, yandex_listeners, yandex_change, tiktok_followers, tiktok_change)
                VALUES (%s, %s, %s, %s, %s, %s, 0, 0)
            ''', (artist_id, datetime.now().date(), vk_followers, vk_change, ya_listeners, ya_change))
            
            updated_count += 1
    
    conn.commit()
    cur.close()
    return updated_count

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление пользователями лейбла и автосбор статистики
    Args: event - dict с httpMethod, body, queryStringParameters, path
          context - объект с request_id, function_name
    Returns: HTTP response со списком пользователей, результатом создания или сбора статистики
    '''
    method: str = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    import psycopg2
    import psycopg2.extras
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    if action == 'collect_stats' and method == 'POST':
        vk_token = os.environ.get('VK_SERVICE_TOKEN')
        ya_token = os.environ.get('YANDEX_MUSIC_TOKEN')
        
        if not vk_token or not ya_token:
            conn.close()
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing API tokens'})
            }
        
        updated_count = collect_stats(conn, vk_token, ya_token)
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'updated': updated_count,
                'message': f'Обновлена статистика для {updated_count} артистов'
            })
        }
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    if method == 'GET':
        role_filter = query_params.get('role')
        
        query = 'SELECT id, username, role, full_name, revenue_share_percent, created_at FROM users WHERE 1=1'
        params = []
        
        if role_filter:
            query += ' AND role = %s'
            params.append(role_filter)
        
        query += ' ORDER BY created_at DESC'
        
        cur.execute(query, params)
        users = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'users': [dict(u) for u in users]}, default=str)
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        
        username = body_data.get('username')
        full_name = body_data.get('full_name')
        role = body_data.get('role')
        revenue_share_percent = body_data.get('revenue_share_percent', 50)
        password = body_data.get('password', '12345')
        
        if not all([username, full_name, role]):
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing required fields'})
            }
        
        if role not in ['artist', 'manager', 'director']:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Invalid role'})
            }
        
        password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye1w8lQvN3s6W/KdDmrJmLZMDr1FzU7B2'
        
        try:
            cur.execute(
                '''INSERT INTO users (username, password_hash, role, full_name, revenue_share_percent)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id''',
                (username, password_hash, role, full_name, revenue_share_percent)
            )
            user_id = cur.fetchone()['id']
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'id': user_id, 'message': 'User created', 'username': username})
            }
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            cur.close()
            conn.close()
            return {
                'statusCode': 409,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Username already exists'})
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }