'''
Business: Analytics for support tickets - daily statistics, manager performance, resolution times
Args: event with httpMethod GET, context with request_id
Returns: HTTP response with tickets analytics data
'''

import json
import os
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        cur.execute('''
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as created_count,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
                COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count
            FROM tickets
            WHERE created_at >= %s AND created_at <= %s
            GROUP BY DATE(created_at)
            ORDER BY date
        ''', (start_date, end_date))
        
        daily_stats = cur.fetchall()
        
        cur.execute('''
            SELECT 
                u.id,
                u.full_name,
                COUNT(t.id) as total_tickets,
                COUNT(CASE WHEN t.status = 'resolved' THEN 1 END) as resolved_tickets,
                AVG(CASE 
                    WHEN t.status = 'resolved' AND t.updated_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/3600 
                END) as avg_resolution_hours
            FROM users u
            LEFT JOIN tickets t ON t.assigned_to = u.id 
                AND t.created_at >= %s 
                AND t.created_at <= %s
            WHERE u.role = 'manager'
            GROUP BY u.id, u.full_name
            ORDER BY resolved_tickets DESC
        ''', (start_date, end_date))
        
        manager_stats = cur.fetchall()
        
        cur.execute('''
            SELECT 
                COUNT(*) as total_tickets,
                COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
                COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tickets,
                AVG(CASE 
                    WHEN status = 'resolved' AND updated_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
                END) as avg_resolution_hours
            FROM tickets
            WHERE created_at >= %s AND created_at <= %s
        ''', (start_date, end_date))
        
        summary = cur.fetchone()
        
        cur.close()
        conn.close()
        
        response_data = {
            'daily_stats': [dict(row) for row in daily_stats],
            'manager_stats': [dict(row) for row in manager_stats],
            'summary': dict(summary) if summary else {}
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(response_data, default=str)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }