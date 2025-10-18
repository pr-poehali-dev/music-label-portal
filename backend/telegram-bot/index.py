import json
import os
import psycopg2
from typing import Dict, Any, Optional
from urllib import request, parse
from datetime import datetime, timedelta

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
        
        if 'message' in body_data or 'callback_query' in body_data:
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
    if 'callback_query' in update:
        return handle_callback_query(update, bot_token, db_url)
    
    message = update.get('message', {})
    chat_id = message.get('chat', {}).get('id')
    text = message.get('text', '')
    
    if not chat_id:
        return {'statusCode': 200, 'body': ''}
    
    if text == '/start':
        send_message(bot_token, chat_id, 
            '👋 Добро пожаловать в бот 420 SMM!\n\n'
            '🔗 /link <username> - Привязать аккаунт\n'
            '📊 /stats - Статистика тикетов\n'
            '📋 /tickets - Список активных тикетов\n'
            '📢 /broadcast - Отправить сообщение артистам\n'
            '❓ /help - Помощь\n\n'
            'Пример: /link manager'
        )
        return {'statusCode': 200, 'body': ''}
    
    if text == '/help':
        send_message(bot_token, chat_id, 
            '📖 <b>Справка по командам</b>\n\n'
            '🔗 <b>/link username</b> - Привязать аккаунт\n'
            '📊 <b>/stats</b> - Статистика по тикетам\n'
            '📋 <b>/tickets</b> - Активные тикеты\n'
            '📢 <b>/broadcast текст</b> - Сообщение артистам\n'
            '✅ <b>/close ticket_id</b> - Закрыть тикет\n'
            '🔄 <b>/status ticket_id</b> - Статус тикета'
        )
        return {'statusCode': 200, 'body': ''}
    
    if text.startswith('/link '):
        username = text.split(' ', 1)[1] if ' ' in text else ''
        if username and db_url:
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            cur.execute(
                "UPDATE users SET telegram_chat_id = %s WHERE username = %s RETURNING id, full_name, role",
                (str(chat_id), username)
            )
            result = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            
            if result:
                role_emoji = {'director': '👑', 'manager': '🎯', 'artist': '🎤'}
                send_message(bot_token, chat_id, 
                    f'✅ Аккаунт <b>{username}</b> успешно привязан!\n'
                    f'Роль: {role_emoji.get(result[2], "")} {result[2]}')
            else:
                send_message(bot_token, chat_id, '❌ Пользователь не найден')
        return {'statusCode': 200, 'body': ''}
    
    if text == '/stats' and db_url:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute("SELECT telegram_chat_id, role FROM users WHERE telegram_chat_id = %s", (str(chat_id),))
        user = cur.fetchone()
        
        if user and user[1] == 'director':
            cur.execute("SELECT COUNT(*) FROM tickets")
            total = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM tickets WHERE status = 'open'")
            open_count = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM tickets WHERE status = 'in_progress'")
            in_progress = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM tickets WHERE deadline < NOW() AND status != 'closed'")
            overdue = cur.fetchone()[0]
            
            send_message(bot_token, chat_id,
                f'📊 <b>Статистика тикетов</b>\n\n'
                f'📌 Всего: {total}\n'
                f'🆕 Открытых: {open_count}\n'
                f'⚙️ В работе: {in_progress}\n'
                f'🔥 Просрочено: {overdue}'
            )
        
        cur.close()
        conn.close()
        return {'statusCode': 200, 'body': ''}
    
    if text == '/tickets' and db_url:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute("SELECT telegram_chat_id, role FROM users WHERE telegram_chat_id = %s", (str(chat_id),))
        user = cur.fetchone()
        
        if user and user[1] == 'director':
            cur.execute(
                "SELECT id, title, priority, status FROM tickets WHERE status != 'closed' ORDER BY created_at DESC LIMIT 10"
            )
            tickets = cur.fetchall()
            
            if tickets:
                msg = '📋 <b>Активные тикеты:</b>\n\n'
                priority_emoji = {'low': '📋', 'medium': '📌', 'high': '⚠️', 'urgent': '🔥'}
                for tid, title, priority, status in tickets:
                    msg += f"{priority_emoji.get(priority, '📌')} #{tid} - {title}\n"
                    msg += f"   Статус: {status}\n\n"
                send_message(bot_token, chat_id, msg)
            else:
                send_message(bot_token, chat_id, 'Нет активных тикетов')
        
        cur.close()
        conn.close()
        return {'statusCode': 200, 'body': ''}
    
    if text.startswith('/broadcast ') and db_url:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute("SELECT role FROM users WHERE telegram_chat_id = %s", (str(chat_id),))
        user = cur.fetchone()
        
        if user and user[0] == 'director':
            broadcast_text = text.split(' ', 1)[1] if ' ' in text else ''
            if broadcast_text:
                cur.execute("SELECT telegram_chat_id FROM users WHERE role = 'artist' AND telegram_chat_id IS NOT NULL")
                artists = cur.fetchall()
                
                sent_count = 0
                for artist_chat_id in artists:
                    try:
                        send_message(bot_token, artist_chat_id[0], 
                            f'📢 <b>Сообщение от руководства:</b>\n\n{broadcast_text}')
                        sent_count += 1
                    except:
                        pass
                
                send_message(bot_token, chat_id, f'✅ Сообщение отправлено {sent_count} артистам')
            else:
                send_message(bot_token, chat_id, '❌ Введите текст сообщения после /broadcast')
        else:
            send_message(bot_token, chat_id, '❌ Доступно только руководителю')
        
        cur.close()
        conn.close()
        return {'statusCode': 200, 'body': ''}
    
    if text.startswith('/close ') and db_url:
        parts = text.split()
        if len(parts) >= 2:
            ticket_id = parts[1]
            
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            
            cur.execute("SELECT role FROM users WHERE telegram_chat_id = %s", (str(chat_id),))
            user = cur.fetchone()
            
            if user and user[0] in ['director', 'manager']:
                cur.execute("UPDATE tickets SET status = 'closed' WHERE id = %s", (ticket_id,))
                conn.commit()
                send_message(bot_token, chat_id, f'✅ Тикет #{ticket_id} закрыт')
            
            cur.close()
            conn.close()
        return {'statusCode': 200, 'body': ''}
    
    if text.startswith('/status ') and db_url:
        parts = text.split()
        if len(parts) >= 2:
            ticket_id = parts[1]
            
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            
            cur.execute(
                "SELECT t.title, t.description, t.status, t.priority, u.full_name as creator, m.full_name as assigned "
                "FROM tickets t "
                "JOIN users u ON t.created_by = u.id "
                "LEFT JOIN users m ON t.assigned_to = m.id "
                "WHERE t.id = %s",
                (ticket_id,)
            )
            ticket = cur.fetchone()
            
            if ticket:
                priority_emoji = {'low': '📋', 'medium': '📌', 'high': '⚠️', 'urgent': '🔥'}
                msg = (
                    f'{priority_emoji.get(ticket[3], "📌")} <b>Тикет #{ticket_id}</b>\n\n'
                    f'<b>Тема:</b> {ticket[0]}\n'
                    f'<b>Описание:</b> {ticket[1]}\n'
                    f'<b>Статус:</b> {ticket[2]}\n'
                    f'<b>Приоритет:</b> {ticket[3]}\n'
                    f'<b>Автор:</b> {ticket[4]}\n'
                )
                if ticket[5]:
                    msg += f'<b>Назначен:</b> {ticket[5]}'
                send_message(bot_token, chat_id, msg)
            else:
                send_message(bot_token, chat_id, f'❌ Тикет #{ticket_id} не найден')
            
            cur.close()
            conn.close()
        return {'statusCode': 200, 'body': ''}
    
    send_message(bot_token, chat_id, 
        'ℹ️ Используйте /help для списка команд'
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
        f"Выберите менеджера для назначения:"
    )
    
    cur.execute("SELECT username, full_name FROM users WHERE role = 'manager' ORDER BY full_name")
    managers = cur.fetchall()
    cur.close()
    conn.close()
    
    for director in directors:
        chat_id = director[0]
        send_message_with_buttons(bot_token, chat_id, message_text, ticket.get('id'), managers)
    
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

