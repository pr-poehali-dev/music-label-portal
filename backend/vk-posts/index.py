import json
import urllib.request
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение постов из публичной группы ВКонтакте
    Args: event с queryStringParameters (count, offset)
    Returns: JSON с постами из группы VK
    '''
    method = event.get('httpMethod', 'GET')
    
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
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters') or {}
    count = min(int(params.get('count', '10')), 100)
    offset = int(params.get('offset', '0'))
    
    owner_id = '-214160827'
    service_key = os.environ.get('VK_SERVICE_KEY', '')
    
    url = f'https://api.vk.com/method/wall.get?owner_id={owner_id}&count={count}&offset={offset}&access_token={service_key}&v=5.199'
    
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            
            if 'error' in data:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': data['error'].get('error_msg', 'VK API error'), 'details': str(data['error'])})
                }
            
            posts = data.get('response', {}).get('items', [])
            
            formatted_posts = []
            for post in posts:
                formatted_post = {
                    'id': post.get('id'),
                    'date': post.get('date'),
                    'text': post.get('text', ''),
                    'likes': post.get('likes', {}).get('count', 0),
                    'reposts': post.get('reposts', {}).get('count', 0),
                    'views': post.get('views', {}).get('count', 0),
                    'comments': post.get('comments', {}).get('count', 0),
                    'attachments': []
                }
                
                for attach in post.get('attachments', []):
                    if attach['type'] == 'photo':
                        sizes = attach['photo']['sizes']
                        largest = max(sizes, key=lambda x: x.get('width', 0) * x.get('height', 0))
                        formatted_post['attachments'].append({
                            'type': 'photo',
                            'url': largest['url']
                        })
                    elif attach['type'] == 'video':
                        video = attach.get('video', {})
                        image = video.get('image', [{}])[-1].get('url', '') if video.get('image') else ''
                        formatted_post['attachments'].append({
                            'type': 'video',
                            'title': video.get('title', ''),
                            'image': image
                        })
                    elif attach['type'] == 'audio':
                        audio = attach.get('audio', {})
                        formatted_post['attachments'].append({
                            'type': 'audio',
                            'artist': audio.get('artist', ''),
                            'title': audio.get('title', '')
                        })
                
                formatted_posts.append(formatted_post)
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'isBase64Encoded': False,
                'body': json.dumps({'posts': formatted_posts, 'total': data.get('response', {}).get('count', 0)})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }
