import json
import os
import base64
import uuid
from typing import Dict, Any
import boto3
from datetime import datetime

def merge_chunks(body_data: Dict[str, Any]) -> Dict[str, Any]:
    '''
    Merge uploaded file chunks into single file
    '''
    try:
        chunks = body_data.get('chunks', [])
        file_name = body_data.get('fileName')
        file_size = body_data.get('fileSize', 0)
        
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
        
        # Скачиваем и объединяем все части
        merged_data = b''
        for chunk_key in chunks:
            obj = s3_client.get_object(Bucket=bucket_name, Key=chunk_key)
            merged_data += obj['Body'].read()
            # Удаляем временный chunk
            s3_client.delete_object(Bucket=bucket_name, Key=chunk_key)
        
        # Загружаем объединённый файл
        file_ext = file_name.split('.')[-1] if '.' in file_name else ''
        unique_filename = f"{uuid.uuid4()}.{file_ext}" if file_ext else str(uuid.uuid4())
        s3_key = f"uploads/{datetime.now().strftime('%Y/%m/%d')}/{unique_filename}"
        
        content_type = 'audio/wav' if file_ext.lower() == 'wav' else 'application/octet-stream'
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=merged_data,
            ContentType=content_type
        )
        
        file_url = f"https://storage.yandexcloud.net/{bucket_name}/{s3_key}"
        
        print(f"Merged file uploaded: {file_url}")
        
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
        print(f"Merge error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Merge failed: {str(e)}'})
        }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Upload files to S3 with chunked upload support for large files
    Args: event - dict with httpMethod, body (base64 encoded file or merge request)
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
        
        # Проверяем action для merge chunks
        action = body_data.get('action')
        
        if action == 'merge':
            return merge_chunks(body_data)
        
        file_content = body_data.get('file')
        file_name = body_data.get('fileName')
        file_size = body_data.get('fileSize', 0)
        is_chunk = body_data.get('isChunk', False)
        
        print(f"Upload request: fileName={file_name}, fileSize={file_size}, isChunk={is_chunk}")
        
        if not file_content or not file_name:
            print(f"Missing data: file_content={bool(file_content)}, file_name={file_name}")
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing file or fileName'})
            }
        
        if file_size > 100 * 1024 * 1024:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'File size exceeds 100MB limit'})
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
        elif file_ext.lower() == 'mp3':
            content_type = 'audio/mpeg'
        elif file_ext.lower() == 'wav':
            content_type = 'audio/wav'
        elif file_ext.lower() == 'flac':
            content_type = 'audio/flac'
        elif file_ext.lower() == 'm4a':
            content_type = 'audio/mp4'
        
        print(f"Uploading to S3: {s3_key}, size={len(file_bytes)} bytes")
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type
        )
        
        # Формируем публичный URL
        file_url = f"https://storage.yandexcloud.net/{bucket_name}/{s3_key}"
        
        print(f"Upload successful: {file_url}")
        
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
        print(f"Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Upload failed: {str(e)}'})
        }