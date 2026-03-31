"""Временная функция для получения данных из Google Sheets Олимп - возвращает TS-строки"""
import urllib.request
import csv
import io
import json
import re

def esc(s):
    return str(s).replace('\\', '\\\\').replace("'", "\\'")

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}
    
    params = event.get('queryStringParameters') or {}
    fmt = params.get('fmt', 'json')
    offset = int(params.get('offset', '0'))
    limit = int(params.get('limit', '1000'))
    
    url = 'https://docs.google.com/spreadsheets/d/188zpluVqkDq707schK0z1sEgqO0YhbMF7JRMhzz-6qY/export?format=csv'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        content = resp.read().decode('utf-8')
    
    reader = csv.reader(io.StringIO(content))
    rows = list(reader)
    data_rows = rows[1:] if rows else []
    
    result = []
    for row in data_rows[offset:offset+limit]:
        if len(row) >= 2:
            name = row[0].strip() if len(row) > 0 else ''
            phone = re.sub(r'[^\d]', '', row[1]) if len(row) > 1 else ''
            cat = row[2].strip() if len(row) > 2 else ''
            bdate = row[3].strip() if len(row) > 3 else ''
            spent_str = re.sub(r'[^\d]', '', row[4]) if len(row) > 4 else '0'
            spent = int(spent_str) if spent_str else 0
            last_visit = row[5].strip() if len(row) > 5 else ''
            comment = row[6].strip() if len(row) > 6 else ''
            
            if fmt == 'ts':
                result.append(f"  ['{esc(name)}','{phone}','{esc(cat)}','{bdate}',{spent},'{last_visit}','{esc(comment)}'],")
            else:
                result.append([name, phone, cat, bdate, spent, last_visit, comment])
    
    if fmt == 'ts':
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/plain; charset=utf-8'},
            'body': '\n'.join(result)
        }
    
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'rows': result, 'total': len(data_rows), 'returned': len(result)}, ensure_ascii=False)
    }