import os, uuid, requests
from pathlib import Path
from dotenv import dotenv_values
import pytest
BASE_URL = dotenv_values('/app/frontend/.env')['REACT_APP_BACKEND_URL'].rstrip('/')
ADMIN_EMAIL = dotenv_values('/app/memory/test_credentials.md') if False else 'admin@sintesis.id'

@pytest.fixture(scope='module')
def client():
    return requests.Session()

@pytest.fixture(scope='module')
def member(client):
    email=f"test_{uuid.uuid4().hex[:10]}@example.com"
    r=client.post(f'{BASE_URL}/api/auth/register',json={'email':email,'password':'TestPass123!','alias':'Penguji API'})
    assert r.status_code == 200 and r.json()['user']['role']=='member'
    client.headers.update({'Authorization':f"Bearer {r.json()['token']}"})
    return r.json()['user']

def test_public_content(client):
    for path, key in [('/api/posts', 'title'),('/api/articles','title'),('/api/psychologists','name')]:
        r=client.get(BASE_URL+path); assert r.status_code==200 and isinstance(r.json(),list)
        assert r.json() and key in r.json()[0]

def test_auth_and_private_journal(client, member):
    r=client.get(BASE_URL+'/api/auth/me'); assert r.status_code==200 and r.json()['email']==member['email']
    r=client.post(BASE_URL+'/api/journals',json={'title':'TEST jurnal','body':'Isi privat','mood':'Tenang'}); assert r.status_code==200
    journal_id=r.json()['id']; r=client.get(BASE_URL+'/api/journals'); assert r.status_code==200 and any(x['id']==journal_id for x in r.json())

def test_community_interactions(client, member):
    r=client.post(BASE_URL+'/api/posts',json={'title':'TEST cerita','body':'Cerita anonim','topic':'Uji','sensitive':True}); assert r.status_code==200
    p=r.json(); assert p['alias']=='Anonim'
    assert client.post(BASE_URL+f"/api/posts/{p['id']}/support").status_code==200
    assert client.post(BASE_URL+f"/api/posts/{p['id']}/comments",json={'body':'Dukungan lembut'}).status_code==200
    assert client.get(BASE_URL+f"/api/posts/{p['id']}/comments").status_code==200
    assert client.post(BASE_URL+f"/api/posts/{p['id']}/report").status_code==200

def test_consultation(client, member):
    ps=client.get(BASE_URL+'/api/psychologists').json(); r=client.post(BASE_URL+'/api/consultations',json={'psychologist_id':ps[0]['id'],'preferred_day':'Rabu sore','note':'TEST konsultasi'})
    assert r.status_code==200 and r.json()['status']

def test_unauthenticated_protection():
    c=requests.Session();
    for path in ['/api/journals','/api/posts']:
        r=c.get(BASE_URL+path) if path.endswith('journals') else c.post(BASE_URL+path,json={'title':'x','body':'x'})
        assert r.status_code==401
