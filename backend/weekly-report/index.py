'''
Business: Генерация и отправка еженедельного отчёта директору с статистикой задач и тикетов
Args: event с httpMethod, headers, body; context с request_id
Returns: HTTP response с отчётом или отправкой в Telegram
'''

import json
import os
from datetime import datetime, timedelta
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    if method == 'GET':
        # Получение отчёта за последнюю неделю
        week_ago = (datetime.now() - timedelta(days=7)).isoformat()
        
        # Статистика по задачам
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE deadline < NOW() AND status != 'completed') as overdue
            FROM tasks
            WHERE created_at >= %s
        """, (week_ago,))
        
        tasks_stats = cur.fetchone()
        
        # Статистика по тикетам
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                COUNT(*) FILTER (WHERE status = 'open') as open
            FROM tickets
            WHERE created_at >= %s
        """, (week_ago,))
        
        tickets_stats = cur.fetchone()
        
        # Топ менеджеров по выполненным задачам
        cur.execute("""
            SELECT u.full_name, COUNT(*) as completed_tasks
            FROM tasks t
            JOIN users u ON t.assigned_to = u.id
            WHERE t.status = 'completed' AND t.completed_at >= %s
            GROUP BY u.id, u.full_name
            ORDER BY completed_tasks DESC
            LIMIT 5
        """, (week_ago,))
        
        top_managers = [{'name': row[0], 'completed': row[1]} for row in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        report = {
            'period': {
                'start': week_ago,
                'end': datetime.now().isoformat()
            },
            'tasks': {
                'total': tasks_stats[0],
                'completed': tasks_stats[1],
                'in_progress': tasks_stats[2],
                'pending': tasks_stats[3],
                'overdue': tasks_stats[4]
            },
            'tickets': {
                'total': tickets_stats[0],
                'resolved': tickets_stats[1],
                'in_progress': tickets_stats[2],
                'open': tickets_stats[3]
            },
            'top_managers': top_managers
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(report),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        # Отправка отчёта в Telegram
        body_data = json.loads(event.get('body', '{}'))
        send_to_telegram = body_data.get('send_to_telegram', False)
        
        if not send_to_telegram:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'send_to_telegram required'}),
                'isBase64Encoded': False
            }
        
        # Получаем данные отчёта
        week_ago = (datetime.now() - timedelta(days=7)).isoformat()
        
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE deadline < NOW() AND status != 'completed') as overdue
            FROM tasks
            WHERE created_at >= %s
        """, (week_ago,))
        
        tasks_stats = cur.fetchone()
        
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                COUNT(*) FILTER (WHERE status = 'open') as open
            FROM tickets
            WHERE created_at >= %s
        """, (week_ago,))
        
        tickets_stats = cur.fetchone()
        
        cur.execute("""
            SELECT u.full_name, COUNT(*) as completed_tasks
            FROM tasks t
            JOIN users u ON t.assigned_to = u.id
            WHERE t.status = 'completed' AND t.completed_at >= %s
            GROUP BY u.id, u.full_name
            ORDER BY completed_tasks DESC
            LIMIT 5
        """, (week_ago,))
        
        top_managers = cur.fetchall()
        
        cur.close()
        conn.close()
        
        # Формируем текст отчёта
        report_text = f"""📊 Еженедельный отчёт

📅 Период: {datetime.fromisoformat(week_ago).strftime('%d.%m.%Y')} - {datetime.now().strftime('%d.%m.%Y')}

✅ ЗАДАЧИ:
• Всего создано: {tasks_stats[0]}
• Выполнено: {tasks_stats[1]}
• В работе: {tasks_stats[2]}
• Ожидают: {tasks_stats[3]}
• Просрочено: {tasks_stats[4]}

🎫 ТИКЕТЫ:
• Всего создано: {tickets_stats[0]}
• Решено: {tickets_stats[1]}
• В работе: {tickets_stats[2]}
• Открыто: {tickets_stats[3]}

🏆 ТОП МЕНЕДЖЕРОВ:
"""
        
        for i, (name, count) in enumerate(top_managers, 1):
            report_text += f"{i}. {name} - {count} задач\n"
        
        # Отправка в Telegram
        telegram_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        
        if telegram_token:
            # Получаем telegram_id директора
            cur2 = conn.cursor()
            cur2.execute("SELECT telegram_id FROM users WHERE role = 'director' LIMIT 1")
            director = cur2.fetchone()
            cur2.close()
            
            if director and director[0]:
                import urllib.request
                import urllib.parse
                
                telegram_url = f"https://api.telegram.org/bot{telegram_token}/sendMessage"
                data = urllib.parse.urlencode({
                    'chat_id': director[0],
                    'text': report_text,
                    'parse_mode': 'HTML'
                }).encode('utf-8')
                
                try:
                    req = urllib.request.Request(telegram_url, data=data)
                    urllib.request.urlopen(req)
                except Exception as e:
                    print(f"Failed to send to Telegram: {e}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Report generated and sent', 'report': report_text}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }