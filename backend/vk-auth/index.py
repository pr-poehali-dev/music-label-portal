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
REDIRECT_URI = os.environ.get('VK_REDIRECT_URI', '')

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
            if not VK_APP_ID or not REDIRECT_URI:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'error': 'VK не настроен',
                        'details': 'Добавьте VK_APP_ID и VK_REDIRECT_URI в секреты проекта'
                    })
                }
            
            auth_url = (
                f"https://id.vk.com/auth?"
                f"app_id={VK_APP_ID}&"
                f"redirect_uri={urllib.parse.quote(REDIRECT_URI)}&"
                f"response_type=code&"
                f"scope=email&"
                f"state=vk_auth&"
                f"code_challenge=x&"
                f"code_challenge_method=s256"
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
            device_id = event.get('queryStringParameters', {}).get('device_id', 'web_device')
            
            if not code:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'No authorization code'})
                }
            
            token_data = {
                'grant_type': 'authorization_code',
                'code_verifier': 'x',
                'redirect_uri': REDIRECT_URI,
                'code': code,
                'client_id': VK_APP_ID,
                'device_id': device_id,
                'state': 'vk_auth'
            }
            
            token_url = 'https://id.vk.com/oauth2/auth'
            post_data = urllib.parse.urlencode(token_data).encode('utf-8')
            
            req = urllib.request.Request(token_url, data=post_data, method='POST')
            req.add_header('Content-Type', 'application/x-www-form-urlencoded')
            
            try:
                with urllib.request.urlopen(req) as response:
                    token_result = json.loads(response.read().decode())
                
                if 'error' in token_result:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'error': token_result.get('error_description', 'VK auth error'),
                            'details': token_result.get('error', '')
                        })
                    }
                
                access_token = token_result.get('access_token', '')
                user_id = token_result.get('user_id', '')
                
                user_info_url = f"https://id.vk.com/oauth2/user_info"
                user_req = urllib.request.Request(user_info_url)
                user_req.add_header('Authorization', f'Bearer {access_token}')
                
                with urllib.request.urlopen(user_req) as user_response:
                    user_data = json.loads(user_response.read().decode())
                
                user_info = user_data.get('user', {})
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'vk_id': str(user_id),
                        'first_name': user_info.get('first_name', ''),
                        'last_name': user_info.get('last_name', ''),
                        'photo': user_info.get('avatar', ''),
                        'email': user_info.get('email', ''),
                        'access_token': access_token
                    })
                }
            except urllib.error.HTTPError as e:
                error_body = e.read().decode()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'error': 'VK API error',
                        'details': error_body
                    })
                }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
