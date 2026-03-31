import json
import os
import secrets
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p77908769_fitness_crm_system')

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Сохранение/загрузка состояния CRM.
    GET  ?action=state         — загрузить всё
    POST ?action=state         — сохранить всё (полный state)
    POST ?action=patch         — обновить только указанные поля (patch)
    GET/POST ?action=token     — токен доступа
    """
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'state')

    conn = get_conn()
    cur = conn.cursor()

    try:
        if action == 'state':
            if method == 'GET':
                cur.execute(f"SELECT data FROM {SCHEMA}.crm_state WHERE id = 'main'")
                row = cur.fetchone()
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({'ok': True, 'data': row[0] if row else None})}

            if method == 'POST':
                body = json.loads(event.get('body') or '{}')
                data = body.get('data')
                if data is None:
                    return {'statusCode': 400, 'headers': cors,
                            'body': json.dumps({'ok': False, 'error': 'no data'})}
                data_json = json.dumps(data, ensure_ascii=False).replace("'", "''")
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.crm_state (id, data, updated_at)
                        VALUES ('main', '{data_json}'::jsonb, NOW())
                        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()"""
                )
                conn.commit()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        if action == 'patch':
            if method == 'POST':
                body = json.loads(event.get('body') or '{}')
                patch = body.get('patch')
                if not patch or not isinstance(patch, dict):
                    return {'statusCode': 400, 'headers': cors,
                            'body': json.dumps({'ok': False, 'error': 'no patch'})}
                patch_json = json.dumps(patch, ensure_ascii=False).replace("'", "''")
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.crm_state (id, data, updated_at)
                        VALUES ('main', '{patch_json}'::jsonb, NOW())
                        ON CONFLICT (id) DO UPDATE
                          SET data = {SCHEMA}.crm_state.data || '{patch_json}'::jsonb,
                              updated_at = NOW()"""
                )
                conn.commit()
                return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

        if action == 'token':
            if method == 'GET':
                cur.execute(f"SELECT token FROM {SCHEMA}.crm_access_token WHERE id = 'main'")
                row = cur.fetchone()
                if not row:
                    token = secrets.token_urlsafe(24)
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.crm_access_token (id, token) VALUES ('main', '{token}')"
                    )
                    conn.commit()
                else:
                    token = row[0]
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({'ok': True, 'token': token})}

            if method == 'POST':
                token = secrets.token_urlsafe(24)
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.crm_access_token (id, token, updated_at)
                        VALUES ('main', '{token}', NOW())
                        ON CONFLICT (id) DO UPDATE SET token = EXCLUDED.token, updated_at = NOW()"""
                )
                conn.commit()
                return {'statusCode': 200, 'headers': cors,
                        'body': json.dumps({'ok': True, 'token': token})}

    finally:
        cur.close()
        conn.close()

    return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'unknown action'})}
