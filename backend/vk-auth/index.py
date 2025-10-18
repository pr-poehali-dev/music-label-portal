'''
Business: OAuth авторизация через ВКонтакте
Args: event с httpMethod (GET/POST), queryStringParameters (code, state), body (user_data)
Returns: HTTP response с access_token или URL для редиректа
'''

import json
import os
import urllib.request
import urllib.parse
import urllib.error
from typing import Dict, Any

VK_APP_ID = os.environ.get('VK_APP_ID', '')
VK_APP_SECRET = os.environ.get('VK_APP_SECRET', '')
REDIRECT_URI = os.environ.get('VK_REDIRECT_URI', 'https://your-domain.poehali.dev/auth/vk/callback')

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
        action = event.get('queryStringParameters', {}).get('action', '')
        
        if action == 'login':
            auth_url = (
                f"https://oauth.vk.com/authorize?"
                f"client_id={VK_APP_ID}&"
                f"redirect_uri={urllib.parse.quote(REDIRECT_URI)}&"
                f"display=page&"
                f"scope=email&"
                f"response_type=code&"
                f"v=5.131"
            )
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'auth_url': auth_url})
            }
        
        if action == 'callback':
            code = event.get('queryStringParameters', {}).get('code', '')
            
            if not code:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'No authorization code'})
                }
            
            token_url = (
                f"https://oauth.vk.com/access_token?"
                f"client_id={VK_APP_ID}&"
                f"client_secret={VK_APP_SECRET}&"
                f"redirect_uri={urllib.parse.quote(REDIRECT_URI)}&"
                f"code={code}"
            )
            
            req = urllib.request.Request(token_url)
            with urllib.request.urlopen(req) as response:
                token_data = json.loads(response.read().decode())
            
            if 'error' in token_data:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': token_data.get('error_description', 'VK auth error')})
                }
            
            access_token = token_data.get('access_token', '')
            user_id = token_data.get('user_id', '')
            email = token_data.get('email', '')
            
            user_info_url = (
                f"https://api.vk.com/method/users.get?"
                f"user_ids={user_id}&"
                f"fields=photo_200,screen_name&"
                f"access_token={access_token}&"
                f"v=5.131"
            )
            
            req = urllib.request.Request(user_info_url)
            with urllib.request.urlopen(req) as response:
                user_info_data = json.loads(response.read().decode())
            
            if 'response' in user_info_data and len(user_info_data['response']) > 0:
                user = user_info_data['response'][0]
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'vk_id': user_id,
                        'first_name': user.get('first_name', ''),
                        'last_name': user.get('last_name', ''),
                        'photo': user.get('photo_200', ''),
                        'email': email,
                        'access_token': access_token
                    })
                }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
