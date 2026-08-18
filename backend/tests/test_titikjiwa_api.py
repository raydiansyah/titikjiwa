import os
import uuid

import pytest
import requests

BASE_URL = os.environ.get("TEST_BASE_URL", "http://localhost:8001").rstrip("/")


@pytest.fixture(scope="module")
def client():
    return requests.Session()


@pytest.fixture(scope="module")
def member(client):
    email = f"test_{uuid.uuid4().hex[:10]}@example.com"
    r = client.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "TestPass123!", "alias": "Penguji API"})
    assert r.status_code == 200 and r.json()["user"]["role"] == "member"
    return r.json()["user"]


def test_health(client):
    r = client.get(f"{BASE_URL}/api/")
    assert r.status_code == 200 and r.json()["service"] == "titikjiwa"


def test_public_content(client):
    for path, key in [("/api/posts", "title"), ("/api/articles", "title"), ("/api/psychologists", "name")]:
        r = client.get(BASE_URL + path)
        assert r.status_code == 200 and isinstance(r.json(), list)
        assert r.json() and key in r.json()[0]


def test_auth_me_with_cookie(client, member):
    r = client.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 200 and r.json()["email"] == member["email"]


def test_private_journal(client, member):
    r = client.post(f"{BASE_URL}/api/journals", json={"title": "TEST jurnal", "body": "Isi privat", "mood": "Tenang"})
    assert r.status_code == 200
    journal_id = r.json()["id"]
    r = client.get(f"{BASE_URL}/api/journals")
    assert r.status_code == 200 and any(x["id"] == journal_id for x in r.json())


def test_community_interactions(client, member):
    r = client.post(f"{BASE_URL}/api/posts", json={"title": "TEST cerita", "body": "Cerita anonim", "topic": "Uji", "support_type": "Butuh didengarkan", "sensitive": True})
    assert r.status_code == 200
    post = r.json()
    assert post["alias"] == "Anonim" and post["support_type"] == "Butuh didengarkan"
    assert client.post(f"{BASE_URL}/api/posts/{post['id']}/react", json={"type": "hug"}).status_code == 200
    assert client.post(f"{BASE_URL}/api/posts/{post['id']}/comments", json={"body": "Dukungan lembut"}).status_code == 200
    assert client.get(f"{BASE_URL}/api/posts/{post['id']}/comments").status_code == 200
    assert client.post(f"{BASE_URL}/api/posts/{post['id']}/report").status_code == 200
    assert client.post(f"{BASE_URL}/api/posts/{post['id']}/react", json={"type": "tidak-ada"}).status_code == 400


def test_consultation(client, member):
    psychologists = client.get(f"{BASE_URL}/api/psychologists").json()
    r = client.post(f"{BASE_URL}/api/consultations", json={"psychologist_id": psychologists[0]["id"], "preferred_day": "Rabu sore", "note": "TEST konsultasi"})
    assert r.status_code == 200 and r.json()["status"] == "Menunggu konfirmasi"


def test_role_guards(client, member):
    assert client.get(f"{BASE_URL}/api/admin/stats").status_code == 403
    assert client.post(f"{BASE_URL}/api/articles", json={"title": "x", "excerpt": "y", "category": "z"}).status_code == 403


def test_unauthenticated_protection():
    anon = requests.Session()
    assert anon.get(f"{BASE_URL}/api/journals").status_code == 401
    assert anon.post(f"{BASE_URL}/api/posts", json={"title": "x", "body": "x"}).status_code == 401
    assert anon.get(f"{BASE_URL}/api/notifications").status_code == 401
