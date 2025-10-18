import json
import os
import base64
import uuid
from typing import Dict, Any
from urllib import request

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Upload files to S3 for tasks and tickets attachments
    Args: event - dict with httpMethod, body (base64 encoded file)
          context - object with request_id
    Returns: HTTP response with file URL
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        
        file_content = body_data.get('file')
        file_name = body_data.get('fileName')
        file_size = body_data.get('fileSize', 0)
        
        if not file_content or not file_name:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing file or fileName'})
            }
        
        if file_size > 10 * 1024 * 1024:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'File size exceeds 10MB limit'})
            }
        
        file_bytes = base64.b64decode(file_content.split(',')[1] if ',' in file_content else file_content)
        
        file_extension = file_name.split('.')[-1] if '.' in file_name else 'bin'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        upload_url = 'https://api.poehali.dev/v1/upload'
        
        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        body_parts = []
        
        body_parts.append(f'--{boundary}'.encode())
        body_parts.append(f'Content-Disposition: form-data; name="file"; filename="{unique_filename}"'.encode())
        body_parts.append(b'Content-Type: application/octet-stream')
        body_parts.append(b'')
        body_parts.append(file_bytes)
        body_parts.append(f'--{boundary}--'.encode())
        
        body = b'\r\n'.join(body_parts)
        
        req = request.Request(
            upload_url,
            data=body,
            headers={
                'Content-Type': f'multipart/form-data; boundary={boundary}',
                'Content-Length': str(len(body))
            },
            method='POST'
        )
        
        response = request.urlopen(req, timeout=30)
        response_data = json.loads(response.read().decode('utf-8'))
        
        file_url = response_data.get('url')
        
        if not file_url:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Failed to upload file'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'url': file_url,
                'fileName': file_name,
                'fileSize': file_size
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Upload failed: {str(e)}'})
        }
