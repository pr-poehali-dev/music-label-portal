import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Create system notification for users
    Args: event with POST body containing notification data and optional user_ids
    Returns: Created notification confirmation
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        title = body_data.get('title')
        message = body_data.get('message')
        notification_type = body_data.get('type', 'info')
        related_entity_type = body_data.get('related_entity_type')
        related_entity_id = body_data.get('related_entity_id')
        user_ids = body_data.get('user_ids', [])  # Optional: specific user IDs
        notify_directors = body_data.get('notify_directors', True)  # Default: notify directors
        
        if not title or not message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Title and message are required'})
            }
        
        dsn = os.environ.get('DATABASE_URL')
        schema = 't_p35759334_music_label_portal'
        
        with psycopg2.connect(dsn) as conn:
            conn.autocommit = True
            with conn.cursor() as cur:
                recipient_ids = set(user_ids) if user_ids else set()
                
                # Add directors if requested
                if notify_directors:
                    cur.execute(f"""
                        SELECT id FROM {schema}.users
                        WHERE role = 'director'
                    """)
                    directors = cur.fetchall()
                    recipient_ids.update(d[0] for d in directors)
                
                if not recipient_ids:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'No recipients found'})
                    }
                
                # Create notification for each recipient
                for user_id in recipient_ids:
                    cur.execute(f"""
                        INSERT INTO {schema}.notifications 
                        (user_id, title, message, type, related_entity_type, related_entity_id)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (user_id, title, message, notification_type, related_entity_type, related_entity_id))
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'message': 'Notifications created',
                        'count': len(recipient_ids)
                    })
                }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }