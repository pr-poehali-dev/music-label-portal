import json
import os
from typing import Dict, Any
from urllib import request, parse

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление тикетами техподдержки лейбла
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с request_id, function_name
    Returns: HTTP response со списком тикетов или результатом операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    import psycopg2
    import psycopg2.extras
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    if method == 'GET':
        query_params = event.get('queryStringParameters') or {}
        status_filter = query_params.get('status')
        user_id = query_params.get('user_id')
        task_type = query_params.get('type', 'tickets')
        
        if task_type == 'tasks':
            query = '''
                SELECT t.*, 
                       c.full_name as created_by_name,
                       m.full_name as assigned_name
                FROM tasks t
                JOIN users c ON t.created_by = c.id
                JOIN users m ON t.assigned_to = m.id
                WHERE 1=1
            '''
            params = []
            
            if status_filter:
                query += ' AND t.status = %s'
                params.append(status_filter)
            
            if user_id:
                query += ' AND (t.created_by = %s OR t.assigned_to = %s)'
                params.append(int(user_id))
                params.append(int(user_id))
            
            query += ' ORDER BY t.created_at DESC'
            
            cur.execute(query, params)
            tasks = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'tasks': [dict(t) for t in tasks]}, default=str)
            }
        
        query = '''
            SELECT t.*, 
                   u.full_name as creator_name, 
                   u.username as creator_username,
                   m.full_name as assigned_name,
                   m.username as assigned_username
            FROM tickets t
            JOIN users u ON t.created_by = u.id
            LEFT JOIN users m ON t.assigned_to = m.id
            WHERE 1=1
        '''
        params = []
        
        if status_filter:
            query += ' AND t.status = %s'
            params.append(status_filter)
        
        if user_id:
            query += ' AND (t.created_by = %s OR t.assigned_to = %s)'
            params.append(int(user_id))
            params.append(int(user_id))
        
        query += ' ORDER BY t.created_at DESC'
        
        cur.execute(query, params)
        tickets = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'tickets': [dict(t) for t in tickets]}, default=str)
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        
        task_type = body_data.get('type', 'ticket')
        
        if task_type == 'task':
            title = body_data.get('title')
            description = body_data.get('description', '')
            priority = body_data.get('priority', 'medium')
            created_by = body_data.get('created_by')
            assigned_to = body_data.get('assigned_to')
            deadline = body_data.get('deadline')
            attachment_url = body_data.get('attachment_url')
            attachment_name = body_data.get('attachment_name')
            attachment_size = body_data.get('attachment_size')
            
            if not all([title, created_by, assigned_to, deadline]):
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Missing required fields'})
                }
            
            cur.execute(
                '''INSERT INTO tasks (title, description, priority, created_by, assigned_to, deadline, status, is_read, 
                                     attachment_url, attachment_name, attachment_size)
                   VALUES (%s, %s, %s, %s, %s, %s, 'pending', false, %s, %s, %s) RETURNING id''',
                (title, description, priority, created_by, assigned_to, deadline, 
                 attachment_url, attachment_name, attachment_size)
            )
            task_id = cur.fetchone()['id']
            
            cur.execute(
                '''SELECT t.*, 
                          c.full_name as created_by_name,
                          m.full_name as assigned_name,
                          m.telegram_chat_id
                   FROM tasks t
                   JOIN users c ON t.created_by = c.id
                   JOIN users m ON t.assigned_to = m.id
                   WHERE t.id = %s''',
                (task_id,)
            )
            task_data = dict(cur.fetchone())
            
            conn.commit()
            cur.close()
            conn.close()
            
            send_task_notification(task_data)
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'id': task_id, 'message': 'Task created'})
            }
        
        title = body_data.get('title')
        description = body_data.get('description')
        priority = body_data.get('priority', 'medium')
        created_by = body_data.get('created_by')
        attachment_url = body_data.get('attachment_url')
        attachment_name = body_data.get('attachment_name')
        attachment_size = body_data.get('attachment_size')
        
        if not all([title, description, created_by]):
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing required fields'})
            }
        
        cur.execute(
            '''INSERT INTO tickets (title, description, priority, created_by, status, 
                                   attachment_url, attachment_name, attachment_size)
               VALUES (%s, %s, %s, %s, 'open', %s, %s, %s) RETURNING id''',
            (title, description, priority, created_by, attachment_url, attachment_name, attachment_size)
        )
        ticket_id = cur.fetchone()['id']
        
        cur.execute(
            '''SELECT t.*, u.full_name as creator_name
               FROM tickets t
               JOIN users u ON t.created_by = u.id
               WHERE t.id = %s''',
            (ticket_id,)
        )
        ticket_data = dict(cur.fetchone())
        
        conn.commit()
        cur.close()
        conn.close()
        
        send_telegram_notification(ticket_data)
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'id': ticket_id, 'message': 'Ticket created'})
        }
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        task_type = body_data.get('type', 'ticket')
        
        if task_type == 'task':
            task_id = body_data.get('id')
            status = body_data.get('status')
            is_read = body_data.get('is_read')
            completed_at = body_data.get('completed_at')
            
            if not task_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Missing task id'})
                }
            
            updates = []
            params = []
            
            if status:
                updates.append('status = %s')
                params.append(status)
                if status == 'completed':
                    updates.append('completed_at = CURRENT_TIMESTAMP')
            
            if is_read is not None:
                updates.append('is_read = %s')
                params.append(is_read)
            
            if updates:
                params.append(task_id)
                query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = %s"
                cur.execute(query, params)
                conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'message': 'Task updated'})
            }
        
        ticket_id = body_data.get('id')
        status = body_data.get('status')
        assigned_to = body_data.get('assigned_to')
        deadline = body_data.get('deadline')
        
        if not ticket_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing ticket id'})
            }
        
        updates = []
        params = []
        
        if status:
            updates.append('status = %s')
            params.append(status)
        
        if assigned_to is not None:
            updates.append('assigned_to = %s')
            params.append(assigned_to if assigned_to else None)
        
        if deadline is not None:
            updates.append('deadline = %s')
            params.append(deadline if deadline else None)
        
        if updates:
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(ticket_id)
            
            query = f"UPDATE tickets SET {', '.join(updates)} WHERE id = %s"
            cur.execute(query, params)
            conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'message': 'Ticket updated'})
        }
    
    if method == 'DELETE':
        body_data = json.loads(event.get('body', '{}'))
        ticket_id = body_data.get('id')
        
        if not ticket_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing ticket id'})
            }
        
        cur.execute('DELETE FROM tickets WHERE id = %s', (ticket_id,))
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'message': 'Ticket deleted'})
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }

def send_telegram_notification(ticket: Dict[str, Any]):
    try:
        telegram_bot_url = 'https://functions.poehali.dev/ae7c32d8-5b08-4870-9606-e750de3c31a9'
        data = json.dumps({
            'action': 'notify',
            'ticket': ticket
        }).encode('utf-8')
        
        req = request.Request(
            telegram_bot_url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        request.urlopen(req, timeout=5)
    except Exception:
        pass

def send_task_notification(task: Dict[str, Any]):
    try:
        telegram_bot_url = 'https://functions.poehali.dev/ae7c32d8-5b08-4870-9606-e750de3c31a9'
        
        message = f"""🎯 Новая задача от руководителя!

📋 {task['title']}
{task['description'] if task.get('description') else ''}

⏰ Дедлайн: {task['deadline']}
⚡️ Приоритет: {task['priority']}

Проверьте задачу в личном кабинете!"""
        
        data = json.dumps({
            'action': 'send_message',
            'chat_id': task.get('telegram_chat_id'),
            'message': message
        }).encode('utf-8')
        
        req = request.Request(
            telegram_bot_url,
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        request.urlopen(req, timeout=5)
    except Exception:
        pass