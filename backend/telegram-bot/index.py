import json
import os
import psycopg2
from psycopg2 import pool
from typing import Dict, Any, Optional, List, Tuple
from urllib import request, parse
from datetime import datetime, timedelta
import time

# Connection pool для оптимизации
connection_pool = None
cache = {}
CACHE_TTL = 300  # 5 минут

# Хранилище состояний для создания тикетов
user_states = {}

def get_db_connection(db_url: str):
    global connection_pool
    if connection_pool is None:
        connection_pool = psycopg2.pool.SimpleConnectionPool(1, 10, db_url)
    return connection_pool.getconn()

def release_db_connection(conn):
    global connection_pool
    if connection_pool:
        connection_pool.putconn(conn)

def get_cached(key: str, ttl: int = CACHE_TTL):
    if key in cache:
        cached_time, cached_value = cache[key]
        if time.time() - cached_time < ttl:
            return cached_value
    return None

def set_cache(key: str, value: Any):
    cache[key] = (time.time(), value)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Advanced Telegram bot with inline buttons and full features
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
            'body': '',
            'isBase64Encoded': False
        }
    
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    db_url = os.environ.get('DATABASE_URL')
    
    if not bot_token:
        print('[ERROR] Bot token not configured')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Bot token not configured'}),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        print(f'[DEBUG] Received update: {json.dumps(body_data)}')
        
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
        'body': json.dumps({'status': 'ok'}),
        'isBase64Encoded': False
    }

def handle_telegram_update(update: Dict[str, Any], bot_token: str, db_url: str) -> Dict[str, Any]:
    try:
        if 'callback_query' in update:
            return handle_callback_query(update, bot_token, db_url)
        
        message = update.get('message', {})
        chat_id = message.get('chat', {}).get('id')
        text = message.get('text', '')
        
        print(f'[DEBUG] Chat ID: {chat_id}, Text: {text}')
        
        if not chat_id:
            return {'statusCode': 200, 'body': '', 'isBase64Encoded': False}
        
        user = get_user_by_chat_id(chat_id, db_url) if db_url else None
        print(f'[DEBUG] User: {user}')
        
        if text == '/start':
            show_main_menu(bot_token, chat_id, user)
            return {'statusCode': 200, 'body': '', 'isBase64Encoded': False}
        
        if text.startswith('/link '):
            return handle_link_account(text, chat_id, bot_token, db_url)
        
        if user:
            if text.startswith('/'):
                handle_command(text, chat_id, bot_token, db_url, user)
            else:
                # Проверяем, есть ли активное состояние (создание тикета)
                if chat_id in user_states:
                    handle_ticket_creation_step(text, chat_id, bot_token, db_url, user)
                else:
                    show_main_menu(bot_token, chat_id, user)
        else:
            send_message(bot_token, chat_id, 
                '❌ Сначала привяжите аккаунт:\n/link ваш_username')
        
        return {'statusCode': 200, 'body': '', 'isBase64Encoded': False}
    except Exception as e:
        print(f'[ERROR] Exception in handle_telegram_update: {str(e)}')
        import traceback
        traceback.print_exc()
        return {'statusCode': 200, 'body': '', 'isBase64Encoded': False}

def get_user_by_chat_id(chat_id: int, db_url: str) -> Optional[Dict]:
    cache_key = f'user_{chat_id}'
    cached = get_cached(cache_key)
    if cached:
        return cached
    
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    cur.execute(
        "SELECT id, username, full_name, role FROM users WHERE telegram_chat_id = %s",
        (str(chat_id),)
    )
    result = cur.fetchone()
    cur.close()
    release_db_connection(conn)
    
    if result:
        user = {'id': result[0], 'username': result[1], 'full_name': result[2], 'role': result[3]}
        set_cache(cache_key, user)
        return user
    return None

