'''
Business: Получение количества непрочитанных тикетов, задач и сообщений для пользователя
Args: event с httpMethod, headers; context с request_id
Returns: HTTP response с количеством непрочитанных элементов
'''

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    
    if method == 'GET':
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        schema = 't_p35759334_music_label_portal'
        
        # Получаем роль пользователя
        cur.execute(f"SELECT role FROM {schema}.users WHERE id = %s", (user_id,))
        user_role_row = cur.fetchone()
        
        if not user_role_row:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'}),
                'isBase64Encoded': False
            }
        
        user_role = user_role_row[0]
        
        counts = {
            'tickets': 0,
            'tasks': 0,
            'messages': 0,
            'submissions': 0
        }
        
        if user_role == 'director':
            # Непрочитанные тикеты (новые открытые)
            cur.execute(f"SELECT COUNT(*) FROM {schema}.tickets WHERE status = 'open'")
            counts['tickets'] = cur.fetchone()[0]
            
            # Непрочитанные задачи (новые pending)
            cur.execute(f"SELECT COUNT(*) FROM {schema}.tasks WHERE status = 'pending'")
            counts['tasks'] = cur.fetchone()[0]
            
            # Непрочитанные заявки артистов
            cur.execute(f"SELECT COUNT(*) FROM {schema}.submissions WHERE status = 'pending'")
            counts['submissions'] = cur.fetchone()[0]
            
        elif user_role == 'manager':
            # Тикеты назначенные менеджеру
            cur.execute(f"SELECT COUNT(*) FROM {schema}.tickets WHERE assigned_to = %s AND status != 'resolved' AND status != 'closed'", (user_id,))
            counts['tickets'] = cur.fetchone()[0]
            
            # Задачи назначенные менеджеру (непрочитанные)
            cur.execute(f"SELECT COUNT(*) FROM {schema}.tasks WHERE assigned_to = %s AND is_read = FALSE", (user_id,))
            counts['tasks'] = cur.fetchone()[0]
            
        elif user_role == 'artist':
            # Тикеты созданные артистом (ответы)
            cur.execute(f"SELECT COUNT(*) FROM {schema}.tickets WHERE created_by = %s AND status != 'open'", (user_id,))
            counts['tickets'] = cur.fetchone()[0]
        
        # Непрочитанные сообщения (для всех)
        try:
            cur.execute(f"""
                SELECT COUNT(DISTINCT sender_id) 
                FROM {schema}.messages 
                WHERE receiver_id = %s AND is_read = FALSE
            """, (user_id,))
            counts['messages'] = cur.fetchone()[0]
        except:
            counts['messages'] = 0
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(counts),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }