import json
import os
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для работы с личными сообщениями руководителю
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict
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
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            sender_id = body_data.get('sender_id')
            message = body_data.get('message')
            
            if not sender_id or not message:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'sender_id and message are required'})
                }
            
            cursor.execute('''
                INSERT INTO t_p35759334_music_label_portal.messages (sender_id, message)
                VALUES (%s, %s)
                RETURNING id, sender_id, message, created_at, is_read
            ''', (sender_id, message))
            
            new_message = dict(cursor.fetchone())
            new_message['created_at'] = new_message['created_at'].isoformat()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(new_message)
            }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            user_id = params.get('user_id')
            
            if user_id:
                cursor.execute(
                    'SELECT m.id, m.sender_id, m.message, m.created_at, m.is_read FROM t_p35759334_music_label_portal.messages m WHERE m.sender_id = %s ORDER BY m.created_at DESC',
                    (user_id,)
                )
            else:
                cursor.execute(
                    'SELECT m.id, m.sender_id, m.message, m.created_at, m.is_read FROM t_p35759334_music_label_portal.messages m ORDER BY m.created_at DESC'
                )
            
            messages = []
            for row in cursor.fetchall():
                msg = dict(row)
                msg['created_at'] = msg['created_at'].isoformat()
                
                cursor.execute(
                    'SELECT full_name, role FROM users WHERE id = %s',
                    (msg['sender_id'],)
                )
                user_row = cursor.fetchone()
                if user_row:
                    msg['sender_name'] = user_row['full_name']
                    msg['sender_role'] = user_row['role']
                else:
                    msg['sender_name'] = 'Unknown'
                    msg['sender_role'] = 'unknown'
                
                messages.append(msg)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(messages)
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            message_id = body_data.get('message_id')
            is_read = body_data.get('is_read', True)
            
            if not message_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'message_id is required'})
                }
            
            cursor.execute('''
                UPDATE t_p35759334_music_label_portal.messages
                SET is_read = %s
                WHERE id = %s
                RETURNING id, is_read
            ''', (is_read, message_id))
            
            updated_message = cursor.fetchone()
            if not updated_message:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Message not found'})
                }
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(updated_message))
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cursor.close()
        conn.close()