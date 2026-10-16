"""End-to-end smoke test of the deployed backend (Supabase project linked to this repo).

Creates a throwaway user, exercises signup, balances, payments, avatar storage rules and the
delete-account function, then deletes the user. Prints results only, never keys or tokens.

    SUPABASE_ACCESS_TOKEN=... python3 -I scripts/smoke-backend.py

The access token (supabase.com → Account → Access Tokens) is used to read the project's API keys.
Exits non-zero when a check fails.
"""
import json, os, sys, time, urllib.request, urllib.error, secrets

REF = os.environ.get('SUPABASE_PROJECT_REF', 'pqddrakkvkvfewnmxqzj')
URL = f'https://{REF}.supabase.co'
MGMT = os.environ['SUPABASE_ACCESS_TOKEN']

def req(method, url, headers=None, body=None, raw=None, ctype='application/json'):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    r = urllib.request.Request(url, data=data, method=method, headers={**({'Content-Type': ctype} if data else {}), **(headers or {})})
    try:
        with urllib.request.urlopen(r) as resp:
            payload = resp.read()
            try: return resp.status, json.loads(payload.decode() or 'null')
            except (UnicodeDecodeError, ValueError): return resp.status, payload
    except urllib.error.HTTPError as e:
        text = e.read().decode()
        try: return e.code, json.loads(text)
        except Exception: return e.code, text

ok_count = 0
failures = 0
def check(cond, msg, detail=None):
    global ok_count
    global failures
    if cond:
        ok_count += 1
        print('ok   -', msg)
    else:
        failures += 1
        print('FAIL -', msg, '' if detail is None else f'-> {detail}')

_, keys = req('GET', f'https://api.supabase.com/v1/projects/{REF}/api-keys?reveal=true', {'Authorization': f'Bearer {MGMT}'})
pub = next(k['api_key'] for k in keys if k.get('type') == 'publishable')
sec = next(k['api_key'] for k in keys if k.get('type') == 'secret')
admin = {'apikey': sec}

# Avatar folders whose user no longer exists (e.g. left by an aborted run) are removed first.
s, folders = req('POST', f'{URL}/storage/v1/object/list/avatars', admin, {'prefix': '', 'limit': 1000})
for f in folders if s == 200 else []:
    if req('GET', f"{URL}/auth/v1/admin/users/{f['name']}", admin)[0] == 404:
        s2, files = req('POST', f'{URL}/storage/v1/object/list/avatars', admin, {'prefix': f['name'], 'limit': 1000})
        paths = [f"{f['name']}/{x['name']}" for x in files]
        if paths:
            req('DELETE', f'{URL}/storage/v1/object/avatars', admin, {'prefixes': paths})
            print(f'cleanup: removed {len(paths)} orphaned avatar file(s)')

email = f'smoke-{int(time.time())}@example.com'
password = secrets.token_urlsafe(16)
s, u = req('POST', f'{URL}/auth/v1/admin/users', admin, {
    'email': email, 'password': password, 'email_confirm': True,
    'user_metadata': {'full_name': 'Smoke Test', 'currency': 'EUR', 'timezone': 'Europe/Berlin', 'locale': 'en', 'wallet_names': ['Cash', 'Bank']}})
check(s == 200, 'admin creates a confirmed test user', s)
uid = u['id']
try:
    s, tok = req('POST', f'{URL}/auth/v1/token?grant_type=password', {'apikey': pub}, {'email': email, 'password': password})
    check(s == 200, 'password sign-in with the publishable key', s)
    H = {'apikey': pub, 'Authorization': f"Bearer {tok['access_token']}"}
    rest = f'{URL}/rest/v1'

    s, prof = req('GET', f'{rest}/profiles?select=currency,timezone,locale,full_name', H)
    check(s == 200 and prof == [{'currency': 'EUR', 'timezone': 'Europe/Berlin', 'locale': 'en', 'full_name': 'Smoke Test'}], 'signup trigger stores the profile with region', prof)
    s, wallets = req('GET', f'{rest}/wallets?select=id,name,is_default,balance&order=is_default.desc', H)
    check(s == 200 and [w['name'] for w in wallets] == ['Cash', 'Bank'], 'signup trigger creates localized default wallets', wallets)
    cash = wallets[0]['id']

    s, e = req('POST', f'{rest}/transactions', H, {'user_id': uid, 'wallet_id': cash, 'amount': 30, 'type': 'expense', 'category': 'food', 'date': '2026-10-16T10:00:00Z'})
    check(s == 400 and isinstance(e, dict) and e.get('code') == '23514', 'an expense larger than the balance is rejected (23514)', (s, e))
    s, _ = req('POST', f'{rest}/transactions', H, {'user_id': uid, 'wallet_id': cash, 'amount': 100, 'type': 'income', 'category': 'job', 'date': '2026-10-16T10:00:00Z'})
    check(s == 201, 'income is recorded', s)
    s, _ = req('POST', f'{rest}/transactions', H, {'user_id': uid, 'wallet_id': cash, 'amount': 30, 'type': 'expense', 'category': 'food', 'date': '2026-10-16T11:00:00Z'})
    check(s == 201, 'expense within the balance is recorded', s)
    s, w = req('GET', f'{rest}/wallets?id=eq.{cash}&select=balance', H)
    check(w and float(w[0]['balance']) == 70, 'the trigger keeps the wallet balance (100 - 30 = 70)', w)

    s, pay = req('POST', f'{rest}/upcoming_payments', {**H, 'Prefer': 'return=representation'}, {'user_id': uid, 'name': 'Rent', 'amount': 50, 'due_date': '2026-10-20'})
    check(s == 201, 'a payment is created', s)
    s, _ = req('POST', f'{rest}/rpc/mark_payment_paid', H, {'p_payment_id': pay[0]['id'], 'p_wallet_id': cash, 'p_date': '2026-10-16T12:00:00Z'})
    check(s == 200, 'mark_payment_paid records the expense', s)
    s, w = req('GET', f'{rest}/wallets?id=eq.{cash}&select=balance', H)
    check(w and float(w[0]['balance']) == 20, 'paying takes it from the wallet (70 - 50 = 20)', w)
    s, summary = req('POST', f'{rest}/rpc/get_monthly_summary', H, {'p_start': '2026-10-01T00:00:00Z', 'p_end': '2026-11-01T00:00:00Z'})
    check(s == 200 and float(summary[0]['expense_total']) == 80 and float(summary[0]['fixed_expenses_paid']) == 50, 'monthly summary counts the paid bill as a fixed expense', summary)

    img = b'\xff\xd8\xff\xe0' + b'0' * 64 + b'\xff\xd9'
    s, _ = req('POST', f'{URL}/storage/v1/object/avatars/{uid}/smoke.jpg', H, raw=img, ctype='image/jpeg')
    check(s == 200, 'the user uploads an avatar into their folder', s)
    s, _ = req('POST', f'{URL}/storage/v1/object/avatars/00000000-0000-0000-0000-000000000000/x.jpg', H, raw=img, ctype='image/jpeg')
    check(s in (400, 403), 'uploading into another folder is refused', s)
    s, _ = req('GET', f'{URL}/storage/v1/object/public/avatars/{uid}/smoke.jpg')
    check(s == 200, 'the avatar is readable through its public URL', s)

    s, res = req('POST', f'{URL}/functions/v1/delete-account', H)
    check(s == 200 and res == {'ok': True}, 'delete-account deletes the account', (s, res))
    # The public URL may still be served from the CDN cache for a while; ask storage directly.
    s, files = req('POST', f'{URL}/storage/v1/object/list/avatars', admin, {'prefix': uid, 'limit': 100})
    check(s == 200 and files == [], 'the avatar file is removed from storage', (s, files))
    s, _ = req('POST', f'{URL}/auth/v1/token?grant_type=password', {'apikey': pub}, {'email': email, 'password': password})
    check(s == 400, 'the deleted user can no longer sign in', s)
    s, left = req('GET', f'{rest}/wallets?user_id=eq.{uid}&select=id', admin)
    check(s == 200 and left == [], 'their rows are gone (cascade)', (s, left))
finally:
    if req('GET', f'{URL}/auth/v1/admin/users/{uid}', admin)[0] == 200:
        s, _ = req('DELETE', f'{URL}/auth/v1/admin/users/{uid}', admin)
        print('cleanup: test user deleted' if s == 200 else f'cleanup FAILED ({s}): delete {email} by hand')
print(f'{ok_count} checks passed, {failures} failed')
sys.exit(1 if failures else 0)
