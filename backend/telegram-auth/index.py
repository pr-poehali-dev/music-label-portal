"""
Business: Telegram авторизация и регистрация через Telegram Login Widget с сохранением в БД
Args: event - dict с httpMethod, body (id, first_name, auth_date, hash)
      context - объект с request_id
Returns: HTTP response с данными пользователя из БД
"""

import json
import hashlib
import hmac
import os
import time
import psycopg2
from typing import Dict, Any, Optional

TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
DATABASE_URL = os.environ.get('DATABASE_URL', '')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_str = event.get('body', '{}')
    data = json.loads(body_str)
    
    required_fields = ['id', 'first_name', 'auth_date', 'hash']
    if not all(field in data for field in required_fields):
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Missing required fields'}),
            'isBase64Encoded': False
        }
    
    # Проверка подлинности данных от Telegram
    if not verify_telegram_auth(data, TELEGRAM_BOT_TOKEN):
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid authentication data'}),
            'isBase64Encoded': False
        }
    
    # Проверка времени авторизации (не старше 1 часа)
    auth_date = int(data['auth_date'])
    if time.time() - auth_date > 3600:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Authentication data expired'}),
            'isBase64Encoded': False
        }
    
    # Сохраняем или обновляем пользователя в БД
    user = save_or_update_user(data)
    
    if not user:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to save user'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'user': user}),
        'isBase64Encoded': False
    }


def verify_telegram_auth(data: Dict[str, Any], bot_token: str) -> bool:
    """Проверка подлинности данных от Telegram"""
    received_hash = data.pop('hash', '')
    
    data_check_arr = [f'{k}={v}' for k, v in sorted(data.items())]
    data_check_string = '\n'.join(data_check_arr)
    
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    data['hash'] = received_hash
    
    return calculated_hash == received_hash


def save_or_update_user(tg_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Сохраняет или обновляет пользователя Telegram в БД"""
    conn = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        telegram_id = str(tg_data['id'])
        first_name = tg_data.get('first_name', '')
        last_name = tg_data.get('last_name', '')
        username = tg_data.get('username', '')
        photo_url = tg_data.get('photo_url', '')
        auth_date = int(tg_data.get('auth_date', time.time()))
        
        full_name = f"{first_name} {last_name}".strip() or f"Telegram User {telegram_id}"
        db_username = username or f"tg_{telegram_id}"
        
        # Проверяем существует ли пользователь
        cur.execute("""
            SELECT id, username, role, full_name, telegram_chat_id, 
                   telegram_photo_url, is_blocked, is_frozen
            FROM t_p35759334_music_label_portal.users
            WHERE telegram_id = %s
        """, (telegram_id,))
        
        existing_user = cur.fetchone()
        
        if existing_user:
            # Обновляем данные существующего пользователя
            cur.execute("""
                UPDATE t_p35759334_music_label_portal.users
                SET telegram_username = %s,
                    telegram_first_name = %s,
                    telegram_last_name = %s,
                    telegram_photo_url = %s,
                    telegram_auth_date = %s,
                    full_name = %s
                WHERE telegram_id = %s
                RETURNING id, username, role, full_name, telegram_chat_id, 
                          telegram_photo_url, is_blocked, is_frozen
            """, (username, first_name, last_name, photo_url, auth_date, full_name, telegram_id))
            
            user_row = cur.fetchone()
        else:
            # Создаем нового пользователя
            cur.execute("""
                INSERT INTO t_p35759334_music_label_portal.users 
                (username, password_hash, role, full_name, telegram_id, telegram_username,
                 telegram_first_name, telegram_last_name, telegram_photo_url, 
                 telegram_auth_date, telegram_chat_id)
                VALUES (%s, '', 'artist', %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, username, role, full_name, telegram_chat_id, 
                          telegram_photo_url, is_blocked, is_frozen
            """, (db_username, full_name, telegram_id, username, first_name, 
                  last_name, photo_url, auth_date, telegram_id))
            
            user_row = cur.fetchone()
        
        conn.commit()
        
        if user_row:
            return {
                'id': user_row[0],
                'username': user_row[1],
                'role': user_row[2],
                'full_name': user_row[3],
                'telegram_chat_id': user_row[4],
                'avatar': user_row[5],
                'is_blocked': user_row[6] or False,
                'is_frozen': user_row[7] or False
            }
        
        return None
        
    except Exception as e:
        print(f"Database error: {e}")
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()
