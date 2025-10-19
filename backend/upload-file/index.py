import json
import os
import base64
import uuid
from typing import Dict, Any
import boto3
from datetime import datetime

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
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_str = event.get('body', '{}')
        if not body_str or body_str.strip() == '':
            body_str = '{}'
        body_data = json.loads(body_str)
        
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
        
        # Загружаем файл в Yandex Object Storage (S3)
        access_key = os.environ.get('YC_S3_ACCESS_KEY_ID')
        secret_key = os.environ.get('YC_S3_SECRET_ACCESS_KEY')
        bucket_name = os.environ.get('YC_S3_BUCKET_NAME')
        
        if not all([access_key, secret_key, bucket_name]):
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'S3 credentials not configured'})
            }
        
        # Создаём S3 клиент для Yandex Cloud
        s3_client = boto3.client(
            's3',
            endpoint_url='https://storage.yandexcloud.net',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name='ru-central1'
        )
        
        # Генерируем уникальное имя файла
        file_ext = file_name.split('.')[-1] if '.' in file_name else ''
        unique_filename = f"{uuid.uuid4()}.{file_ext}" if file_ext else str(uuid.uuid4())
        s3_key = f"uploads/{datetime.now().strftime('%Y/%m/%d')}/{unique_filename}"
        
        # Декодируем base64 и загружаем в S3
        if file_content.startswith('data:'):
            file_content = file_content.split(',', 1)[1]
        
        file_bytes = base64.b64decode(file_content)
        
        # Определяем Content-Type
        content_type = 'application/octet-stream'
        if file_ext.lower() in ['jpg', 'jpeg']:
            content_type = 'image/jpeg'
        elif file_ext.lower() == 'png':
            content_type = 'image/png'
        elif file_ext.lower() == 'gif':
            content_type = 'image/gif'
        elif file_ext.lower() == 'pdf':
            content_type = 'application/pdf'
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type
        )
        
        # Формируем публичный URL
        file_url = f"https://storage.yandexcloud.net/{bucket_name}/{s3_key}"
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'url': file_url,
                'fileName': file_name,
                'fileSize': file_size,
                's3Key': s3_key
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Upload failed: {str(e)}'})
        }