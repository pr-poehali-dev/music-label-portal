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
    Business: Upload files to S3 (POST multipart) or get presigned URL (GET query params)
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id
    Returns: HTTP response with S3 URL or presigned URL
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # GET: Generate presigned URL for direct S3 upload
    if method == 'GET':
        try:
            params = event.get('queryStringParameters', {}) or {}
            file_name = params.get('fileName', 'unnamed')
            content_type = params.get('contentType', 'application/octet-stream')
            
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
            
            presigned_url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': bucket_name,
                    'Key': s3_key,
                    'ContentType': content_type
                },
                ExpiresIn=3600
            )
            
            file_url = f"https://storage.yandexcloud.net/{bucket_name}/{s3_key}"
            
            print(f"Presigned URL generated: {s3_key}")
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'presignedUrl': presigned_url,
                    'url': file_url,
                    's3Key': s3_key,
                    'fileName': file_name
                })
            }
        except Exception as e:
            print(f"Presigned URL error: {e}")
            import traceback
            traceback.print_exc()
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Presigned URL failed: {str(e)}'})
            }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        headers = event.get('headers', {})
        content_type = headers.get('content-type') or headers.get('Content-Type', '')
        
        # Parse multipart or base64
        if 'multipart/form-data' in content_type:
            body = event.get('body', '')
            is_base64 = event.get('isBase64Encoded', False)
            
            if is_base64:
                body_bytes = base64.b64decode(body)
            else:
                body_bytes = body.encode('utf-8') if isinstance(body, str) else body
            
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
                    'body': json.dumps({'error': 'No file provided'})
                }
            
            file_item = form['file']
            file_data = file_item.file.read()
            file_name = form.getvalue('fileName', file_item.filename)
            
        else:
            # JSON with base64
            body_data = json.loads(event.get('body', '{}'))
            file_b64 = body_data.get('file', '')
            
            if not file_b64:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No file data provided'})
                }
            
            file_name = body_data.get('fileName', 'unnamed')
            
            if ',' in file_b64:
                file_b64 = file_b64.split(',', 1)[1]
            
            file_data = base64.b64decode(file_b64)
        
        # Upload to S3
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
        
        # Generate S3 key
        file_ext = file_name.split('.')[-1] if '.' in file_name else ''
        unique_filename = f"{uuid.uuid4()}.{file_ext}" if file_ext else str(uuid.uuid4())
        s3_key = f"uploads/{datetime.now().strftime('%Y/%m/%d')}/{unique_filename}"
        
        # Detect content type
        if file_ext.lower() in ['jpg', 'jpeg']:
            upload_content_type = 'image/jpeg'
        elif file_ext.lower() == 'png':
            upload_content_type = 'image/png'
        elif file_ext.lower() == 'wav':
            upload_content_type = 'audio/wav'
        elif file_ext.lower() == 'mp3':
            upload_content_type = 'audio/mpeg'
        else:
            upload_content_type = 'application/octet-stream'
        
        print(f"Uploading to S3: {s3_key}, size={len(file_data)} bytes, type={upload_content_type}")
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=file_data,
            ContentType=upload_content_type
        )
        
        file_url = f"https://storage.yandexcloud.net/{bucket_name}/{s3_key}"
        
        print(f"Upload successful: {file_url}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'url': file_url,
                's3Key': s3_key,
                'fileName': file_name,
                'fileSize': len(file_data)
            })
        }
        
    except Exception as e:
        print(f"Upload error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Upload failed: {str(e)}'})
        }