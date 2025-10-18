'''
Business: Export artist reports to PDF document with detailed statistics
Args: event with httpMethod, queryStringParameters (artist_id, period, platform)
Returns: PDF file as base64 or download link
'''

import json
import os
from typing import Dict, Any
import psycopg2
from datetime import datetime
from io import BytesIO
import base64

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
    
    if method == 'GET':
        try:
            params = event.get('queryStringParameters', {}) or {}
            artist_id = params.get('artist_id')
            period = params.get('period', 'all')
            platform = params.get('platform', 'all')
            
            if not artist_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется artist_id'})
                }
            
            dsn = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(dsn)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT full_name, revenue_share_percent 
                FROM users 
                WHERE id = %s AND role = 'artist'
            """, (artist_id,))
            
            artist_data = cursor.fetchone()
            if not artist_data:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Артист не найден'})
                }
            
            artist_name = artist_data[0]
            revenue_share = artist_data[1] or 50
            
            query = """
                SELECT period_start, period_end, platform, territory, track_name, 
                       album_name, plays, total_reward
                FROM artist_reports
                WHERE artist_id = %s
            """
            query_params = [artist_id]
            
            if period != 'all':
                query += " AND period_start = %s"
                query_params.append(period)
            
            if platform != 'all':
                query += " AND platform = %s"
                query_params.append(platform)
            
            query += " ORDER BY period_start DESC, platform, track_name"
            
            cursor.execute(query, query_params)
            reports = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            try:
                from reportlab.lib.pagesizes import A4, landscape
                from reportlab.lib import colors
                from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib.units import cm
                from reportlab.pdfbase import pdfmetrics
                from reportlab.pdfbase.ttfonts import TTFont
            except ImportError:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ReportLab not installed'})
                }
            
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=1*cm, bottomMargin=1*cm)
            
            elements = []
            styles = getSampleStyleSheet()
            
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=16,
                textColor=colors.HexColor('#1a1a1a'),
                spaceAfter=12,
                alignment=1
            )
            
            title_text = f"Отчёт по прослушиваниям: {artist_name}"
            elements.append(Paragraph(title_text, title_style))
            elements.append(Spacer(1, 0.5*cm))
            
            total_plays = sum([r[6] for r in reports])
            total_reward = sum([r[7] for r in reports])
            artist_reward = total_reward * (revenue_share / 100)
            label_reward = total_reward - artist_reward
            
            summary_data = [
                ['Метрика', 'Значение'],
                ['Дата формирования', datetime.now().strftime('%d.%m.%Y %H:%M')],
                ['Всего прослушиваний', f"{total_plays:,}".replace(',', ' ')],
                ['Общее вознаграждение', f"{total_reward:.2f} ₽"],
                [f'Доля артиста ({revenue_share}%)', f"{artist_reward:.2f} ₽"],
                ['Доля лейбла', f"{label_reward:.2f} ₽"],
            ]
            
            summary_table = Table(summary_data, colWidths=[8*cm, 6*cm])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f0f0')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1a1a1a')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'),
                ('TEXTCOLOR', (0, 4), (-1, 4), colors.HexColor('#22c55e')),
            ]))
            
            elements.append(summary_table)
            elements.append(Spacer(1, 1*cm))
            
            if reports:
                detail_title = Paragraph("Детализация по трекам", title_style)
                elements.append(detail_title)
                elements.append(Spacer(1, 0.3*cm))
                
                data = [['Период', 'Площадка', 'Трек', 'Альбом', 'Прослушивания', 'Вознаграждение']]
                
                for report in reports:
                    period_str = report[0].strftime('%m.%Y') if report[0] else '-'
                    data.append([
                        period_str,
                        report[2][:15],
                        report[4][:30],
                        report[5][:25],
                        f"{report[6]:,}".replace(',', ' '),
                        f"{report[7]:.2f} ₽"
                    ])
                
                detail_table = Table(data, colWidths=[2.5*cm, 3.5*cm, 6*cm, 5*cm, 3*cm, 3.5*cm])
                detail_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#374151')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('ALIGN', (4, 1), (5, -1), 'RIGHT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('TOPPADDING', (0, 1), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
                ]))
                
                elements.append(detail_table)
            
            doc.build(elements)
            
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'filename': f"report_{artist_name}_{datetime.now().strftime('%Y%m%d')}.pdf",
                    'pdf': pdf_base64
                })
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
