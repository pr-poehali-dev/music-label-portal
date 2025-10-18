import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage music releases - create, list, review releases and tracks
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id
    Returns: HTTP response with release data
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
        cur.execute(f"SELECT role FROM {schema}.users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        
        if not user:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'User not found'})
            }
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            release_id = params.get('release_id')
            
            if release_id:
                cur.execute(f"""
                    SELECT 
                        r.*,
                        u.full_name as artist_name,
                        rev.full_name as reviewer_name
                    FROM {schema}.releases r
                    JOIN {schema}.users u ON r.artist_id = u.id
                    LEFT JOIN {schema}.users rev ON r.reviewed_by = rev.id
                    WHERE r.id = %s
                """, (release_id,))
                release = cur.fetchone()
                
                if not release:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Release not found'})
                    }
                
                cur.execute(f"""
                    SELECT * FROM {schema}.release_tracks
                    WHERE release_id = %s
                    ORDER BY track_number
                """, (release_id,))
                tracks = cur.fetchall()
                
                result = dict(release)
                result['tracks'] = [dict(t) for t in tracks]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps(result, default=str)
                }
            
            query = f"""
                SELECT 
                    r.*,
                    u.full_name as artist_name,
                    rev.full_name as reviewer_name,
                    COUNT(t.id) as tracks_count
                FROM {schema}.releases r
                JOIN {schema}.users u ON r.artist_id = u.id
                LEFT JOIN {schema}.users rev ON r.reviewed_by = rev.id
                LEFT JOIN {schema}.release_tracks t ON r.id = t.release_id
                WHERE 1=1
            """
            params_list = []
            
            if user['role'] == 'artist':
                query += " AND r.artist_id = %s"
                params_list.append(user_id)
            
            status_filter = params.get('status')
            if status_filter:
                query += " AND r.status = %s"
                params_list.append(status_filter)
            
            query += " GROUP BY r.id, u.full_name, rev.full_name ORDER BY r.created_at DESC"
            
            cur.execute(query, params_list)
            releases = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps([dict(r) for r in releases], default=str)
            }
        
        elif method == 'POST':
            if user['role'] != 'artist':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Only artists can create releases'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            
            cur.execute(f"""
                INSERT INTO {schema}.releases 
                (artist_id, title, release_name, cover_url, release_date, preorder_date, 
                 sales_start_date, genre, copyright, price_category, title_language, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                RETURNING id, created_at
            """, (
                user_id,
                body_data.get('release_name', 'Untitled'),
                body_data.get('release_name'),
                body_data.get('cover_url'),
                body_data.get('release_date'),
                body_data.get('preorder_date'),
                body_data.get('sales_start_date'),
                body_data.get('genre'),
                body_data.get('copyright'),
                body_data.get('price_category'),
                body_data.get('title_language')
            ))
            
            release = cur.fetchone()
            release_id = release['id']
            
            tracks = body_data.get('tracks', [])
            for track in tracks:
                cur.execute(f"""
                    INSERT INTO {schema}.release_tracks
                    (release_id, artist_id, track_number, title, file_url, file_name, file_size,
                     composer, author_lyrics, language_audio, explicit_content, lyrics_text, 
                     tiktok_preview_start, genre, description)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    release_id,
                    user_id,
                    track.get('track_number'),
                    track.get('title'),
                    track.get('file_url'),
                    track.get('file_name'),
                    track.get('file_size'),
                    track.get('composer'),
                    track.get('author_lyrics'),
                    track.get('language_audio'),
                    track.get('explicit_content', False),
                    track.get('lyrics_text'),
                    track.get('tiktok_preview_start'),
                    track.get('genre'),
                    track.get('description')
                ))
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({
                    'id': release_id,
                    'created_at': str(release['created_at']),
                    'message': 'Release created successfully'
                })
            }
        
        elif method == 'PUT':
            if user['role'] not in ['director', 'manager']:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Only managers can review releases'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            release_id = body_data.get('release_id')
            action = body_data.get('action')
            
            if action == 'approve':
                cur.execute(f"""
                    UPDATE {schema}.releases
                    SET status = 'approved', reviewed_by = %s, reviewed_at = CURRENT_TIMESTAMP,
                        review_comment = %s
                    WHERE id = %s
                """, (user_id, body_data.get('comment', ''), release_id))
            elif action == 'reject':
                cur.execute(f"""
                    UPDATE {schema}.releases
                    SET status = 'rejected', reviewed_by = %s, reviewed_at = CURRENT_TIMESTAMP,
                        review_comment = %s
                    WHERE id = %s
                """, (user_id, body_data.get('comment', ''), release_id))
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
                'body': json.dumps({'message': f'Release {action}d successfully'})
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