def send_message_with_buttons(bot_token: str, chat_id: int, text: str, ticket_id: int, managers: list):
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    
    keyboard = []
    for username, full_name in managers:
        keyboard.append([{
            'text': f'👤 {full_name}',
            'callback_data': f'assign_{ticket_id}_{username}'
        }])
    
    keyboard.append([
        {'text': '⏰ 1 день', 'callback_data': f'deadline_{ticket_id}_1'},
        {'text': '⏰ 3 дня', 'callback_data': f'deadline_{ticket_id}_3'},
        {'text': '⏰ 7 дней', 'callback_data': f'deadline_{ticket_id}_7'}
    ])
    
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML',
        'reply_markup': json.dumps({'inline_keyboard': keyboard})
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
    request.urlopen(req)

def handle_callback_query(update: Dict[str, Any], bot_token: str, db_url: str) -> Dict[str, Any]:
    callback_query = update.get('callback_query', {})
    callback_data = callback_query.get('data', '')
    chat_id = callback_query.get('message', {}).get('chat', {}).get('id')
    message_id = callback_query.get('message', {}).get('message_id')
    
    if callback_data.startswith('assign_'):
        parts = callback_data.split('_')
        if len(parts) >= 3:
            ticket_id = parts[1]
            manager_username = parts[2]
            
            if db_url:
                conn = psycopg2.connect(db_url)
                cur = conn.cursor()
                
                cur.execute("SELECT id, full_name FROM users WHERE username = %s AND role = 'manager'", (manager_username,))
                manager = cur.fetchone()
                
                if manager:
                    cur.execute(
                        "UPDATE tickets SET assigned_to = %s, status = 'in_progress' WHERE id = %s",
                        (manager[0], ticket_id)
                    )
                    conn.commit()
                    
                    answer_callback_query(bot_token, callback_query.get('id'), f'✅ Назначено на {manager[1]}')
                    edit_message(bot_token, chat_id, message_id, 
                        f'✅ Тикет #{ticket_id} назначен на {manager[1]} (@{manager_username})')
                else:
                    answer_callback_query(bot_token, callback_query.get('id'), '❌ Менеджер не найден')
                
                cur.close()
                conn.close()
    
    if callback_data.startswith('deadline_'):
        parts = callback_data.split('_')
        if len(parts) >= 3:
            ticket_id = parts[1]
            days = int(parts[2])
            
            if db_url:
                conn = psycopg2.connect(db_url)
                cur = conn.cursor()
                
                deadline = (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')
                
                cur.execute("UPDATE tickets SET deadline = %s WHERE id = %s", (deadline, ticket_id))
                conn.commit()
                
                answer_callback_query(bot_token, callback_query.get('id'), f'⏰ Дедлайн установлен: {days} дней')
                
                cur.close()
                conn.close()
    
    return {'statusCode': 200, 'body': ''}

def answer_callback_query(bot_token: str, callback_query_id: str, text: str):
    url = f'https://api.telegram.org/bot{bot_token}/answerCallbackQuery'
    data = parse.urlencode({
        'callback_query_id': callback_query_id,
        'text': text
    }).encode()
    
    req = request.Request(url, data=data, method='POST')
    request.urlopen(req)

def edit_message(bot_token: str, chat_id: int, message_id: int, text: str):
    url = f'https://api.telegram.org/bot{bot_token}/editMessageText'
    payload = {
        'chat_id': chat_id,
        'message_id': message_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
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
