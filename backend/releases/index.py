import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def sql_escape(value):
    '''Escape value for SQL simple query'''
    if value is None or value == '':
        return 'NULL'
    if isinstance(value, bool):
        return 'TRUE' if value else 'FALSE'
    if isinstance(value, (int, float)):
        return str(value)
    # Escape single quotes
    return f"'{str(value).replace(chr(39), chr(39)+chr(39))}'"

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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Database configuration error'})
        }
    
    schema = 't_p35759334_music_label_portal'
    
    try:
        conn = psycopg2.connect(dsn)
        conn.set_session(autocommit=True)
        cur = conn.cursor(cursor_factory=RealDictCursor)
    except psycopg2.Error as db_error:
        print(f"[ERROR] Database connection failed: {db_error}")
        return {
            'statusCode': 503,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Database unavailable. Please try again later.'})
        }
    
    try:
        cur.execute(f"SELECT role FROM {schema}.users WHERE id = '{user_id}'")
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
                        r.artist_id as user_id,
                        u.full_name as artist_name,
                        r.reviewed_by as reviewer_id,
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
                    r.id, r.release_name, r.cover_url, r.release_date, r.preorder_date,
                    r.sales_start_date, r.genre, r.copyright, r.status, r.created_at,
                    r.review_comment, r.artist_id as user_id,
                    u.full_name as artist_name,
                    r.reviewed_by as reviewer_id,
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
            
            query += " GROUP BY r.id, u.full_name, rev.full_name ORDER BY r.created_at DESC LIMIT 100"
            
            cur.execute(query, params_list)
            releases = cur.fetchall()
            
            # Логируем порядок релизов
            print(f"[GET /releases] Returning {len(releases)} releases in order:")
            for r in releases[:5]:  # Первые 5
                print(f"  ID={r['id']} name='{r['release_name']}' created_at={r['created_at']}")
            
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
            
            try:
                body_data = json.loads(event.get('body', '{}'))
            except Exception as e:
                print(f"Failed to parse body: {e}")
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': f'Invalid JSON: {str(e)}'})
                }
            
            print(f"[POST] Creating release for user {user_id}")
            print(f"[POST] Body data: {json.dumps(body_data, default=str)}")
            
            genre = body_data.get('genre')
            if genre == '' or genre == '0':
                genre = None
            
            try:
                # Use simple query protocol
                release_name = sql_escape(body_data.get('release_name', 'Untitled'))
                cover_url = sql_escape(body_data.get('cover_url'))
                release_date = sql_escape(body_data.get('release_date'))
                preorder_date = sql_escape(body_data.get('preorder_date'))
                sales_start = sql_escape(body_data.get('sales_start_date'))
                genre_val = sql_escape(genre)
                copyright_val = sql_escape(body_data.get('copyright'))
                price_cat = sql_escape(body_data.get('price_category'))
                title_lang = sql_escape(body_data.get('title_language'))
                
                insert_sql = f"""
                    INSERT INTO {schema}.releases 
                    (artist_id, title, release_name, cover_url, release_date, preorder_date, 
                     sales_start_date, genre, copyright, price_category, title_language, status)
                    VALUES ({user_id}, {release_name}, {release_name}, {cover_url}, {release_date}, 
                            {preorder_date}, {sales_start}, {genre_val}, {copyright_val}, {price_cat}, 
                            {title_lang}, 'pending')
                    RETURNING id, created_at
                """
                print(f"[POST] Executing SQL: {insert_sql}")
                cur.execute(insert_sql)
                
                release = cur.fetchone()
                release_id = release['id']
                print(f"[POST] Release created with ID: {release_id}")
                
                tracks = body_data.get('tracks', [])
                print(f"[POST] Processing {len(tracks)} tracks")
                
                for idx, track in enumerate(tracks):
                    track_num = sql_escape(track.get('track_number'))
                    title = sql_escape(track.get('title'))
                    file_url = sql_escape(track.get('file_url'))
                    file_name = sql_escape(track.get('file_name'))
                    file_size = sql_escape(track.get('file_size'))
                    composer = sql_escape(track.get('composer'))
                    author_lyrics = sql_escape(track.get('author_lyrics'))
                    lang_audio = sql_escape(track.get('language_audio'))
                    explicit = sql_escape(track.get('explicit_content', False))
                    lyrics = sql_escape(track.get('lyrics_text'))
                    tiktok_start = sql_escape(track.get('tiktok_preview_start'))
                    track_genre = sql_escape(track.get('genre'))
                    description = sql_escape(track.get('description'))
                    
                    track_sql = f"""
                        INSERT INTO {schema}.release_tracks
                        (release_id, artist_id, track_number, title, file_url, file_name, file_size,
                         composer, author_lyrics, language_audio, explicit_content, lyrics_text, 
                         tiktok_preview_start, genre, description)
                        VALUES ({release_id}, {user_id}, {track_num}, {title}, {file_url}, {file_name}, 
                                {file_size}, {composer}, {author_lyrics}, {lang_audio}, {explicit}, 
                                {lyrics}, {tiktok_start}, {track_genre}, {description})
                    """
                    print(f"[POST] Track {idx+1}/{len(tracks)}: {track.get('title')}")
                    cur.execute(track_sql)
                
                print(f"[POST] All tracks inserted successfully")
                
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
            except Exception as e:
                print(f"[POST ERROR] Failed to create release: {type(e).__name__}: {str(e)}")
                import traceback
                print(f"[POST ERROR] Traceback: {traceback.format_exc()}")
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': f'Database error: {str(e)}'})
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
            
            cur.execute(f"""
                SELECT artist_id, release_name FROM {schema}.releases WHERE id = %s
            """, (release_id,))
            release_info = cur.fetchone()
            artist_id = release_info['artist_id']
            release_name = release_info['release_name']
            
            if action == 'approved':
                cur.execute(f"""
                    UPDATE {schema}.releases
                    SET status = 'approved', reviewed_by = %s, reviewed_at = CURRENT_TIMESTAMP,
                        review_comment = %s
                    WHERE id = %s
                """, (user_id, body_data.get('comment', ''), release_id))
                
                cur.execute(f"""
                    INSERT INTO {schema}.notifications 
                    (user_id, title, message, type, related_entity_type, related_entity_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    artist_id,
                    'Релиз одобрен ✅',
                    f'Ваш релиз "{release_name}" был одобрен и готов к публикации!',
                    'success',
                    'release',
                    release_id
                ))
                
            elif action == 'rejected':
                comment = body_data.get('comment', '')
                if not comment:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Comment is required when rejecting'})
                    }
                
                cur.execute(f"""
                    UPDATE {schema}.releases
                    SET status = 'rejected', reviewed_by = %s, reviewed_at = CURRENT_TIMESTAMP,
                        review_comment = %s
                    WHERE id = %s
                """, (user_id, comment, release_id))
                
                cur.execute(f"""
                    INSERT INTO {schema}.notifications 
                    (user_id, title, message, type, related_entity_type, related_entity_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    artist_id,
                    'Релиз отклонён ❌',
                    f'Ваш релиз "{release_name}" был отклонён. Причина: {comment}',
                    'error',
                    'release',
                    release_id
                ))
            
            elif action == 'pending':
                cur.execute(f"""
                    UPDATE {schema}.releases
                    SET status = 'pending', reviewed_by = %s, reviewed_at = CURRENT_TIMESTAMP,
                        review_comment = %s
                    WHERE id = %s
                """, (user_id, body_data.get('comment', ''), release_id))
                
                cur.execute(f"""
                    INSERT INTO {schema}.notifications 
                    (user_id, title, message, type, related_entity_type, related_entity_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    artist_id,
                    'Релиз возвращён на модерацию ⏳',
                    f'Ваш релиз "{release_name}" был возвращён на модерацию.',
                    'info',
                    'release',
                    release_id
                ))
            
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
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            release_id = params.get('release_id')
            
            if not release_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'release_id required'})
                }
            
            cur.execute(f"""
                SELECT r.*, u.role as user_role
                FROM {schema}.releases r
                JOIN {schema}.users u ON r.artist_id = u.id
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
            
            if release['artist_id'] != int(user_id):
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Only release owner can delete it'})
                }
            
            if release['status'] not in ['pending', 'draft']:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Can only delete releases in pending or draft status'})
                }
            
            import boto3
            from urllib.parse import urlparse
            
            s3_client = boto3.client(
                's3',
                endpoint_url='https://storage.yandexcloud.net',
                aws_access_key_id=os.environ.get('YC_S3_ACCESS_KEY_ID'),
                aws_secret_access_key=os.environ.get('YC_S3_SECRET_ACCESS_KEY'),
                region_name='ru-central1'
            )
            bucket_name = os.environ.get('YC_S3_BUCKET_NAME')
            
            files_to_delete = []
            
            if release.get('cover_url'):
                try:
                    cover_key = urlparse(release['cover_url']).path.lstrip('/')
                    if cover_key:
                        files_to_delete.append(cover_key)
                except Exception as e:
                    print(f"Error parsing cover URL: {e}")
            
            cur.execute(f"""
                SELECT file_url FROM {schema}.release_tracks
                WHERE release_id = %s
            """, (release_id,))
            tracks = cur.fetchall()
            
            for track in tracks:
                if track.get('file_url'):
                    try:
                        track_key = urlparse(track['file_url']).path.lstrip('/')
                        if track_key:
                            files_to_delete.append(track_key)
                    except Exception as e:
                        print(f"Error parsing track URL: {e}")
            
            for file_key in files_to_delete:
                try:
                    s3_client.delete_object(Bucket=bucket_name, Key=file_key)
                    print(f"Deleted file: {file_key}")
                except Exception as e:
                    print(f"Error deleting file {file_key}: {e}")
            
            cur.execute(f"DELETE FROM {schema}.release_tracks WHERE release_id = %s", (release_id,))
            cur.execute(f"DELETE FROM {schema}.releases WHERE id = %s", (release_id,))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'message': 'Release deleted successfully', 'deleted_files': len(files_to_delete)})
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