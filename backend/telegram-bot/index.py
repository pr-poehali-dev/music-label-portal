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
        
        if 'action' in body_data:
            if body_data['action'] == 'notify':
                return send_ticket_notification(body_data, bot_token, db_url)
            elif body_data['action'] == 'send_message':
                chat_id = body_data.get('chat_id')
                message_text = body_data.get('message')
                if chat_id and message_text:
                    send_message(bot_token, chat_id, message_text)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'status': 'sent'})
                }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {}) or {}
        action = params.get('action')
        
        if action == 'set_webhook':
            webhook_url = params.get('url')
            return set_webhook(bot_token, webhook_url)
        
        if action == 'get_webhook_info':
            return get_webhook_info(bot_token)
    
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
            '✍️ /report - Отчитаться о прогрессе\n'
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
            '✍️ <b>/report</b> - Отчёт по работе (для менеджеров)\n'
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
    
    if text == '/report' and db_url:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute("SELECT id, role, full_name FROM users WHERE telegram_chat_id = %s", (str(chat_id),))
        user = cur.fetchone()
        
        if user and user[1] == 'manager':
            cur.execute(
                "SELECT id, title, priority, status FROM tickets WHERE assigned_to = %s AND status != 'closed' ORDER BY created_at DESC",
                (user[0],)
            )
            tickets = cur.fetchall()
            
            if tickets:
                msg = '✍️ <b>Выберите тикет для отчёта:</b>\n\n'
                priority_emoji = {'low': '📋', 'medium': '📌', 'high': '⚠️', 'urgent': '🔥'}
                keyboard = []
                
                for tid, title, priority, status in tickets:
                    msg += f"{priority_emoji.get(priority, '📌')} #{tid} - {title[:30]}...\n"
                    keyboard.append([{
                        'text': f'#{tid} - {title[:25]}',
                        'callback_data': f'report_{tid}'
                    }])
                
                send_message_with_keyboard(bot_token, chat_id, msg, keyboard)
            else:
                send_message(bot_token, chat_id, '📋 У вас нет активных тикетов')
        else:
            send_message(bot_token, chat_id, '❌ Команда доступна только менеджерам')
        
        cur.close()
        conn.close()
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
                cur.execute("UPDATE tickets SET status = 'closed' WHERE id = %s RETURNING title", (ticket_id,))
                ticket = cur.fetchone()
                conn.commit()
                
                if ticket:
                    send_message(bot_token, chat_id, f'✅ Тикет #{ticket_id} "{ticket[0]}" закрыт')
                else:
                    send_message(bot_token, chat_id, f'❌ Тикет #{ticket_id} не найден')
            else:
                send_message(bot_token, chat_id, '❌ Недостаточно прав')
            
            cur.close()
            conn.close()
        return {'statusCode': 200, 'body': ''}
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': ''
    }

def handle_callback_query(update: Dict[str, Any], bot_token: str, db_url: str) -> Dict[str, Any]:
    callback = update.get('callback_query', {})
    chat_id = callback.get('message', {}).get('chat', {}).get('id')
    callback_id = callback.get('id')
    data = callback.get('data', '')
    
    if not chat_id or not db_url:
        return {'statusCode': 200, 'body': ''}
    
    if data.startswith('report_'):
        ticket_id = data.replace('report_', '')
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM users WHERE telegram_chat_id = %s", (str(chat_id),))
        user = cur.fetchone()
        
        if user:
            msg = (
                f'✍️ <b>Отчёт по тикету #{ticket_id}</b>\n\n'
                f'Выберите процент выполнения:'
            )
            
            keyboard = [
                [
                    {'text': '25%', 'callback_data': f'progress_{ticket_id}_25'},
                    {'text': '50%', 'callback_data': f'progress_{ticket_id}_50'},
                    {'text': '75%', 'callback_data': f'progress_{ticket_id}_75'}
                ],
                [
                    {'text': '100% ✅', 'callback_data': f'progress_{ticket_id}_100'}
                ]
            ]
            
            send_message_with_keyboard(bot_token, chat_id, msg, keyboard)
            answer_callback(bot_token, callback_id, 'Выберите прогресс')
        
        cur.close()
        conn.close()
        return {'statusCode': 200, 'body': ''}
    
    if data.startswith('progress_'):
        parts = data.split('_')
        if len(parts) == 3:
            ticket_id = parts[1]
            progress = parts[2]
            
            conn = psycopg2.connect(db_url)
            cur = conn.cursor()
            
            cur.execute("SELECT id, full_name FROM users WHERE telegram_chat_id = %s", (str(chat_id),))
            user = cur.fetchone()
            
            if user:
                cur.execute(
                    "SELECT title, assigned_to FROM tickets WHERE id = %s",
                    (ticket_id,)
                )
                ticket = cur.fetchone()
                
                if ticket:
                    cur.execute(
                        "SELECT telegram_chat_id FROM users WHERE role = 'director'"
                    )
                    directors = cur.fetchall()
                    
                    manager_msg = f'✅ Отчёт отправлен руководству!\n\nТикет #{ticket_id}\nПрогресс: {progress}%'
                    send_message(bot_token, chat_id, manager_msg)
                    
                    director_msg = (
                        f'📋 <b>Отчёт от менеджера</b>\n\n'
                        f'Менеджер: {user[1]}\n'
                        f'Тикет: #{ticket_id} - {ticket[0]}\n'
                        f'Прогресс: {progress}%\n'
                        f'Время: {datetime.now().strftime("%d.%m.%Y %H:%M")}'
                    )
                    
                    for director in directors:
                        if director[0]:
                            send_message(bot_token, director[0], director_msg)
                    
                    if progress == '100':
                        cur.execute(
                            "UPDATE tickets SET status = 'completed' WHERE id = %s",
                            (ticket_id,)
                        )
                        conn.commit()
                    
                    answer_callback(bot_token, callback_id, f'Отчёт {progress}% отправлен')
            
            cur.close()
            conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': ''
    }

def send_ticket_notification(data: Dict[str, Any], bot_token: str, db_url: str) -> Dict[str, Any]:
    ticket_id = data.get('ticket_id')
    recipient_role = data.get('recipient_role')
    
    if not ticket_id or not db_url:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing parameters'})
        }
    
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute(
        '''SELECT t.id, t.title, t.priority, t.status, t.description,
                  u.full_name as creator, m.full_name as manager
           FROM tickets t
           JOIN users u ON t.created_by = u.id
           LEFT JOIN users m ON t.assigned_to = m.id
           WHERE t.id = %s''',
        (ticket_id,)
    )
    
    ticket = cur.fetchone()
    
    if not ticket:
        cur.close()
        conn.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Ticket not found'})
        }
    
    priority_emoji = {
        'low': '📋',
        'medium': '📌',
        'high': '⚠️',
        'urgent': '🔥'
    }
    
    message = (
        f"{priority_emoji.get(ticket[2], '📌')} <b>Новый тикет #{ticket[0]}</b>\n\n"
        f"<b>Название:</b> {ticket[1]}\n"
        f"<b>Приоритет:</b> {ticket[2]}\n"
        f"<b>От:</b> {ticket[5]}\n"
    )
    
    if ticket[6]:
        message += f"<b>Исполнитель:</b> {ticket[6]}\n"
    
    if ticket[4]:
        message += f"\n{ticket[4]}"
    
    cur.execute(
        "SELECT telegram_chat_id FROM users WHERE role = %s AND telegram_chat_id IS NOT NULL",
        (recipient_role,)
    )
    
    recipients = cur.fetchall()
    sent_count = 0
    
    for recipient in recipients:
        try:
            send_message(bot_token, recipient[0], message)
            sent_count += 1
        except:
            pass
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'sent': sent_count})
    }

def set_webhook(bot_token: str, webhook_url: str) -> Dict[str, Any]:
    try:
        url = f'https://api.telegram.org/bot{bot_token}/setWebhook'
        payload = {'url': webhook_url}
        
        data = json.dumps(payload).encode('utf-8')
        req = request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
        response = request.urlopen(req, timeout=10)
        result = json.loads(response.read().decode('utf-8'))
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def get_webhook_info(bot_token: str) -> Dict[str, Any]:
    try:
        url = f'https://api.telegram.org/bot{bot_token}/getWebhookInfo'
        req = request.Request(url, method='GET')
        response = request.urlopen(req, timeout=10)
        result = json.loads(response.read().decode('utf-8'))
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result.get('result', {}))
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def send_message(bot_token: str, chat_id: str, text: str):
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
    request.urlopen(req, timeout=5)

def send_message_with_keyboard(bot_token: str, chat_id: str, text: str, keyboard: list):
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML',
        'reply_markup': {
            'inline_keyboard': keyboard
        }
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
    request.urlopen(req, timeout=5)

def answer_callback(bot_token: str, callback_id: str, text: str):
    url = f'https://api.telegram.org/bot{bot_token}/answerCallbackQuery'
    payload = {
        'callback_query_id': callback_id,
        'text': text
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
    request.urlopen(req, timeout=5)