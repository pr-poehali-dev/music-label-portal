import json
import os
import psycopg2
from typing import Dict, Any
from urllib import request
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Send deadline reminders for tickets
    Args: event with httpMethod; context with request_id
    Returns: HTTP response with reminder status
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
    
    if not bot_token or not db_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Configuration missing'})
        }
    
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    now = datetime.now()
    tomorrow = now + timedelta(hours=24)
    
    cur.execute(
        '''SELECT t.id, t.title, t.deadline, t.priority, 
                  u.full_name as creator_name, 
                  m.full_name as manager_name, 
                  m.telegram_chat_id as manager_chat_id,
                  d.telegram_chat_id as director_chat_id
           FROM tickets t
           JOIN users u ON t.created_by = u.id
           LEFT JOIN users m ON t.assigned_to = m.id
           LEFT JOIN users d ON d.role = 'director'
           WHERE t.status IN ('open', 'in_progress')
             AND t.deadline IS NOT NULL
             AND t.deadline <= %s
             AND t.deadline > %s''',
        (tomorrow.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S'))
    )
    
    tickets_soon = cur.fetchall()
    
    cur.execute(
        '''SELECT t.id, t.title, t.deadline, t.priority, 
                  u.full_name as creator_name, 
                  m.full_name as manager_name, 
                  m.telegram_chat_id as manager_chat_id,
                  d.telegram_chat_id as director_chat_id
           FROM tickets t
           JOIN users u ON t.created_by = u.id
           LEFT JOIN users m ON t.assigned_to = m.id
           LEFT JOIN users d ON d.role = 'director'
           WHERE t.status IN ('open', 'in_progress')
             AND t.deadline IS NOT NULL
             AND t.deadline < %s''',
        (now.strftime('%Y-%m-%d %H:%M:%S'),)
    )
    
    tickets_overdue = cur.fetchall()
    
    cur.close()
    conn.close()
    
    sent_count = 0
    
    priority_emoji = {
        'low': '📋',
        'medium': '📌',
        'high': '⚠️',
        'urgent': '🔥'
    }
    
    for ticket in tickets_soon:
        tid, title, deadline, priority, creator, manager, manager_chat, director_chat = ticket
        
        hours_left = int((deadline - now).total_seconds() / 3600)
        
        message = (
            f"⏰ <b>Приближается дедлайн!</b>\n\n"
            f"{priority_emoji.get(priority, '📌')} Тикет #{tid}: {title}\n"
            f"<b>Дедлайн:</b> {deadline.strftime('%d.%m.%Y %H:%M')}\n"
            f"<b>Осталось:</b> ~{hours_left} ч.\n"
            f"<b>Автор:</b> {creator}\n"
        )
        
        if manager:
            message += f"<b>Исполнитель:</b> {manager}\n"
        
        if manager_chat:
            send_telegram_message(bot_token, manager_chat, message)
            sent_count += 1
        
        if director_chat:
            send_telegram_message(bot_token, director_chat, message)
            sent_count += 1
    
    for ticket in tickets_overdue:
        tid, title, deadline, priority, creator, manager, manager_chat, director_chat = ticket
        
        hours_overdue = int((now - deadline).total_seconds() / 3600)
        
        message = (
            f"🚨 <b>ПРОСРОЧЕН ДЕДЛАЙН!</b>\n\n"
            f"{priority_emoji.get(priority, '📌')} Тикет #{tid}: {title}\n"
            f"<b>Дедлайн был:</b> {deadline.strftime('%d.%m.%Y %H:%M')}\n"
            f"<b>Просрочено:</b> {hours_overdue} ч.\n"
            f"<b>Автор:</b> {creator}\n"
        )
        
        if manager:
            message += f"<b>Исполнитель:</b> {manager}\n"
        
        if manager_chat:
            send_telegram_message(bot_token, manager_chat, message)
            sent_count += 1
        
        if director_chat:
            send_telegram_message(bot_token, director_chat, message)
            sent_count += 1
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'status': 'ok',
            'sent': sent_count,
            'tickets_soon': len(tickets_soon),
            'tickets_overdue': len(tickets_overdue)
        })
    }

def send_telegram_message(bot_token: str, chat_id: str, text: str):
    try:
        url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        payload = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }
        
        data = json.dumps(payload).encode('utf-8')
        req = request.Request(url, data=data, method='POST', headers={'Content-Type': 'application/json'})
        request.urlopen(req, timeout=5)
    except Exception:
        pass