def show_main_menu(bot_token: str, chat_id: int, user: Optional[Dict]):
    if not user:
        keyboard = [[{'text': '🔗 Привязать аккаунт', 'callback_data': 'link_help'}]]
        send_message_with_keyboard(bot_token, chat_id, 
            '👋 Добро пожаловать в 420 SMM бот!\n\nДля начала работы привяжите аккаунт:\n/link ваш_username', 
            keyboard)
        return
    
    role = user.get('role')
    name = user.get('full_name', user.get('username'))
    
    if role == 'director':
        keyboard = [
            [{'text': '➕ Создать тикет', 'callback_data': 'create_ticket'}],
            [{'text': '📊 Аналитика', 'callback_data': 'analytics_main'}],
            [{'text': '📋 Тикеты', 'callback_data': 'tickets_list'}, {'text': '👥 Команда', 'callback_data': 'team_stats'}],
            [{'text': '⚡ Быстрые действия', 'callback_data': 'quick_actions'}],
            [{'text': '📁 Экспорт отчётов', 'callback_data': 'export_menu'}],
            [{'text': '⚙️ Настройки', 'callback_data': 'settings'}]
        ]
        text = f'👑 Главное меню - {name}\n\nВыберите действие:'
    elif role == 'manager':
        keyboard = [
            [{'text': '➕ Создать тикет', 'callback_data': 'create_ticket'}],
            [{'text': '📋 Мои тикеты', 'callback_data': 'my_tickets'}],
            [{'text': '📊 Моя статистика', 'callback_data': 'my_stats'}, {'text': '✍️ Отчёт', 'callback_data': 'report_menu'}],
            [{'text': '⚡ Быстрые действия', 'callback_data': 'quick_actions'}],
            [{'text': '💬 Комментарии', 'callback_data': 'comments_menu'}]
        ]
        text = f'🎯 Главное меню - {name}\n\nВыберите действие:'
    else:  # artist
        keyboard = [
            [{'text': '📋 Мои задачи', 'callback_data': 'my_tasks'}],
            [{'text': '📊 Моя статистика', 'callback_data': 'my_stats'}],
            [{'text': '✍️ Отправить отчёт', 'callback_data': 'submit_report'}]
        ]
        text = f'🎤 Главное меню - {name}\n\nВыберите действие:'
    
    send_message_with_keyboard(bot_token, chat_id, text, keyboard)

def handle_callback_query(update: Dict[str, Any], bot_token: str, db_url: str) -> Dict[str, Any]:
    callback = update['callback_query']
    chat_id = callback['message']['chat']['id']
    message_id = callback['message']['message_id']
    data = callback['data']
    callback_id = callback['id']
    
    answer_callback(bot_token, callback_id)
    
    user = get_user_by_chat_id(chat_id, db_url) if db_url else None
    
    if not user and not data.startswith('link_'):
        send_message(bot_token, chat_id, '❌ Сначала привяжите аккаунт: /link ваш_username')
        return {'statusCode': 200, 'body': ''}
    
    # Навигация
    if data == 'main_menu':
        delete_message(bot_token, chat_id, message_id)
        show_main_menu(bot_token, chat_id, user)
    
    # Аналитика
    elif data == 'analytics_main':
        show_analytics_menu(bot_token, chat_id, message_id, user, db_url)
    elif data == 'analytics_tickets':
        show_ticket_analytics(bot_token, chat_id, message_id, db_url)
    elif data == 'analytics_team':
        show_team_analytics(bot_token, chat_id, message_id, db_url)
    elif data == 'team_stats':
        show_team_stats(bot_token, chat_id, message_id, db_url)
    
    # Тикеты
    elif data == 'tickets_list':
        show_tickets_list(bot_token, chat_id, message_id, user, db_url)
    elif data == 'my_tickets':
        show_my_tickets(bot_token, chat_id, message_id, user, db_url)
    elif data == 'create_ticket':
        start_ticket_creation(bot_token, chat_id, message_id, user)
    elif data == 'cancel_ticket':
        cancel_ticket_creation(bot_token, chat_id, message_id)
    elif data == 'deadline_today':
        complete_ticket_creation(bot_token, chat_id, message_id, 0, user, db_url)
    elif data == 'deadline_tomorrow':
        complete_ticket_creation(bot_token, chat_id, message_id, 1, user, db_url)
    elif data == 'deadline_3days':
        complete_ticket_creation(bot_token, chat_id, message_id, 3, user, db_url)
    elif data.startswith('ticket_'):
        ticket_id = int(data.split('_')[1])
        show_ticket_details(bot_token, chat_id, message_id, ticket_id, user, db_url)
    elif data.startswith('close_'):
        ticket_id = int(data.split('_')[1])
        close_ticket(bot_token, chat_id, message_id, ticket_id, user, db_url)
    elif data.startswith('assign_'):
        ticket_id = int(data.split('_')[1])
        show_assign_menu(bot_token, chat_id, message_id, ticket_id, db_url)
    elif data.startswith('assignto_'):
        parts = data.split('_')
        ticket_id, user_id = int(parts[1]), int(parts[2])
        assign_ticket(bot_token, chat_id, message_id, ticket_id, user_id, db_url)
    elif data.startswith('priority_'):
        parts = data.split('_')
        ticket_id = int(parts[1])
        show_priority_menu(bot_token, chat_id, message_id, ticket_id)
    elif data.startswith('setpriority_'):
        parts = data.split('_')
        ticket_id, priority = int(parts[1]), parts[2]
        set_ticket_priority(bot_token, chat_id, message_id, ticket_id, priority, db_url)
    
    # Быстрые действия
    elif data == 'quick_actions':
        show_quick_actions(bot_token, chat_id, message_id, user)
    
    # Статистика
    elif data == 'my_stats':
        show_my_stats(bot_token, chat_id, message_id, user, db_url)
    
    # Экспорт
    elif data == 'export_menu':
        show_export_menu(bot_token, chat_id, message_id)
    elif data.startswith('export_'):
        period = data.split('_')[1]
        export_report(bot_token, chat_id, message_id, period, user, db_url)
    
    # Комментарии
    elif data == 'comments_menu':
        show_comments_menu(bot_token, chat_id, message_id, user, db_url)
    elif data.startswith('comment_'):
        ticket_id = int(data.split('_')[1])
        prompt_comment(bot_token, chat_id, ticket_id)
    
    return {'statusCode': 200, 'body': ''}

