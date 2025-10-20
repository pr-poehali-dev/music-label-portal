import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime, timedelta

def escape_sql(value):
    """Escape single quotes for SQL"""
    if value is None:
        return 'NULL'
    return str(value).replace("'", "''")

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
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized - X-User-Id required'}),
            'isBase64Encoded': False
        }
    
    conn = None
    cur = None
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute(f"SELECT id, role FROM users WHERE id = {user_id}")
        user = cur.fetchone()
        
        if not user:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'}),
                'isBase64Encoded': False
            }
        
        user_role = user[1]
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            
            # Analytics endpoint
            if params.get('analytics') == 'true':
                query = """
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
                        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
                        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority
                    FROM tasks
                """
                cur.execute(query)
                stats = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'total': stats[0] or 0,
                        'by_status': {
                            'pending': stats[1] or 0,
                            'in_progress': stats[2] or 0,
                            'completed': stats[3] or 0
                        },
                        'by_priority': {
                            'high': stats[4] or 0,
                            'medium': stats[5] or 0,
                            'low': stats[6] or 0
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            # Regular task listing
            ticket_id = params.get('ticket_id')
            show_deleted = params.get('show_deleted') == 'true'
            
            if ticket_id:
                query = f"""
                    SELECT t.id, t.title, t.description, t.priority, t.status, 
                           t.created_by, t.assigned_to, t.deadline, t.ticket_id,
                           t.created_at, t.completed_at,
                           u1.full_name as creator_name, u2.full_name as assignee_name,
                           tk.title as ticket_title
                    FROM tasks t
                    LEFT JOIN users u1 ON t.created_by = u1.id
                    LEFT JOIN users u2 ON t.assigned_to = u2.id
                    LEFT JOIN tickets tk ON t.ticket_id = tk.id
                    WHERE t.ticket_id = {ticket_id} AND t.archived_at IS NULL
                    ORDER BY t.created_at DESC
                """
            elif user_role == 'manager':
                query = f"""
                    SELECT t.id, t.title, t.description, t.priority, t.status, 
                           t.created_by, t.assigned_to, t.deadline, t.ticket_id,
                           t.created_at, t.completed_at,
                           u1.full_name as creator_name, u2.full_name as assignee_name,
                           tk.title as ticket_title
                    FROM tasks t
                    LEFT JOIN users u1 ON t.created_by = u1.id
                    LEFT JOIN users u2 ON t.assigned_to = u2.id
                    LEFT JOIN tickets tk ON t.ticket_id = tk.id
                    WHERE t.assigned_to = {user_id} AND t.archived_at IS NULL
                    ORDER BY 
                        CASE WHEN t.status = 'completed' THEN 2 ELSE 1 END,
                        t.deadline ASC NULLS LAST
                """
            else:
                query = f"""
                    SELECT t.id, t.title, t.description, t.priority, t.status, 
                           t.created_by, t.assigned_to, t.deadline, t.ticket_id,
                           t.created_at, t.completed_at, t.archived_at,
                           u1.full_name as creator_name, u2.full_name as assignee_name,
                           tk.title as ticket_title
                    FROM tasks t
                    LEFT JOIN users u1 ON t.created_by = u1.id
                    LEFT JOIN users u2 ON t.assigned_to = u2.id
                    LEFT JOIN tickets tk ON t.ticket_id = tk.id
                    ORDER BY t.created_at DESC
                    LIMIT 100
                """
            
            print(f"[DEBUG] Executing query for user_id={user_id}, role={user_role}")
            print(f"[DEBUG] Query: {query}")
            cur.execute(query)
            tasks = cur.fetchall()
            print(f"[DEBUG] Found {len(tasks)} tasks")
            
            tasks_list = []
            for task in tasks:
                # Safe datetime conversion
                def safe_isoformat(dt):
                    if not dt:
                        return None
                    try:
                        return dt.isoformat()
                    except (ValueError, OverflowError):
                        return None
                
                task_dict = {
                    'id': task[0],
                    'title': task[1],
                    'description': task[2],
                    'priority': task[3],
                    'status': task[4],
                    'created_by': task[5],
                    'assigned_to': task[6],
                    'deadline': safe_isoformat(task[7]),
                    'ticket_id': task[8],
                    'created_at': safe_isoformat(task[9]),
                    'completed_at': safe_isoformat(task[10]),
                }
                
                # Add additional fields based on query structure
                if len(task) > 11:
                    # Director query: archived_at, creator_name, assignee_name, ticket_title
                    if len(task) > 14:
                        archived_val = task[11]
                        task_dict['archived_at'] = archived_val if isinstance(archived_val, str) else safe_isoformat(archived_val)
                        task_dict['creator_name'] = task[12]
                        task_dict['assignee_name'] = task[13]
                        task_dict['ticket_title'] = task[14]
                    # Manager/ticket query: creator_name, assignee_name, ticket_title
                    else:
                        task_dict['archived_at'] = None
                        task_dict['creator_name'] = task[11]
                        task_dict['assignee_name'] = task[12]
                        task_dict['ticket_title'] = task[13] if len(task) > 13 else None
                
                tasks_list.append(task_dict)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'tasks': tasks_list}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            if user_role != 'director':
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
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Title is required'}),
                    'isBase64Encoded': False
                }
            
            if not assigned_to:
                assigned_to = user_id
            
            if not deadline:
                deadline = (datetime.now() + timedelta(days=7)).isoformat()
            
            title_escaped = escape_sql(title)
            desc_escaped = escape_sql(description)
            ticket_id_val = ticket_id if ticket_id else 'NULL'
            
            status = body_data.get('status', 'in_progress')
            
            query = f"""
                INSERT INTO tasks (title, description, priority, status, created_by, assigned_to, deadline, ticket_id, created_at)
                VALUES ('{title_escaped}', '{desc_escaped}', '{priority}', '{status}', {user_id}, {assigned_to}, '{deadline}', {ticket_id_val}, NOW())
                RETURNING id
            """
            cur.execute(query)
            task_id = cur.fetchone()[0]
            
            if ticket_id:
                cur.execute(f"UPDATE tickets SET status = 'in_progress' WHERE id = {ticket_id} AND status = 'open'")
            
            conn.commit()
            
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
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Task ID and status required'}),
                    'isBase64Encoded': False
                }
            
            completed_at = "NOW()" if status == 'completed' else "NULL"
            
            query = f"""
                UPDATE tasks 
                SET status = '{status}', completed_at = {completed_at}
                WHERE id = {task_id}
            """
            cur.execute(query)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            if user_role != 'director':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Only directors can delete tasks'}),
                    'isBase64Encoded': False
                }
            
            params = event.get('queryStringParameters') or {}
            task_id = params.get('task_id')
            
            if not task_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Task ID required'}),
                    'isBase64Encoded': False
                }
            
            query = f"UPDATE tasks SET archived_at = NOW() WHERE id = {task_id}"
            print(f"[DEBUG] Archiving task {task_id}")
            cur.execute(query)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()