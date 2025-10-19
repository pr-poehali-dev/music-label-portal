import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление питчингами релизов - создание, получение списка
    Args: event с httpMethod, body, queryStringParameters
          context с request_id
    Returns: HTTP response dict
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
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': 'DATABASE_URL not configured'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            release_id = body.get('release_id')
            artist_name = body.get('artist_name')
            release_name = body.get('release_name')
            release_date = body.get('release_date')
            genre = body.get('genre')
            artist_description = body.get('artist_description')
            release_description = body.get('release_description')
            playlist_fit = body.get('playlist_fit')
            current_reach = body.get('current_reach')
            preview_link = body.get('preview_link')
            artist_photos = body.get('artist_photos', [])
            
            if not all([release_id, artist_name, release_name, release_date, genre, 
                       artist_description, release_description, playlist_fit, 
                       current_reach, preview_link]):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                INSERT INTO pitchings (
                    release_id, artist_name, release_name, release_date, genre,
                    artist_description, release_description, playlist_fit, 
                    current_reach, preview_link, artist_photos, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
            """, (
                release_id, artist_name, release_name, release_date, genre,
                artist_description, release_description, playlist_fit,
                current_reach, preview_link, json.dumps(artist_photos), 'pending'
            ))
            
            result = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({
                    'id': result[0],
                    'created_at': result[1].isoformat()
                }),
                'isBase64Encoded': False
            }
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            release_id = params.get('release_id')
            
            if release_id:
                cur.execute("""
                    SELECT id, release_id, artist_name, release_name, release_date, 
                           genre, artist_description, release_description, 
                           playlist_fit, current_reach, preview_link, artist_photos,
                           status, created_at
                    FROM pitchings 
                    WHERE release_id = %s
                    ORDER BY created_at DESC
                """, (release_id,))
            else:
                cur.execute("""
                    SELECT id, release_id, artist_name, release_name, release_date, 
                           genre, artist_description, release_description, 
                           playlist_fit, current_reach, preview_link, artist_photos,
                           status, created_at
                    FROM pitchings 
                    ORDER BY created_at DESC
                """)
            
            rows = cur.fetchall()
            pitchings = []
            
            for row in rows:
                pitchings.append({
                    'id': row[0],
                    'release_id': row[1],
                    'artist_name': row[2],
                    'release_name': row[3],
                    'release_date': row[4].isoformat() if row[4] else None,
                    'genre': row[5],
                    'artist_description': row[6],
                    'release_description': row[7],
                    'playlist_fit': row[8],
                    'current_reach': row[9],
                    'preview_link': row[10],
                    'artist_photos': json.loads(row[11]) if row[11] else [],
                    'status': row[12],
                    'created_at': row[13].isoformat()
                })
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(pitchings),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()