def show_analytics_menu(bot_token: str, chat_id: int, message_id: int, user: Dict, db_url: str):
    keyboard = [
        [{'text': '📊 Аналитика тикетов', 'callback_data': 'analytics_tickets'}],
        [{'text': '👥 Аналитика команды', 'callback_data': 'analytics_team'}],
        [{'text': '🔙 Главное меню', 'callback_data': 'main_menu'}]
    ]
    edit_message(bot_token, chat_id, message_id, '📊 Аналитика\n\nВыберите раздел:', keyboard)

def show_ticket_analytics(bot_token: str, chat_id: int, message_id: int, db_url: str):
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM tickets")
    total = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM tickets WHERE status = 'open'")
    open_count = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM tickets WHERE status = 'in_progress'")
    in_progress = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM tickets WHERE status = 'closed'")
    closed = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM tickets WHERE deadline < NOW() AND status != 'closed'")
    overdue = cur.fetchone()[0]
    
    cur.execute("""
        SELECT priority, COUNT(*) 
        FROM tickets 
        WHERE status != 'closed' 
        GROUP BY priority
    """)
    priorities = dict(cur.fetchall())
    
    cur.close()
    release_db_connection(conn)
    
    priority_emoji = {'low': '📋', 'medium': '📌', 'high': '⚠️', 'urgent': '🔥'}
    priority_text = '\n'.join([
        f"{priority_emoji.get(p, '📌')} {p.title()}: {priorities.get(p, 0)}"
        for p in ['urgent', 'high', 'medium', 'low']
    ])
    
    text = (
        f'📊 <b>Статистика тикетов</b>\n\n'
        f'📌 Всего: {total}\n'
        f'🆕 Открытых: {open_count}\n'
        f'⚙️ В работе: {in_progress}\n'
        f'✅ Закрытых: {closed}\n'
        f'🔥 Просрочено: {overdue}\n\n'
        f'<b>По приоритетам:</b>\n{priority_text}'
    )
    
    keyboard = [[{'text': '🔙 Назад', 'callback_data': 'analytics_main'}]]
    edit_message(bot_token, chat_id, message_id, text, keyboard)

def show_team_analytics(bot_token: str, chat_id: int, message_id: int, db_url: str):
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT u.full_name, COUNT(t.id) as total,
               SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) as closed
        FROM users u
        LEFT JOIN tickets t ON t.assigned_to = u.id
        WHERE u.role = 'manager'
        GROUP BY u.id, u.full_name
        ORDER BY closed DESC
        LIMIT 10
    """)
    
    managers = cur.fetchall()
    cur.close()
    release_db_connection(conn)
    
    if managers:
        text = '👥 <b>Топ менеджеров:</b>\n\n'
        for i, (name, total, closed) in enumerate(managers, 1):
            medal = ['🥇', '🥈', '🥉'][i-1] if i <= 3 else f'{i}.'
            text += f'{medal} {name}\n   └ Всего: {total} | Закрыто: {closed}\n\n'
    else:
        text = '👥 Нет данных по команде'
    
    keyboard = [[{'text': '🔙 Назад', 'callback_data': 'analytics_main'}]]
    edit_message(bot_token, chat_id, message_id, text, keyboard)

def show_team_stats(bot_token: str, chat_id: int, message_id: int, db_url: str):
    show_team_analytics(bot_token, chat_id, message_id, db_url)

def show_tickets_list(bot_token: str, chat_id: int, message_id: int, user: Dict, db_url: str):
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT t.id, t.title, t.priority, t.status, u.full_name
        FROM tickets t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.status != 'closed'
        ORDER BY 
            CASE t.priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                ELSE 4 
            END,
            t.created_at DESC
        LIMIT 15
    """)
    
    tickets = cur.fetchall()
    cur.close()
    release_db_connection(conn)
    
    if tickets:
        text = '📋 <b>Активные тикеты:</b>\n\n'
        keyboard = []
        
        priority_emoji = {'low': '📋', 'medium': '📌', 'high': '⚠️', 'urgent': '🔥'}
        status_emoji = {'open': '🆕', 'in_progress': '⚙️', 'closed': '✅'}
        
        for tid, title, priority, status, assignee in tickets:
            emoji = priority_emoji.get(priority, '📌')
            assignee_text = f" → {assignee}" if assignee else " (не назначен)"
            text += f"{emoji} #{tid} - {title[:25]}{'...' if len(title) > 25 else ''}{assignee_text}\n"
            keyboard.append([{'text': f'#{tid} - {title[:30]}', 'callback_data': f'ticket_{tid}'}])
        
        keyboard.append([{'text': '🔙 Главное меню', 'callback_data': 'main_menu'}])
    else:
        text = '📋 Нет активных тикетов'
        keyboard = [[{'text': '🔙 Главное меню', 'callback_data': 'main_menu'}]]
    
    edit_message(bot_token, chat_id, message_id, text, keyboard)

