'''
Business: Upload and parse artist streaming reports from CSV/Excel files
Args: event with httpMethod, body (base64 encoded file), queryStringParameters
Returns: HTTP response with parsed data and artist assignments
'''

import json
import base64
import csv
import io
import os
from typing import Dict, Any, List
import psycopg2
from datetime import datetime
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
            
            cursor.execute("SELECT id, username, full_name, revenue_share_percent FROM users WHERE role = 'artist'")
            artists = {row[1]: {'id': row[0], 'full_name': row[2], 'revenue_share_percent': row[3] or 50} for row in cursor.fetchall()}
            
            inserted_count = 0
            skipped_count = 0
            errors = []
            
            for row in rows:
                try:
                    label = row.get('Название альбома', '').strip()
                    
                    artist_username = None
                    for username in artists.keys():
                        if username.lower() in label.lower():
                            artist_username = username
                            break
                    
                    if not artist_username:
                        skipped_count += 1
                        continue
                    
                    artist_id = artists[artist_username]['id']
                    
                    period_str = row.get('Период использования', '').strip()
                    if not period_str:
                        skipped_count += 1
                        continue
                    
                    year, month = period_str.split('-')[0], period_str.split('-')[1]
                    period_start = f"{year}-{month}-01"
                    
                    if int(month) == 12:
                        period_end = f"{int(year)+1}-01-01"
                    else:
                        period_end = f"{year}-{int(month)+1:02d}-01"
                    
                    platform = row.get('Площадка', '').strip()
                    territory = row.get('Территория', '').strip()
                    right_type = row.get('Тип прав', '').strip()
                    contract_type = row.get('Тип контента', '').strip()
                    usage_type = row.get('Вид использования', '').strip()
                    performer = row.get('Исполнитель', '').strip()
                    track_name = row.get('Название трека', '').strip()
                    album_name = row.get('Название альбома', '').strip()
                    plays = int(row.get('Количество', '0') or '0')
                    
                    author_reward = row.get('Вознаграждение авторское ЛИЦЕНЗИАРА е прав', '0.00').replace(',', '.')
                    author_reward_changed = row.get('Вознаграждение авторское ЛИЦЕНЗИАРА (измененные е прав', '0.00').replace(',', '.')
                    total_reward = row.get('Итого вознаграждение ЛИЦЕНЗИАРА', '0.00').replace(',', '.')
                    
                    author_reward = float(author_reward or '0.00')
                    author_reward_changed = float(author_reward_changed or '0.00')
                    total_reward = float(total_reward or '0.00')
                    
                    cursor.execute("""
                        INSERT INTO artist_reports 
                        (artist_id, period_start, period_end, platform, territory, right_type, 
                         contract_type, usage_type, performer, track_name, album_name, label,
                         plays, author_reward_license, author_reward_license_changed, total_reward, uploaded_by)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (artist_id, period_start, platform, track_name, album_name) 
                        DO UPDATE SET 
                            plays = EXCLUDED.plays,
                            author_reward_license = EXCLUDED.author_reward_license,
                            author_reward_license_changed = EXCLUDED.author_reward_license_changed,
                            total_reward = EXCLUDED.total_reward,
                            uploaded_at = CURRENT_TIMESTAMP
                    """, (
                        artist_id, period_start, period_end, platform, territory, right_type,
                        contract_type, usage_type, performer, track_name, album_name, label,
                        plays, author_reward, author_reward_changed, total_reward, uploaded_by
                    ))
                    
                    inserted_count += 1
                    
                except Exception as e:
                    errors.append(f"Ошибка в строке: {str(e)}")
                    skipped_count += 1
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'inserted': inserted_count,
                    'skipped': skipped_count,
                    'errors': errors[:10]
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
            artist_id = params.get('artist_id')
            
            dsn = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(dsn)
            cursor = conn.cursor()
            
            if artist_id:
                cursor.execute("""
                    SELECT ar.id, ar.period_start, ar.period_end, ar.platform, ar.territory, ar.right_type,
                           ar.contract_type, ar.usage_type, ar.performer, ar.track_name, ar.album_name,
                           ar.plays, ar.author_reward_license, ar.author_reward_license_changed, 
                           ar.total_reward, ar.uploaded_at, u.revenue_share_percent
                    FROM artist_reports ar
                    LEFT JOIN users u ON ar.artist_id = u.id
                    WHERE ar.artist_id = %s
                    ORDER BY ar.period_start DESC, ar.uploaded_at DESC
                """, (artist_id,))
            else:
                cursor.execute("""
                    SELECT id, artist_id, period_start, period_end, platform, territory, right_type,
                           contract_type, usage_type, performer, track_name, album_name,
                           plays, author_reward_license, author_reward_license_changed, 
                           total_reward, uploaded_at
                    FROM artist_reports
                    ORDER BY uploaded_at DESC
                    LIMIT 1000
                """)
            
            columns = [desc[0] for desc in cursor.description]
            reports = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            for report in reports:
                for key, value in report.items():
                    if isinstance(value, datetime):
                        report[key] = value.isoformat()
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'reports': reports})
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