import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление комментариями к задачам и историей изменений
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с request_id, function_name
    Returns: HTTP response со списком комментариев или результатом операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        task_id = query_params.get('task_id')
        data_type = query_params.get('type', 'comments')
        
        if not task_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing task_id'})
            }
        
        if data_type == 'history':
            cur.execute(
                '''SELECT * FROM task_history 
                   WHERE task_id = %s 
                   ORDER BY created_at DESC''',
                (int(task_id),)
            )
            history = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'history': [dict(h) for h in history]}, default=str)
            }
        
        cur.execute(
            '''SELECT * FROM task_comments 
               WHERE task_id = %s 
               ORDER BY created_at ASC''',
            (int(task_id),)
        )
        comments = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'comments': [dict(c) for c in comments]}, default=str)
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        data_type = body_data.get('type', 'comment')
        
        if data_type == 'history':
            task_id = body_data.get('task_id')
            changed_by = body_data.get('changed_by')
            changed_by_name = body_data.get('changed_by_name')
            old_status = body_data.get('old_status')
            new_status = body_data.get('new_status')
            comment = body_data.get('comment', '')
            
            if not all([task_id, changed_by, changed_by_name, new_status]):
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Missing required fields'})
                }
            
            cur.execute(
                '''INSERT INTO task_history (task_id, changed_by, changed_by_name, old_status, new_status, comment)
                   VALUES (%s, %s, %s, %s, %s, %s) RETURNING id''',
                (task_id, changed_by, changed_by_name, old_status, new_status, comment)
            )
            history_id = cur.fetchone()['id']
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'id': history_id, 'message': 'History record created'})
            }
        
        task_id = body_data.get('task_id')
        user_id = body_data.get('user_id')
        user_name = body_data.get('user_name')
        comment = body_data.get('comment')
        
        if not all([task_id, user_id, user_name, comment]):
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing required fields'})
            }
        
        cur.execute(
            '''INSERT INTO task_comments (task_id, user_id, user_name, comment)
               VALUES (%s, %s, %s, %s) RETURNING id, created_at''',
            (task_id, user_id, user_name, comment)
        )
        result = cur.fetchone()
        comment_id = result['id']
        created_at = result['created_at']
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'id': comment_id, 
                'created_at': str(created_at),
                'message': 'Comment created'
            }, default=str)
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