def show_my_tickets(bot_token: str, chat_id: int, message_id: int, user: Dict, db_url: str):
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, title, priority, status, deadline
        FROM tickets
        WHERE assigned_to = %s AND status != 'closed'
        ORDER BY 
            CASE priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                ELSE 4 
            END,
            deadline ASC NULLS LAST
        LIMIT 15
    """, (user['id'],))
    
    tickets = cur.fetchall()
    cur.close()
    release_db_connection(conn)
    
    if tickets:
        text = '📋 <b>Мои тикеты:</b>\n\n'
        keyboard = []
        
        priority_emoji = {'low': '📋', 'medium': '📌', 'high': '⚠️', 'urgent': '🔥'}
        
        for tid, title, priority, status, deadline in tickets:
            emoji = priority_emoji.get(priority, '📌')
            deadline_text = ''
            if deadline:
                deadline_dt = deadline if isinstance(deadline, datetime) else datetime.fromisoformat(str(deadline))
                if deadline_dt < datetime.now():
                    deadline_text = ' 🔥 ПРОСРОЧЕН'
                else:
                    days_left = (deadline_dt - datetime.now()).days
                    if days_left == 0:
                        deadline_text = ' ⏰ Сегодня'
                    elif days_left == 1:
                        deadline_text = ' ⏰ Завтра'
                    else:
                        deadline_text = f' ⏰ {days_left}д'
            
            text += f"{emoji} #{tid} - {title[:30]}{deadline_text}\n"
            keyboard.append([{'text': f'#{tid} - {title[:30]}', 'callback_data': f'ticket_{tid}'}])
        
        keyboard.append([{'text': '🔙 Главное меню', 'callback_data': 'main_menu'}])
    else:
        text = '📋 У вас нет активных тикетов'
        keyboard = [[{'text': '🔙 Главное меню', 'callback_data': 'main_menu'}]]
    
    edit_message(bot_token, chat_id, message_id, text, keyboard)

def show_ticket_details(bot_token: str, chat_id: int, message_id: int, ticket_id: int, user: Dict, db_url: str):
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT t.title, t.description, t.priority, t.status, t.deadline,
               u1.full_name as creator, u2.full_name as assignee, t.created_at
        FROM tickets t
        LEFT JOIN users u1 ON t.created_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        WHERE t.id = %s
    """, (ticket_id,))
    
    ticket = cur.fetchone()
    cur.close()
    release_db_connection(conn)
    
    if not ticket:
        edit_message(bot_token, chat_id, message_id, '❌ Тикет не найден', 
                    [[{'text': '🔙 Назад', 'callback_data': 'tickets_list'}]])
        return
    
    title, desc, priority, status, deadline, creator, assignee, created = ticket
    
    priority_emoji = {'low': '📋', 'medium': '📌', 'high': '⚠️', 'urgent': '🔥'}
    status_emoji = {'open': '🆕', 'in_progress': '⚙️', 'resolved': '✅', 'closed': '✅'}
    
    deadline_text = 'Не установлен'
    if deadline:
        deadline_dt = deadline if isinstance(deadline, datetime) else datetime.fromisoformat(str(deadline))
        deadline_text = deadline_dt.strftime('%d.%m.%Y')
        if deadline_dt < datetime.now():
            deadline_text += ' 🔥 ПРОСРОЧЕН'
    
    text = (
        f'🎫 <b>Тикет #{ticket_id}</b>\n\n'
        f'📝 <b>Название:</b> {title}\n'
        f'📄 <b>Описание:</b> {desc or "Не указано"}\n\n'
        f'{priority_emoji.get(priority, "📌")} <b>Приоритет:</b> {priority}\n'
        f'{status_emoji.get(status, "📌")} <b>Статус:</b> {status}\n'
        f'⏰ <b>Дедлайн:</b> {deadline_text}\n\n'
        f'👤 <b>Создал:</b> {creator}\n'
        f'👨‍💼 <b>Назначен:</b> {assignee or "Не назначен"}'
    )
    
    keyboard = []
    
    if user['role'] in ['director', 'manager']:
        keyboard.append([
            {'text': '👤 Назначить', 'callback_data': f'assign_{ticket_id}'},
            {'text': '⚡ Приоритет', 'callback_data': f'priority_{ticket_id}'}
        ])
        keyboard.append([
            {'text': '✅ Закрыть', 'callback_data': f'close_{ticket_id}'}
        ])
    
    keyboard.append([{'text': '🔙 Назад', 'callback_data': 'tickets_list'}])
    
    edit_message(bot_token, chat_id, message_id, text, keyboard)

def show_assign_menu(bot_token: str, chat_id: int, message_id: int, ticket_id: int, db_url: str):
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    cur.execute("SELECT id, full_name FROM users WHERE role = 'manager' ORDER BY full_name")
    managers = cur.fetchall()
    
    cur.close()
    release_db_connection(conn)
    
    text = f'👤 Выберите менеджера для тикета #{ticket_id}:'
    keyboard = []
    
    for manager_id, name in managers:
        keyboard.append([{'text': name, 'callback_data': f'assignto_{ticket_id}_{manager_id}'}])
    
    keyboard.append([{'text': '🔙 Назад', 'callback_data': f'ticket_{ticket_id}'}])
    
    edit_message(bot_token, chat_id, message_id, text, keyboard)

def assign_ticket(bot_token: str, chat_id: int, message_id: int, ticket_id: int, user_id: int, db_url: str):
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    cur.execute("UPDATE tickets SET assigned_to = %s, status = 'in_progress' WHERE id = %s", (user_id, ticket_id))
    conn.commit()
    
    cur.execute("SELECT full_name, telegram_chat_id FROM users WHERE id = %s", (user_id,))
    assignee = cur.fetchone()
    
    cur.close()
    release_db_connection(conn)
    
    if assignee and assignee[1]:
        send_message(bot_token, assignee[1], f'🎯 Вам назначен новый тикет #{ticket_id}')
    
    edit_message(bot_token, chat_id, message_id, 
                f'✅ Тикет #{ticket_id} назначен на {assignee[0] if assignee else "менеджера"}',
                [[{'text': '🔙 К тикету', 'callback_data': f'ticket_{ticket_id}'}]])

def show_priority_menu(bot_token: str, chat_id: int, message_id: int, ticket_id: int):
    text = f'⚡ Выберите приоритет для тикета #{ticket_id}:'
    keyboard = [
        [{'text': '🔥 Срочный', 'callback_data': f'setpriority_{ticket_id}_urgent'}],
        [{'text': '⚠️ Высокий', 'callback_data': f'setpriority_{ticket_id}_high'}],
        [{'text': '📌 Средний', 'callback_data': f'setpriority_{ticket_id}_medium'}],
        [{'text': '📋 Низкий', 'callback_data': f'setpriority_{ticket_id}_low'}],
        [{'text': '🔙 Назад', 'callback_data': f'ticket_{ticket_id}'}]
    ]
    edit_message(bot_token, chat_id, message_id, text, keyboard)

def set_ticket_priority(bot_token: str, chat_id: int, message_id: int, ticket_id: int, priority: str, db_url: str):
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    cur.execute("UPDATE tickets SET priority = %s WHERE id = %s", (priority, ticket_id))
    conn.commit()
    
    cur.close()
    release_db_connection(conn)
    
    priority_emoji = {'low': '📋', 'medium': '📌', 'high': '⚠️', 'urgent': '🔥'}
    
    edit_message(bot_token, chat_id, message_id, 
                f'✅ Приоритет тикета #{ticket_id} изменён на {priority_emoji.get(priority)} {priority}',
                [[{'text': '🔙 К тикету', 'callback_data': f'ticket_{ticket_id}'}]])

def close_ticket(bot_token: str, chat_id: int, message_id: int, ticket_id: int, user: Dict, db_url: str):
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    cur.execute("UPDATE tickets SET status = 'closed' WHERE id = %s", (ticket_id,))
    conn.commit()
    
    cur.close()
    release_db_connection(conn)
    
    edit_message(bot_token, chat_id, message_id, 
                f'✅ Тикет #{ticket_id} закрыт',
                [[{'text': '🔙 К списку', 'callback_data': 'tickets_list'}]])

