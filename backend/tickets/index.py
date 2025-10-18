import json
import os
from typing import Dict, Any

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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
        
        title = body_data.get('title')
        description = body_data.get('description')
        priority = body_data.get('priority', 'medium')
        created_by = body_data.get('created_by')
        
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
            '''INSERT INTO tickets (title, description, priority, created_by, status)
               VALUES (%s, %s, %s, %s, 'open') RETURNING id''',
            (title, description, priority, created_by)
        )
        ticket_id = cur.fetchone()['id']
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'id': ticket_id, 'message': 'Ticket created'})
        }
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
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
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }