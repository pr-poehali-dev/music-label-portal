import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage artist tracks - upload, list, review
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id
    Returns: HTTP response with track data
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
    
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    schema = 't_p35759334_music_label_portal'
    
    conn = psycopg2.connect(dsn)
    conn.set_session(autocommit=True)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            artist_id = params.get('artist_id')
            status_filter = params.get('status')
            
            cur.execute(f"SELECT role FROM {schema}.users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'User not found'})
                }
            
            query = f"""
                SELECT 
                    t.*,
                    u.full_name as artist_name,
                    r.full_name as reviewer_name
                FROM {schema}.artist_tracks t
                JOIN {schema}.users u ON t.artist_id = u.id
                LEFT JOIN {schema}.users r ON t.reviewed_by = r.id
                WHERE 1=1
            """
            params_list = []
            
            if user['role'] == 'artist':
                query += " AND t.artist_id = %s"
                params_list.append(user_id)
            elif artist_id:
                query += " AND t.artist_id = %s"
                params_list.append(artist_id)
            
            if status_filter:
                query += " AND t.status = %s"
                params_list.append(status_filter)
            
            query += " ORDER BY t.uploaded_at DESC"
            
            cur.execute(query, params_list)
            tracks = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps([dict(t) for t in tracks], default=str)
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            cur.execute(f"SELECT role FROM {schema}.users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            if not user or user['role'] != 'artist':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Only artists can upload tracks'})
                }
            
            title = body_data.get('title')
            file_url = body_data.get('file_url')
            file_name = body_data.get('file_name')
            file_size = body_data.get('file_size')
            description = body_data.get('description', '')
            genre = body_data.get('genre', '')
            duration = body_data.get('duration')
            
            if not all([title, file_url, file_name, file_size]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Missing required fields'})
                }
            
            cur.execute(f"""
                INSERT INTO {schema}.artist_tracks 
                (artist_id, title, file_url, file_name, file_size, description, genre, duration, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                RETURNING id, uploaded_at
            """, (user_id, title, file_url, file_name, file_size, description, genre, duration))
            
            result = cur.fetchone()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({
                    'id': result['id'],
                    'uploaded_at': str(result['uploaded_at']),
                    'message': 'Track uploaded successfully'
                })
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            track_id = body_data.get('track_id')
            action = body_data.get('action')
            
            cur.execute(f"SELECT role FROM {schema}.users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            if not user or user['role'] not in ['director', 'manager']:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Only managers can review tracks'})
                }
            
            if action == 'approve':
                cur.execute(f"""
                    UPDATE {schema}.artist_tracks
                    SET status = 'approved', reviewed_by = %s, reviewed_at = CURRENT_TIMESTAMP,
                        review_comment = %s
                    WHERE id = %s
                """, (user_id, body_data.get('comment', ''), track_id))
            elif action == 'reject':
                cur.execute(f"""
                    UPDATE {schema}.artist_tracks
                    SET status = 'rejected', reviewed_by = %s, reviewed_at = CURRENT_TIMESTAMP,
                        review_comment = %s
                    WHERE id = %s
                """, (user_id, body_data.get('comment', ''), track_id))
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Invalid action'})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'message': f'Track {action}d successfully'})
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
    finally:
        cur.close()
        conn.close()