def show_quick_actions(bot_token: str, chat_id: int, message_id: int, user: Dict):
    role = user.get('role')
    
    if role == 'director':
        text = '⚡ <b>Быстрые действия:</b>\n\n' \
               '• /assign #123 @user - Назначить тикет\n' \
               '• /priority #123 high - Изменить приоритет\n' \
               '• /close #123 - Закрыть тикет\n' \
               '• /broadcast текст - Сообщение всем'
        keyboard = [
            [{'text': '📊 Статистика', 'callback_data': 'analytics_main'}],
            [{'text': '📋 Тикеты', 'callback_data': 'tickets_list'}],
            [{'text': '🔙 Главное меню', 'callback_data': 'main_menu'}]
        ]
    elif role == 'manager':
        text = '⚡ <b>Быстрые действия:</b>\n\n' \
               '• /close #123 - Закрыть тикет\n' \
               '• /comment #123 текст - Комментарий\n' \
               '• /report - Отчёт о работе'
        keyboard = [
            [{'text': '📋 Мои тикеты', 'callback_data': 'my_tickets'}],
            [{'text': '📊 Моя статистика', 'callback_data': 'my_stats'}],
            [{'text': '🔙 Главное меню', 'callback_data': 'main_menu'}]
        ]
    else:
        text = '⚡ <b>Быстрые действия:</b>\n\n' \
               '• /report - Отправить отчёт\n' \
               '• /help - Помощь'
        keyboard = [[{'text': '🔙 Главное меню', 'callback_data': 'main_menu'}]]
    
    edit_message(bot_token, chat_id, message_id, text, keyboard)

def show_my_stats(bot_token: str, chat_id: int, message_id: int, user: Dict, db_url: str):
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    if user['role'] == 'manager':
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN deadline < NOW() AND status != 'closed' THEN 1 ELSE 0 END) as overdue
            FROM tickets
            WHERE assigned_to = %s
        """, (user['id'],))
        
        stats = cur.fetchone()
        total, closed, in_progress, overdue = stats or (0, 0, 0, 0)
        
        completion_rate = round(closed / total * 100, 1) if total > 0 else 0
        
        text = (
            f'📊 <b>Моя статистика - {user["full_name"]}</b>\n\n'
            f'📌 Всего тикетов: {total}\n'
            f'✅ Закрыто: {closed}\n'
            f'⚙️ В работе: {in_progress}\n'
            f'🔥 Просрочено: {overdue}\n\n'
            f'📈 Процент выполнения: {completion_rate}%'
        )
    else:
        text = '📊 Статистика доступна только менеджерам'
    
    cur.close()
    release_db_connection(conn)
    
    keyboard = [[{'text': '🔙 Главное меню', 'callback_data': 'main_menu'}]]
    edit_message(bot_token, chat_id, message_id, text, keyboard)

def show_export_menu(bot_token: str, chat_id: int, message_id: int):
    text = '📁 <b>Экспорт отчётов</b>\n\nВыберите период:'
    keyboard = [
        [{'text': '📅 За сегодня', 'callback_data': 'export_today'}],
        [{'text': '📅 За неделю', 'callback_data': 'export_week'}],
        [{'text': '📅 За месяц', 'callback_data': 'export_month'}],
        [{'text': '🔙 Главное меню', 'callback_data': 'main_menu'}]
    ]
    edit_message(bot_token, chat_id, message_id, text, keyboard)

def export_report(bot_token: str, chat_id: int, message_id: int, period: str, user: Dict, db_url: str):
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    date_filter = {
        'today': "DATE(created_at) = CURRENT_DATE",
        'week': "created_at >= NOW() - INTERVAL '7 days'",
        'month': "created_at >= NOW() - INTERVAL '30 days'"
    }
    
    filter_sql = date_filter.get(period, date_filter['week'])
    
    cur.execute(f"""
        SELECT t.id, t.title, t.priority, t.status, t.created_at, u.full_name
        FROM tickets t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE {filter_sql}
        ORDER BY t.created_at DESC
    """)
    
    tickets = cur.fetchall()
    cur.close()
    release_db_connection(conn)
    
    if tickets:
        period_names = {'today': 'сегодня', 'week': 'неделю', 'month': 'месяц'}
        text = f'📁 <b>Отчёт за {period_names.get(period, "период")}</b>\n\n'
        
        for tid, title, priority, status, created, assignee in tickets[:20]:
            status_emoji = {'open': '🆕', 'in_progress': '⚙️', 'closed': '✅'}
            text += f"{status_emoji.get(status, '📌')} #{tid} {title[:30]}\n"
            text += f"   └ {assignee or 'Не назначен'} | {priority}\n\n"
        
        if len(tickets) > 20:
            text += f'\n... и ещё {len(tickets) - 20} тикетов'
    else:
        text = '📁 Нет данных за выбранный период'
    
    keyboard = [[{'text': '🔙 Назад', 'callback_data': 'export_menu'}]]
    edit_message(bot_token, chat_id, message_id, text, keyboard)

def show_comments_menu(bot_token: str, chat_id: int, message_id: int, user: Dict, db_url: str):
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT t.id, t.title
        FROM tickets t
        WHERE t.assigned_to = %s AND t.status != 'closed'
        ORDER BY t.created_at DESC
        LIMIT 10
    """, (user['id'],))
    
    tickets = cur.fetchall()
    cur.close()
    release_db_connection(conn)
    
    if tickets:
        text = '💬 <b>Выберите тикет для комментария:</b>\n'
        keyboard = []
        
        for tid, title in tickets:
            keyboard.append([{'text': f'#{tid} - {title[:30]}', 'callback_data': f'comment_{tid}'}])
        
        keyboard.append([{'text': '🔙 Главное меню', 'callback_data': 'main_menu'}])
    else:
        text = '💬 У вас нет тикетов для комментирования'
        keyboard = [[{'text': '🔙 Главное меню', 'callback_data': 'main_menu'}]]
    
    edit_message(bot_token, chat_id, message_id, text, keyboard)

def prompt_comment(bot_token: str, chat_id: int, ticket_id: int):
    send_message(bot_token, chat_id, 
                f'💬 Отправьте комментарий к тикету #{ticket_id}:\n\nПросто напишите сообщение, я добавлю его как комментарий.')

def handle_link_account(text: str, chat_id: int, bot_token: str, db_url: str):
    username = text.split(' ', 1)[1] if ' ' in text else ''
    if username and db_url:
        conn = get_db_connection(db_url)
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET telegram_chat_id = %s WHERE username = %s RETURNING id, full_name, role",
            (str(chat_id), username)
        )
        result = cur.fetchone()
        conn.commit()
        cur.close()
        release_db_connection(conn)
        
        if result:
            user = {'id': result[0], 'username': username, 'full_name': result[1], 'role': result[2]}
            set_cache(f'user_{chat_id}', user)
            
            role_emoji = {'director': '👑', 'manager': '🎯', 'artist': '🎤'}
            send_message(bot_token, chat_id, 
                        f'✅ Аккаунт {username} успешно привязан!\nРоль: {role_emoji.get(result[2], "")} {result[2]}')
            show_main_menu(bot_token, chat_id, user)
        else:
            send_message(bot_token, chat_id, '❌ Пользователь не найден')
    return {'statusCode': 200, 'body': ''}

def handle_command(text: str, chat_id: int, bot_token: str, db_url: str, user: Dict):
    if text == '/menu':
        show_main_menu(bot_token, chat_id, user)
    elif text == '/stats':
        keyboard = [[{'text': '📊 Открыть аналитику', 'callback_data': 'analytics_tickets'}]]
        send_message_with_keyboard(bot_token, chat_id, 'Для статистики используйте меню ниже:', keyboard)
    else:
        show_main_menu(bot_token, chat_id, user)

