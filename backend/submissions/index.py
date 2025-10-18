import json
import os
from datetime import datetime
from typing import Any, Dict
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление заявками на прослушивание треков
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with attributes: request_id, function_name
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
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            status_filter = params.get('status', 'all')
            
            if status_filter == 'all':
                cur.execute('''
                    SELECT s.*, u.full_name as reviewed_by_name 
                    FROM submissions s
                    LEFT JOIN users u ON s.reviewed_by = u.id
                    ORDER BY s.created_at DESC
                ''')
            else:
                cur.execute('''
                    SELECT s.*, u.full_name as reviewed_by_name 
                    FROM submissions s
                    LEFT JOIN users u ON s.reviewed_by = u.id
                    WHERE s.status = %s
                    ORDER BY s.created_at DESC
                ''', (status_filter,))
            
            submissions = cur.fetchall()
            
            result = []
            for sub in submissions:
                result.append({
                    'id': sub['id'],
                    'artist_name': sub['artist_name'],
                    'track_link': sub['track_link'],
                    'contact_link': sub['contact_link'],
                    'message': sub['message'],
                    'status': sub['status'],
                    'created_at': sub['created_at'].isoformat() if sub['created_at'] else None,
                    'reviewed_by': sub['reviewed_by'],
                    'reviewed_by_name': sub['reviewed_by_name'],
                    'reviewed_at': sub['reviewed_at'].isoformat() if sub['reviewed_at'] else None,
                    'admin_comment': sub['admin_comment']
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'submissions': result}),
                'isBase64Encoded': False
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            artist_name = body_data.get('artist_name', '').strip()
            track_link = body_data.get('track_link', '').strip()
            contact_link = body_data.get('contact_link', '').strip()
            message = body_data.get('message', '').strip()
            
            if not artist_name or not track_link:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Имя артиста и ссылка на трек обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                INSERT INTO submissions (artist_name, track_link, contact_link, message, status)
                VALUES (%s, %s, %s, %s, 'new')
                RETURNING id
            ''', (artist_name, track_link, contact_link or None, message or None))
            
            submission_id = cur.fetchone()['id']
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': submission_id, 'message': 'Заявка отправлена'}),
                'isBase64Encoded': False
            }
        
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            submission_id = body_data.get('id')
            status = body_data.get('status')
            reviewed_by = body_data.get('reviewed_by')
            admin_comment = body_data.get('admin_comment')
            
            if not submission_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID заявки обязателен'}),
                    'isBase64Encoded': False
                }
            
            update_fields = []
            params = []
            
            if status:
                update_fields.append('status = %s')
                params.append(status)
            
            if reviewed_by:
                update_fields.append('reviewed_by = %s')
                update_fields.append('reviewed_at = %s')
                params.append(reviewed_by)
                params.append(datetime.now())
            
            if admin_comment is not None:
                update_fields.append('admin_comment = %s')
                params.append(admin_comment)
            
            if update_fields:
                params.append(submission_id)
                query = f"UPDATE submissions SET {', '.join(update_fields)} WHERE id = %s"
                cur.execute(query, params)
                conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Заявка обновлена'}),
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
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
