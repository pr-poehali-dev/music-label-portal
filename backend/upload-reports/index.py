'''
Business: Upload and split artist streaming reports from CSV/Excel files
Args: event with httpMethod, body (base64 encoded file), queryStringParameters
Returns: HTTP response with split reports by artist
'''

import json
import base64
import csv
import io
import os
from typing import Dict, Any, List
import psycopg2
from collections import defaultdict

try:
    import openpyxl
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        try:
            body_data = json.loads(event.get('body', '{}'))
            file_content = body_data.get('file_content', '')
            file_type = body_data.get('file_type', 'csv')
            file_name = body_data.get('file_name', 'report.csv')
            uploaded_by = body_data.get('uploaded_by')
            
            if not file_content or not uploaded_by:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется file_content и uploaded_by'})
                }
            
            if file_type == 'xlsx':
                if not EXCEL_AVAILABLE:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Поддержка Excel не установлена'})
                    }
                
                decoded_bytes = base64.b64decode(file_content)
                workbook = openpyxl.load_workbook(io.BytesIO(decoded_bytes))
                sheet = workbook.active
                
                headers = [cell.value for cell in sheet[1]]
                rows = []
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    row_dict = {headers[i]: row[i] for i in range(len(headers)) if i < len(row)}
                    rows.append(row_dict)
            else:
                decoded_content = base64.b64decode(file_content).decode('utf-8')
                csv_reader = csv.DictReader(io.StringIO(decoded_content))
                rows = list(csv_reader)
            
            dsn = os.environ.get('DATABASE_URL')
            if not dsn:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'DATABASE_URL не настроен'})
                }
            
            conn = psycopg2.connect(dsn)
            cursor = conn.cursor()
            
            cursor.execute("SELECT username, full_name FROM t_p35759334_music_label_portal.users WHERE role = 'artist'")
            artists = {row[0]: row[1] for row in cursor.fetchall()}
            
            artist_data = defaultdict(list)
            unmatched_labels = set()
            
            for row in rows:
                label = row.get('Название альбома', '').strip()
                performer = row.get('Исполнитель', '').strip()
                
                artist_username = None
                for username, full_name in artists.items():
                    if (username.lower() in label.lower() or 
                        username.lower() in performer.lower() or
                        full_name.lower() in label.lower() or
                        full_name.lower() in performer.lower()):
                        artist_username = username
                        break
                
                if artist_username:
                    artist_data[artist_username].append(row)
                else:
                    unmatched_labels.add(label[:50])
            
            cursor.execute(
                "INSERT INTO t_p35759334_music_label_portal.uploaded_reports (file_name, uploaded_by, total_rows, processed) VALUES (%s, %s, %s, %s) RETURNING id",
                (file_name, uploaded_by, len(rows), True)
            )
            uploaded_report_id = cursor.fetchone()[0]
            
            created_files = []
            for artist_username, artist_rows in artist_data.items():
                artist_full_name = artists.get(artist_username, '')
                
                cursor.execute("""
                    INSERT INTO t_p35759334_music_label_portal.artist_report_files 
                    (uploaded_report_id, artist_username, artist_full_name, data, deduction_percent)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    uploaded_report_id,
                    artist_username,
                    artist_full_name,
                    json.dumps(artist_rows),
                    0
                ))
                
                file_id = cursor.fetchone()[0]
                created_files.append({
                    'id': file_id,
                    'artist_username': artist_username,
                    'artist_full_name': artist_full_name,
                    'rows_count': len(artist_rows)
                })
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'uploaded_report_id': uploaded_report_id,
                    'total_rows': len(rows),
                    'artist_files': created_files,
                    'unmatched_count': len(rows) - sum(f['rows_count'] for f in created_files),
                    'unmatched_labels': list(unmatched_labels)[:10]
                })
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': str(e)})
            }
    
    if method == 'GET':
        try:
            params = event.get('queryStringParameters', {}) or {}
            uploaded_report_id = params.get('uploaded_report_id')
            
            dsn = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(dsn)
            cursor = conn.cursor()
            
            if uploaded_report_id:
                cursor.execute("""
                    SELECT id, artist_username, artist_full_name, deduction_percent, sent_to_artist_id, sent_at, 
                           jsonb_array_length(data) as rows_count
                    FROM t_p35759334_music_label_portal.artist_report_files
                    WHERE uploaded_report_id = %s
                    ORDER BY artist_username
                """, (uploaded_report_id,))
            else:
                cursor.execute("""
                    SELECT arf.id, arf.artist_username, arf.artist_full_name, arf.deduction_percent, 
                           arf.sent_to_artist_id, arf.sent_at, jsonb_array_length(arf.data) as rows_count,
                           ur.file_name, ur.uploaded_at
                    FROM t_p35759334_music_label_portal.artist_report_files arf
                    JOIN t_p35759334_music_label_portal.uploaded_reports ur ON arf.uploaded_report_id = ur.id
                    ORDER BY ur.uploaded_at DESC, arf.artist_username
                """)
            
            files = []
            for row in cursor.fetchall():
                if uploaded_report_id:
                    files.append({
                        'id': row[0],
                        'artist_username': row[1],
                        'artist_full_name': row[2],
                        'deduction_percent': float(row[3]) if row[3] else 0,
                        'sent_to_artist_id': row[4],
                        'sent_at': row[5].isoformat() if row[5] else None,
                        'rows_count': row[6]
                    })
                else:
                    files.append({
                        'id': row[0],
                        'artist_username': row[1],
                        'artist_full_name': row[2],
                        'deduction_percent': float(row[3]) if row[3] else 0,
                        'sent_to_artist_id': row[4],
                        'sent_at': row[5].isoformat() if row[5] else None,
                        'rows_count': row[6],
                        'file_name': row[7],
                        'uploaded_at': row[8].isoformat() if row[8] else None
                    })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'files': files})
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': str(e)})
            }
    
    if method == 'PATCH':
        try:
            body_data = json.loads(event.get('body', '{}'))
            file_id = body_data.get('file_id')
            artist_id = body_data.get('artist_id')
            
            if file_id is None or artist_id is None:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется file_id и artist_id'})
                }
            
            dsn = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(dsn)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE t_p35759334_music_label_portal.artist_report_files
                SET sent_to_artist_id = %s
                WHERE id = %s
            """, (artist_id, file_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': str(e)})
            }
    
    if method == 'PUT':
        try:
            body_data = json.loads(event.get('body', '{}'))
            file_id = body_data.get('file_id')
            deduction_percent = body_data.get('deduction_percent')
            
            if file_id is None or deduction_percent is None:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется file_id и deduction_percent'})
                }
            
            dsn = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(dsn)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE t_p35759334_music_label_portal.artist_report_files
                SET deduction_percent = %s
                WHERE id = %s
            """, (deduction_percent, file_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': str(e)})
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }