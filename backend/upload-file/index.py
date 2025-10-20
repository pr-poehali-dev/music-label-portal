import json
import os
import base64
import uuid
from typing import Dict, Any
import boto3
from datetime import datetime
import cgi
from io import BytesIO

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Upload files to S3 storage (images, audio, documents)
    Args: event - dict with httpMethod, body (multipart/form-data), headers
          context - object with request_id
    Returns: HTTP response with S3 URL
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
        headers = event.get('headers', {})
        content_type = headers.get('content-type') or headers.get('Content-Type', '')
        
        # Проверяем тип запроса
        if 'multipart/form-data' in content_type:
            # Новый способ: multipart/form-data
            body = event.get('body', '')
            is_base64 = event.get('isBase64Encoded', False)
            
            if is_base64:
                body_bytes = base64.b64decode(body)
            else:
                body_bytes = body.encode('utf-8') if isinstance(body, str) else body
            
            # Парсим multipart
            boundary = content_type.split('boundary=')[-1]
            environ = {
                'REQUEST_METHOD': 'POST',
                'CONTENT_TYPE': content_type,
                'CONTENT_LENGTH': str(len(body_bytes))
            }
            
            fp = BytesIO(body_bytes)
            form = cgi.FieldStorage(fp=fp, environ=environ, headers={'content-type': content_type})
            
            if 'file' not in form:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'No file provided'})
                }
            
            file_item = form['file']
            file_data = file_item.file.read()
            file_name = form.getvalue('fileName', file_item.filename)
            file_size = len(file_data)
            
        else:
            # Старый способ: JSON с base64
            body_data = json.loads(event.get('body', '{}'))
            
            file_b64 = body_data.get('file', '')
            if not file_b64:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'No file data provided'})
                }
            
            file_name = body_data.get('fileName', 'unnamed')
            
            # Декодируем base64
            if ',' in file_b64:
                file_b64 = file_b64.split(',', 1)[1]
            
            file_data = base64.b64decode(file_b64)
            file_size = len(file_data)
        
        print(f"Upload request: fileName={file_name}, fileSize={file_size}")
        
        # Загружаем в S3
        access_key = os.environ.get('YC_S3_ACCESS_KEY_ID')
        secret_key = os.environ.get('YC_S3_SECRET_ACCESS_KEY')
        bucket_name = os.environ.get('YC_S3_BUCKET_NAME')
        
        s3_client = boto3.client(
            's3',
            endpoint_url='https://storage.yandexcloud.net',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name='ru-central1'
        )
        
        file_ext = file_name.split('.')[-1] if '.' in file_name else ''
        unique_filename = f"{uuid.uuid4()}.{file_ext}" if file_ext else str(uuid.uuid4())
        s3_key = f"uploads/{datetime.now().strftime('%Y/%m/%d')}/{unique_filename}"
        
        # Определяем content-type
        content_type_map = {
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'pdf': 'application/pdf'
        }
        file_content_type = content_type_map.get(file_ext.lower(), 'application/octet-stream')
        
        print(f"Uploading to S3: {s3_key}, size={file_size} bytes, type={file_content_type}")
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=file_data,
            ContentType=file_content_type
        )
        
        file_url = f"https://storage.yandexcloud.net/{bucket_name}/{s3_key}"
        
        print(f"Upload successful: {file_url}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'url': file_url,
                's3Key': s3_key,
                'fileName': file_name,
                'fileSize': file_size
            })
        }
        
    except Exception as e:
        print(f"Upload error: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Upload failed: {str(e)}'})
        }
