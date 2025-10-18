import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API for managing tasks with full CRUD operations
    Args: event with httpMethod, headers, body, queryStringParameters
    Returns: HTTP response with tasks data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    
    if not user_id or not auth_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    cur.execute("SELECT id, role FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    
    if not user:
        cur.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User not found'}),
            'isBase64Encoded': False
        }
    
    user_role = user[1]
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        ticket_id = params.get('ticket_id')
        
        if ticket_id:
            cur.execute("""
                SELECT t.id, t.title, t.description, t.priority, t.status, 
                       t.created_by, t.assigned_to, t.deadline, t.ticket_id,
                       t.created_at, t.completed_at,
                       u1.full_name as creator_name, u2.full_name as assignee_name,
                       tk.title as ticket_title
                FROM tasks t
                LEFT JOIN users u1 ON t.created_by = u1.id
                LEFT JOIN users u2 ON t.assigned_to = u2.id
                LEFT JOIN tickets tk ON t.ticket_id = tk.id
                WHERE t.ticket_id = %s
                ORDER BY t.created_at DESC
            """, (ticket_id,))
        elif user_role == 'manager':
            cur.execute("""
                SELECT t.id, t.title, t.description, t.priority, t.status, 
                       t.created_by, t.assigned_to, t.deadline, t.ticket_id,
                       t.created_at, t.completed_at,
                       u1.full_name as creator_name, u2.full_name as assignee_name,
                       tk.title as ticket_title
                FROM tasks t
                LEFT JOIN users u1 ON t.created_by = u1.id
                LEFT JOIN users u2 ON t.assigned_to = u2.id
                LEFT JOIN tickets tk ON t.ticket_id = tk.id
                WHERE t.assigned_to = %s
                ORDER BY 
                    CASE WHEN t.status = 'completed' THEN 2 ELSE 1 END,
                    t.deadline ASC NULLS LAST
            """, (user_id,))
        else:
            cur.execute("""
                SELECT t.id, t.title, t.description, t.priority, t.status, 
                       t.created_by, t.assigned_to, t.deadline, t.ticket_id,
                       t.created_at, t.completed_at,
                       u1.full_name as creator_name, u2.full_name as assignee_name,
                       tk.title as ticket_title
                FROM tasks t
                LEFT JOIN users u1 ON t.created_by = u1.id
                LEFT JOIN users u2 ON t.assigned_to = u2.id
                LEFT JOIN tickets tk ON t.ticket_id = tk.id
                ORDER BY t.created_at DESC
                LIMIT 100
            """)
        
        tasks = cur.fetchall()
        
        tasks_list = []
        for task in tasks:
            tasks_list.append({
                'id': task[0],
                'title': task[1],
                'description': task[2],
                'priority': task[3],
                'status': task[4],
                'created_by': task[5],
                'assigned_to': task[6],
                'deadline': task[7].isoformat() if task[7] else None,
                'ticket_id': task[8],
                'created_at': task[9].isoformat() if task[9] else None,
                'completed_at': task[10].isoformat() if task[10] else None,
                'creator_name': task[11],
                'assignee_name': task[12],
                'ticket_title': task[13]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'tasks': tasks_list}),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        if user_role != 'director':
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Only directors can create tasks'}),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        
        title = body_data.get('title')
        description = body_data.get('description', '')
        priority = body_data.get('priority', 'medium')
        assigned_to = body_data.get('assigned_to')
        deadline = body_data.get('deadline')
        ticket_id = body_data.get('ticket_id')
        
        if not title:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Title is required'}),
                'isBase64Encoded': False
            }
        
        # assigned_to и deadline обязательны в текущей структуре БД
        if not assigned_to:
            assigned_to = user_id  # Назначаем создателю по умолчанию
        
        if not deadline:
            # Устанавливаем дедлайн через 7 дней если не указан
            from datetime import datetime, timedelta
            deadline = (datetime.now() + timedelta(days=7)).isoformat()
        
        cur.execute("""
            INSERT INTO tasks (title, description, priority, status, created_by, assigned_to, deadline, ticket_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (title, description, priority, 'in_progress', user_id, assigned_to, deadline, ticket_id))
        
        task_id = cur.fetchone()[0]
        
        if ticket_id:
            cur.execute("UPDATE tickets SET status = 'in_progress' WHERE id = %s AND status = 'open'", (ticket_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'task_id': task_id}),
            'isBase64Encoded': False
        }
    
    elif method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        task_id = body_data.get('task_id')
        status = body_data.get('status')
        
        if not task_id or not status:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'task_id and status are required'}),
                'isBase64Encoded': False
            }
        
        if status == 'completed':
            cur.execute("UPDATE tasks SET status = %s, completed_at = NOW() WHERE id = %s RETURNING ticket_id", (status, task_id))
        else:
            cur.execute("UPDATE tasks SET status = %s WHERE id = %s RETURNING ticket_id", (status, task_id))
        
        result = cur.fetchone()
        ticket_id = result[0] if result else None
        
        if ticket_id and status == 'completed':
            cur.execute("SELECT COUNT(*) FROM tasks WHERE ticket_id = %s AND status != 'completed'", (ticket_id,))
            remaining_tasks = cur.fetchone()[0]
            
            if remaining_tasks == 0:
                cur.execute("UPDATE tickets SET status = 'closed' WHERE id = %s", (ticket_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    
    elif method == 'DELETE':
        if user_role not in ['director']:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Only directors can delete tasks'}),
                'isBase64Encoded': False
            }
        
        params = event.get('queryStringParameters') or {}
        task_id = params.get('task_id')
        
        if not task_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'task_id is required'}),
                'isBase64Encoded': False
            }
        
        cur.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }