import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления вакансиями (CRUD)
    Args: event с httpMethod, queryStringParameters, body; context с request_id
    Returns: HTTP response с списком вакансий или статусом операции
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
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('''
                    SELECT id, position, schedule, workplace, duties, salary, contact, 
                           is_active, created_at, updated_at, created_by
                    FROM t_p35759334_music_label_portal.jobs
                    WHERE is_active = true
                    ORDER BY created_at DESC
                ''')
                jobs = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps([dict(j) for j in jobs], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('''
                    INSERT INTO t_p35759334_music_label_portal.jobs 
                    (position, schedule, workplace, duties, salary, contact, is_active, created_by)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, position, schedule, workplace, duties, salary, contact, 
                              is_active, created_at, updated_at, created_by
                ''', (
                    body_data.get('position'),
                    body_data.get('schedule'),
                    body_data.get('workplace'),
                    body_data.get('duties'),
                    body_data.get('salary'),
                    body_data.get('contact'),
                    body_data.get('is_active', True),
                    user_id
                ))
                job = cur.fetchone()
                conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(job), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            params = event.get('queryStringParameters', {})
            job_id = int(params.get('id', 0))
            body_data = json.loads(event.get('body', '{}'))
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('''
                    UPDATE t_p35759334_music_label_portal.jobs
                    SET position = %s, schedule = %s, workplace = %s, duties = %s,
                        salary = %s, contact = %s, is_active = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id, position, schedule, workplace, duties, salary, contact, 
                              is_active, created_at, updated_at, created_by
                ''', (
                    body_data.get('position'),
                    body_data.get('schedule'),
                    body_data.get('workplace'),
                    body_data.get('duties'),
                    body_data.get('salary'),
                    body_data.get('contact'),
                    body_data.get('is_active', True),
                    job_id
                ))
                job = cur.fetchone()
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(dict(job) if job else {}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            job_id = int(params.get('id', 0))
            
            with conn.cursor() as cur:
                cur.execute('DELETE FROM t_p35759334_music_label_portal.jobs WHERE id = %s', (job_id,))
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        conn.close()
