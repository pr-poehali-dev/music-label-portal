'''
Business: Export artist report to PDF with deduction and send to artist
Args: event with httpMethod, body (file_id, artist_id), queryStringParameters
Returns: PDF file or success status
'''

import json
import os
import io
from typing import Dict, Any
import psycopg2
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import base64

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        try:
            body_data = json.loads(event.get('body', '{}'))
            file_id = body_data.get('file_id')
            artist_id = body_data.get('artist_id')
            
            if not file_id or not artist_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется file_id и artist_id'})
                }
            
            dsn = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(dsn)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT artist_username, artist_full_name, data, deduction_percent
                FROM t_p35759334_music_label_portal.artist_report_files
                WHERE id = %s
            """, (file_id,))
            
            file_data = cursor.fetchone()
            if not file_data:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Файл не найден'})
                }
            
            artist_username, artist_full_name, data_json, deduction_percent = file_data
            rows = json.loads(data_json)
            deduction_percent = float(deduction_percent) if deduction_percent else 0
            
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1*cm, leftMargin=1*cm, topMargin=1*cm, bottomMargin=1*cm)
            
            story = []
            styles = getSampleStyleSheet()
            
            title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=16, textColor=colors.HexColor('#1a1a1a'), spaceAfter=20, alignment=TA_CENTER)
            
            story.append(Paragraph(f'Отчёт для артиста: {artist_full_name}', title_style))
            story.append(Spacer(1, 0.5*cm))
            
            total_plays = sum(int(row.get('Количество', 0) or 0) for row in rows)
            total_reward_raw = sum(float(str(row.get('Итого вознаграждение ЛИЦЕНЗИАРА', '0')).replace(',', '.')) for row in rows)
            
            label_share = total_reward_raw * (deduction_percent / 100)
            artist_share = total_reward_raw - label_share
            
            summary_data = [
                ['Показатель', 'Значение'],
                ['Всего прослушиваний', f'{total_plays:,}'],
                ['Общее вознаграждение', f'{total_reward_raw:.2f} ₽'],
                ['Удержание лейбла ({:.1f}%)'.format(deduction_percent), f'{label_share:.2f} ₽'],
                ['Ваша доля', f'{artist_share:.2f} ₽'],
            ]
            
            summary_table = Table(summary_data, colWidths=[12*cm, 7*cm])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#333333')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#90EE90')),
            ]))
            
            story.append(summary_table)
            story.append(Spacer(1, 1*cm))
            
            story.append(Paragraph('Детализация по трекам', styles['Heading2']))
            story.append(Spacer(1, 0.3*cm))
            
            detail_data = [['Трек', 'Площадка', 'Прослушивания', 'Вознаграждение']]
            
            for row in rows[:100]:
                track_name = row.get('Название трека', '')[:30]
                platform = row.get('Площадка', '')[:15]
                plays = int(row.get('Количество', 0) or 0)
                reward = float(str(row.get('Итого вознаграждение ЛИЦЕНЗИАРА', '0')).replace(',', '.'))
                
                detail_data.append([track_name, platform, f'{plays:,}', f'{reward:.2f} ₽'])
            
            detail_table = Table(detail_data, colWidths=[7*cm, 4*cm, 4*cm, 4*cm])
            detail_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
            ]))
            
            story.append(detail_table)
            
            doc.build(story)
            
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            cursor.execute("""
                UPDATE t_p35759334_music_label_portal.artist_report_files
                SET sent_to_artist_id = %s, sent_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (artist_id, file_id))
            
            for row in rows:
                period_str = row.get('Период использования', '2024-01').strip()
                year, month = period_str.split('-')[0], period_str.split('-')[1]
                period_start = f"{year}-{month}-01"
                
                if int(month) == 12:
                    period_end = f"{int(year)+1}-01-01"
                else:
                    period_end = f"{year}-{int(month)+1:02d}-01"
                
                plays = int(row.get('Количество', 0) or 0)
                total_reward_row = float(str(row.get('Итого вознаграждение ЛИЦЕНЗИАРА', '0')).replace(',', '.'))
                artist_share_row = total_reward_row * (1 - deduction_percent / 100)
                
                cursor.execute("""
                    INSERT INTO t_p35759334_music_label_portal.artist_reports
                    (artist_id, period_start, period_end, platform, territory, right_type, 
                     contract_type, usage_type, performer, track_name, album_name, label,
                     plays, author_reward_license, author_reward_license_changed, total_reward, uploaded_by)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (artist_id, period_start, platform, track_name, album_name) 
                    DO UPDATE SET 
                        plays = EXCLUDED.plays,
                        total_reward = EXCLUDED.total_reward,
                        uploaded_at = CURRENT_TIMESTAMP
                """, (
                    artist_id,
                    period_start,
                    period_end,
                    row.get('Площадка', '').strip(),
                    row.get('Территория', '').strip(),
                    row.get('Тип прав', '').strip(),
                    row.get('Тип контента', '').strip(),
                    row.get('Вид использования', '').strip(),
                    row.get('Исполнитель', '').strip(),
                    row.get('Название трека', '').strip(),
                    row.get('Название альбома', '').strip(),
                    row.get('Название альбома', '').strip(),
                    plays,
                    0,
                    0,
                    artist_share_row,
                    artist_id
                ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': f'attachment; filename="report_{artist_username}.pdf"',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': True,
                'body': pdf_base64
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