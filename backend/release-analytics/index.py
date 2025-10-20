"""
Business: Get release analytics statistics from database
Args: event with httpMethod GET
Returns: JSON with release statistics (total, by status, top artists, monthly trends, platform distribution)
"""

import json
import os
import psycopg2
from typing import Dict, Any

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
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database connection not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            COUNT(*) as total_releases,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_releases,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_releases,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_releases,
            SUM(CASE WHEN status IN ('approved', 'rejected') THEN 1 ELSE 0 END) as reviewed_releases
        FROM t_p35759334_music_label_portal.releases
    """)
    overall_stats = cur.fetchone()
    
    cur.execute("""
        SELECT 
            u.full_name as artist_name,
            COUNT(r.id) as release_count
        FROM t_p35759334_music_label_portal.releases r
        JOIN t_p35759334_music_label_portal.users u ON r.artist_id = u.id
        WHERE u.role = 'artist'
        GROUP BY u.id, u.full_name
        ORDER BY release_count DESC
        LIMIT 5
    """)
    top_artists = cur.fetchall()
    
    cur.execute("""
        SELECT 
            TO_CHAR(created_at, 'TMMonth') as month,
            COUNT(*) as count
        FROM t_p35759334_music_label_portal.releases
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'TMMonth'), EXTRACT(MONTH FROM created_at)
        ORDER BY EXTRACT(MONTH FROM created_at)
    """)
    monthly_data = cur.fetchall()
    
    cur.execute("""
        SELECT 
            SUM(CASE WHEN yandex_music_url IS NOT NULL AND yandex_music_url != '' THEN 1 ELSE 0 END) as yandex_music,
            SUM(CASE WHEN vk_url IS NOT NULL AND vk_url != '' THEN 1 ELSE 0 END) as vk_music,
            SUM(CASE WHEN spotify_url IS NOT NULL AND spotify_url != '' THEN 1 ELSE 0 END) as spotify
        FROM t_p35759334_music_label_portal.releases
    """)
    platform_stats = cur.fetchone()
    
    cur.close()
    conn.close()
    
    month_names = {
        'January': 'Январь',
        'February': 'Февраль',
        'March': 'Март',
        'April': 'Апрель',
        'May': 'Май',
        'June': 'Июнь',
        'July': 'Июль',
        'August': 'Август',
        'September': 'Сентябрь',
        'October': 'Октябрь',
        'November': 'Ноябрь',
        'December': 'Декабрь'
    }
    
    platform_dist = []
    if platform_stats:
        if platform_stats[0] and platform_stats[0] > 0:
            platform_dist.append({'platform': 'Яндекс.Музыка', 'count': int(platform_stats[0])})
        if platform_stats[1] and platform_stats[1] > 0:
            platform_dist.append({'platform': 'VK Музыка', 'count': int(platform_stats[1])})
        if platform_stats[2] and platform_stats[2] > 0:
            platform_dist.append({'platform': 'Spotify', 'count': int(platform_stats[2])})
    
    result = {
        'total_releases': int(overall_stats[0]) if overall_stats[0] else 0,
        'pending_releases': int(overall_stats[1]) if overall_stats[1] else 0,
        'approved_releases': int(overall_stats[2]) if overall_stats[2] else 0,
        'rejected_releases': int(overall_stats[3]) if overall_stats[3] else 0,
        'reviewed_releases': int(overall_stats[4]) if overall_stats[4] else 0,
        'total_streams': 0,
        'avg_rating': 0,
        'top_artists': [{'artist_name': row[0], 'release_count': int(row[1])} for row in top_artists],
        'releases_by_month': [{'month': month_names.get(row[0], row[0]), 'count': int(row[1])} for row in monthly_data],
        'platform_distribution': platform_dist
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result),
        'isBase64Encoded': False
    }