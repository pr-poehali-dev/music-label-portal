import json
import os
import psycopg2
from typing import Dict, Any, Optional
from urllib import request, parse

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Telegram bot for ticket notifications and management
    Args: event with httpMethod, body; context with request_id
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'POST')
    
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
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    db_url = os.environ.get('DATABASE_URL')
    
    if not bot_token:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Bot token not configured'})
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        
        if 'message' in body_data:
            return handle_telegram_update(body_data, bot_token, db_url)
        
        if 'action' in body_data and body_data['action'] == 'notify':
            return send_ticket_notification(body_data, bot_token, db_url)
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        action = params.get('action')
        
        if action == 'set_webhook':
            webhook_url = params.get('url')
            return set_webhook(bot_token, webhook_url)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'status': 'ok'})
    }

def handle_telegram_update(update: Dict[str, Any], bot_token: str, db_url: str) -> Dict[str, Any]:
    message = update.get('message', {})
    chat_id = message.get('chat', {}).get('id')
    text = message.get('text', '')
    
    if not chat_id:
        return {'statusCode': 200, 'body': ''}
    
    if text == '/start':
        send_message(bot_token, chat_id, 
            '👋 Добро пожаловать в бот 420 SMM!\n\n'
            'Используйте /link <username> для привязки аккаунта\n'
            'Пример: /link manager'
        )
        return {'statusCode': 200, 'body': ''}
    
    if text.startswith('/link '):
        username = text.split(' ', 1)[1] if ' ' in text else ''
        if username and db_url:
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            cur.execute(
                "UPDATE users SET telegram_chat_id = %s WHERE username = %s AND role = 'director' RETURNING id, full_name",
                (str(chat_id), username)
            )
            result = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            if result:
                send_message(bot_token, chat_id, f'✅ Аккаунт {username} успешно привязан!')
            else:
                send_message(bot_token, chat_id, '❌ Пользователь не найден или не является руководителем')
        return {'statusCode': 200, 'body': ''}
    
    if text.startswith('/assign '):
        parts = text.split()
        if len(parts) >= 3:
            ticket_id = parts[1]
            manager_username = parts[2]
            
            if db_url:
                conn = psycopg2.connect(db_url)
                cur = conn.cursor()
                
                cur.execute("SELECT id FROM users WHERE username = %s AND role = 'manager'", (manager_username,))
                manager = cur.fetchone()
                
                if manager:
                    cur.execute(
                        "UPDATE tickets SET assigned_to = %s, status = 'in_progress' WHERE id = %s",
                        (manager[0], ticket_id)
                    )
                    conn.commit()
                    send_message(bot_token, chat_id, f'✅ Тикет #{ticket_id} назначен на {manager_username}')
                else:
                    send_message(bot_token, chat_id, f'❌ Менеджер {manager_username} не найден')
                
                cur.close()
                conn.close()
        return {'statusCode': 200, 'body': ''}
    
    send_message(bot_token, chat_id, 
        'Доступные команды:\n'
        '/start - Начало работы\n'
        '/link <username> - Привязать аккаунт\n'
        '/assign <ticket_id> <manager_username> - Назначить тикет'
    )
    
    return {'statusCode': 200, 'body': ''}

def send_ticket_notification(data: Dict[str, Any], bot_token: str, db_url: str) -> Dict[str, Any]:
    ticket = data.get('ticket', {})
    
    if not db_url:
        return {'statusCode': 500, 'body': json.dumps({'error': 'Database not configured'})}
    
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT telegram_chat_id FROM users WHERE role = 'director' AND telegram_chat_id IS NOT NULL")
    directors = cur.fetchall()
    cur.close()
    conn.close()
    
    priority_emoji = {
        'low': '📋',
        'medium': '📌',
        'high': '⚠️',
        'urgent': '🔥'
    }
    
    message_text = (
        f"{priority_emoji.get(ticket.get('priority', 'medium'), '📌')} <b>Новый тикет #{ticket.get('id')}</b>\n\n"
        f"<b>Тема:</b> {ticket.get('title')}\n"
        f"<b>Описание:</b> {ticket.get('description')}\n"
        f"<b>Приоритет:</b> {ticket.get('priority')}\n"
        f"<b>Автор:</b> {ticket.get('creator_name')}\n\n"
        f"Назначить: /assign {ticket.get('id')} <username>"
    )
    
    for director in directors:
        chat_id = director[0]
        send_message(bot_token, chat_id, message_text)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'status': 'sent', 'recipients': len(directors)})
    }

def send_message(bot_token: str, chat_id: int, text: str):
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    data = parse.urlencode({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }).encode()
    
    req = request.Request(url, data=data, method='POST')
    request.urlopen(req)

def set_webhook(bot_token: str, webhook_url: Optional[str]) -> Dict[str, Any]:
    url = f'https://api.telegram.org/bot{bot_token}/setWebhook'
    data = parse.urlencode({'url': webhook_url or ''}).encode()
    
    req = request.Request(url, data=data, method='POST')
    response = request.urlopen(req)
    result = json.loads(response.read().decode())
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result)
    }
