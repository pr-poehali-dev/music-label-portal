import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage user notifications
    Args: event with httpMethod (GET/PUT), headers with X-User-Id
    Returns: List of notifications or update confirmation
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        user_id_header = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
        if not user_id_header:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'User ID required'})
            }
        
        user_id = int(user_id_header)
        dsn = os.environ.get('DATABASE_URL')
        schema = 't_p35759334_music_label_portal'
        
        with psycopg2.connect(dsn) as conn:
            conn.autocommit = True
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                
                if method == 'GET':
                    cur.execute(f"""
                        SELECT id, title, message, type, read, 
                               related_entity_type, related_entity_id, created_at
                        FROM {schema}.notifications
                        WHERE user_id = %s
                        ORDER BY created_at DESC
                        LIMIT 50
                    """, (user_id,))
                    
                    notifications = cur.fetchall()
                    
                    cur.execute(f"""
                        SELECT COUNT(*) as count FROM {schema}.notifications
                        WHERE user_id = %s AND read = FALSE
                    """, (user_id,))
                    
                    unread_count = cur.fetchone()['count']
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'notifications': [dict(n) for n in notifications],
                            'unread_count': unread_count
                        }, default=str)
                    }
                
                elif method == 'PUT':
                    body_data = json.loads(event.get('body', '{}'))
                    notification_id = body_data.get('notification_id')
                    mark_all_read = body_data.get('mark_all_read', False)
                    
                    if mark_all_read:
                        cur.execute(f"""
                            UPDATE {schema}.notifications
                            SET read = TRUE
                            WHERE user_id = %s AND read = FALSE
                        """, (user_id,))
                    elif notification_id:
                        cur.execute(f"""
                            UPDATE {schema}.notifications
                            SET read = TRUE
                            WHERE id = %s AND user_id = %s
                        """, (notification_id, user_id))
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'message': 'Notifications updated'})
                    }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }