"""
Business: Telegram авторизация через Telegram Login Widget
Args: event - dict с httpMethod, queryStringParameters (id, first_name, auth_date, hash)
      context - объект с request_id
Returns: HTTP response с токеном JWT или ошибкой
"""

import json
import hashlib
import hmac
import os
import time
import jwt
from typing import Dict, Any

# Секретный ключ для подписи JWT (в продакшене использовать сложный ключ)
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')


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
    
    # Парсим данные от Telegram
    body_str = event.get('body', '{}')
    data = json.loads(body_str)
    
    # Проверяем наличие обязательных полей
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
    
    # Создаем JWT токен
    user_data = {
        'telegram_id': data['id'],
        'first_name': data.get('first_name', ''),
        'last_name': data.get('last_name', ''),
        'username': data.get('username', ''),
        'photo_url': data.get('photo_url', ''),
        'exp': int(time.time()) + 86400 * 30  # Токен на 30 дней
    }
    
    token = jwt.encode(user_data, JWT_SECRET, algorithm='HS256')
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'token': token,
            'user': {
                'telegram_id': data['id'],
                'first_name': data.get('first_name', ''),
                'last_name': data.get('last_name', ''),
                'username': data.get('username', ''),
                'photo_url': data.get('photo_url', '')
            }
        }),
        'isBase64Encoded': False
    }


def verify_telegram_auth(data: Dict[str, Any], bot_token: str) -> bool:
    """Проверка подлинности данных от Telegram"""
    received_hash = data.pop('hash', '')
    
    # Создаем строку для проверки
    data_check_arr = [f'{k}={v}' for k, v in sorted(data.items())]
    data_check_string = '\n'.join(data_check_arr)
    
    # Вычисляем хеш
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    # Возвращаем hash обратно в data
    data['hash'] = received_hash
    
    return calculated_hash == received_hash