def send_ticket_notification(data: Dict, bot_token: str, db_url: str) -> Dict[str, Any]:
    ticket_id = data.get('ticket_id')
    notification_type = data.get('type', 'new')
    
    if not ticket_id or not db_url:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing parameters'})
        }
    
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT t.title, t.priority, u.telegram_chat_id, u.full_name
        FROM tickets t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.id = %s AND u.telegram_chat_id IS NOT NULL
    """, (ticket_id,))
    
    result = cur.fetchone()
    cur.close()
    release_db_connection(conn)
    
    if result:
        title, priority, chat_id, name = result
        priority_emoji = {'low': '📋', 'medium': '📌', 'high': '⚠️', 'urgent': '🔥'}
        
        if notification_type == 'new':
            message = f'{priority_emoji.get(priority, "📌")} Новый тикет #{ticket_id}\n\n{title}\n\nПриоритет: {priority}'
        elif notification_type == 'deadline':
            message = f'⏰ Напоминание о дедлайне!\n\nТикет #{ticket_id}: {title}\n\nНе забудьте завершить задачу!'
        else:
            message = f'🔔 Обновление тикета #{ticket_id}\n\n{title}'
        
        keyboard = [[{'text': 'Открыть тикет', 'callback_data': f'ticket_{ticket_id}'}]]
        send_message_with_keyboard(bot_token, chat_id, message, keyboard)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'sent': 1 if result else 0})
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
        'chat_id': int(chat_id) if isinstance(chat_id, str) and chat_id.isdigit() else chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
    
    try:
        response = request.urlopen(req, timeout=5)
        return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f'Error sending message: {str(e)}')
        return None

def send_message_with_keyboard(bot_token: str, chat_id: int, text: str, keyboard: list):
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    payload = {
        'chat_id': int(chat_id) if isinstance(chat_id, str) and chat_id.isdigit() else chat_id,
        'text': text,
        'parse_mode': 'HTML',
        'reply_markup': {
            'inline_keyboard': keyboard
        }
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
    
    try:
        response = request.urlopen(req, timeout=5)
        return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f'Error sending message with keyboard: {str(e)}')
        return None

def edit_message(bot_token: str, chat_id: int, message_id: int, text: str, keyboard: list = None):
    url = f'https://api.telegram.org/bot{bot_token}/editMessageText'
    payload = {
        'chat_id': chat_id,
        'message_id': message_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    
    if keyboard:
        payload['reply_markup'] = {'inline_keyboard': keyboard}
    
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
    
    try:
        response = request.urlopen(req, timeout=5)
        return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f'Error editing message: {str(e)}')
        return None

def delete_message(bot_token: str, chat_id: int, message_id: int):
    url = f'https://api.telegram.org/bot{bot_token}/deleteMessage'
    payload = {
        'chat_id': chat_id,
        'message_id': message_id
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
    
    try:
        request.urlopen(req, timeout=5)
    except:
        pass

def answer_callback(bot_token: str, callback_id: str, text: str = None):
    url = f'https://api.telegram.org/bot{bot_token}/answerCallbackQuery'
    payload = {'callback_query_id': callback_id}
    if text:
        payload['text'] = text
    
    data = json.dumps(payload).encode('utf-8')
    req = request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
    
    try:
        request.urlopen(req, timeout=3)
    except:
        pass

def start_ticket_creation(bot_token: str, chat_id: int, message_id: int, user: Dict):
    global user_states
    user_states[chat_id] = {'step': 'title', 'data': {}}
    
    keyboard = [[{'text': '❌ Отменить', 'callback_data': 'cancel_ticket'}]]
    edit_message(bot_token, chat_id, message_id, 
                '📝 <b>Создание тикета</b>\n\nВведите название тикета:', keyboard)

def cancel_ticket_creation(bot_token: str, chat_id: int, message_id: int):
    global user_states
    if chat_id in user_states:
        del user_states[chat_id]
    
    delete_message(bot_token, chat_id, message_id)
    send_message(bot_token, chat_id, '❌ Создание тикета отменено')

def handle_ticket_creation_step(text: str, chat_id: int, bot_token: str, db_url: str, user: Dict):
    global user_states
    
    if chat_id not in user_states:
        return
    
    state = user_states[chat_id]
    step = state['step']
    
    if step == 'title':
        state['data']['title'] = text
        state['step'] = 'description'
        keyboard = [[{'text': '❌ Отменить', 'callback_data': 'cancel_ticket'}]]
        send_message_with_keyboard(bot_token, chat_id, 
                                  '✅ Название принято!\n\nТеперь введите описание тикета:', keyboard)
    
    elif step == 'description':
        state['data']['description'] = text
        state['step'] = 'deadline'
        keyboard = [
            [{'text': 'Сегодня', 'callback_data': 'deadline_today'}],
            [{'text': 'Завтра', 'callback_data': 'deadline_tomorrow'}],
            [{'text': '3 дня', 'callback_data': 'deadline_3days'}],
            [{'text': '❌ Отменить', 'callback_data': 'cancel_ticket'}]
        ]
        send_message_with_keyboard(bot_token, chat_id, 
                                  '✅ Описание принято!\n\nВыберите дедлайн:', keyboard)

def complete_ticket_creation(bot_token: str, chat_id: int, message_id: int, deadline_days: int, user: Dict, db_url: str):
    global user_states
    
    if chat_id not in user_states:
        return
    
    state = user_states[chat_id]
    data = state['data']
    
    deadline = datetime.now() + timedelta(days=deadline_days)
    
    conn = get_db_connection(db_url)
    cur = conn.cursor()
    
    cur.execute(
        """INSERT INTO tickets (title, description, creator_id, deadline, status, priority, created_at) 
           VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
        (data['title'], data['description'], user['id'], deadline, 'open', 'medium', datetime.now())
    )
    
    ticket_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    release_db_connection(conn)
    
    del user_states[chat_id]
    
    edit_message(bot_token, chat_id, message_id, 
                f'✅ <b>Тикет #{ticket_id} создан!</b>\n\n'
                f'📌 <b>{data["title"]}</b>\n'
                f'📄 {data["description"]}\n'
                f'⏰ Дедлайн: {deadline.strftime("%d.%m.%Y")}')
    
    show_main_menu(bot_token, chat_id, user)