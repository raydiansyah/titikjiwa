"""
Module: Titikjiwa API server
Purpose: Serve authentication, journaling, community, and mental-health support APIs
Used by: frontend/src/App.js and authenticated client routes
Dependencies: FastAPI, MongoDB/Motor, JWT, bcrypt, Resend
Public functions: auth endpoints, workspace endpoints, custom CAPTCHA endpoints
Side effects: Reads/writes MongoDB, sets auth cookies, creates one-time CAPTCHA challenges
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator
from typing import List, Optional
import os
import logging
import uuid
import secrets
import time
from collections import defaultdict, deque
import asyncio
import json
import re
import jwt
import bcrypt
import resend
from pymongo.errors import DuplicateKeyError
from datetime import datetime, timezone, timedelta


mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
resend.api_key = os.environ.get("RESEND_API_KEY", "")

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

class InMemoryRateLimiter:
    """Per-process sliding-window limiter; use Redis for multi-instance deployments."""
    def __init__(self):
        self.events = defaultdict(deque)
        self.lock = asyncio.Lock()

    async def hit(self, key: str, limit: int, window: int):
        now = time.monotonic()
        async with self.lock:
            bucket = self.events[key]
            while bucket and bucket[0] <= now - window:
                bucket.popleft()
            if len(bucket) >= limit:
                retry_after = max(1, int(bucket[0] + window - now))
                return False, retry_after
            bucket.append(now)
            return True, 0

rate_limiter = InMemoryRateLimiter()

@app.middleware("http")
async def request_rate_limit(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
    path = request.url.path
    if path in {"/api/auth/login", "/api/auth/register", "/api/auth/captcha", "/api/auth/forgot-password", "/api/auth/reset-password"}:
        limit, window, group = 10, 60, "auth"
    elif path.startswith("/api/ai/"):
        limit, window, group = 20, 60, "ai"
    else:
        limit, window, group = 120, 60, "api"
    allowed, retry_after = await rate_limiter.hit(f"{ip}:{group}", limit, window)
    if not allowed:
        return JSONResponse(status_code=429, content={"detail": "Terlalu banyak permintaan. Coba lagi sebentar."}, headers={"Retry-After": str(retry_after)})
    return await call_next(request)


JWT_ALGORITHM = "HS256"

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    alias: str = Field(min_length=2, max_length=30)
    captcha_id: str = Field(min_length=16, max_length=128)
    captcha_answer: str = Field(min_length=1, max_length=16)

    @field_validator("alias", "captcha_id", "captcha_answer")
    @classmethod
    def reject_blank_values(cls, value):
        value = value.strip()
        if not value or any(ord(char) < 32 for char in value):
            raise ValueError("Nilai tidak boleh kosong atau mengandung karakter kontrol.")
        return value

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class JournalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=5000)
    mood: str = "Netral"

    @field_validator("title", "body", "mood")
    @classmethod
    def validate_journal_text(cls, value):
        value = value.strip()
        if not value or any(ord(char) < 32 and char not in "\n\t" for char in value):
            raise ValueError("Teks jurnal tidak valid.")
        if value.count("\n") > 100:
            raise ValueError("Teks jurnal terlalu banyak baris.")
        return value

class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=140)
    body: str = Field(min_length=1, max_length=5000)
    topic: str = "Perjalanan pulih"
    support_type: str = "Butuh didengarkan"
    sensitive: bool = False

    @field_validator("title", "body", "topic", "support_type")
    @classmethod
    def validate_post_text(cls, value):
        value = value.strip()
        if not value or any(ord(char) < 32 and char not in "\n\t" for char in value):
            raise ValueError("Isi cerita tidak valid.")
        return value

class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=800)

    @field_validator("body")
    @classmethod
    def validate_comment(cls, value):
        value = value.strip()
        if not value or any(ord(char) < 32 and char not in "\n\t" for char in value):
            raise ValueError("Komentar tidak valid.")
        return value

class ConsultationCreate(BaseModel):
    psychologist_id: str
    preferred_day: str
    note: str = Field(min_length=1, max_length=1000)

    @field_validator("psychologist_id", "preferred_day", "note")
    @classmethod
    def validate_consultation_text(cls, value):
        value = value.strip()
        if not value or any(ord(char) < 32 and char not in "\n\t" for char in value):
            raise ValueError("Data konsultasi tidak valid.")
        return value

class ForgotPasswordInput(BaseModel):
    email: EmailStr

class ResetPasswordInput(BaseModel):
    token: str
    password: str = Field(min_length=8)

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def public_user(user):
    return {"id": user["id"], "email": user["email"], "alias": user["alias"], "role": user.get("role", "member"), "psychologist_id": user.get("psychologist_id")}

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user):
    return jwt.encode({"sub": user["id"], "email": user["email"], "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

def create_refresh_token(user):
    return jwt.encode({"sub": user["id"], "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, user):
    secure = os.environ.get("FRONTEND_URL", "").startswith("https")
    samesite = "none" if secure else "lax"
    response.set_cookie("access_token", create_access_token(user), httponly=True, secure=secure, samesite=samesite, max_age=900, path="/")
    response.set_cookie("refresh_token", create_refresh_token(user), httponly=True, secure=secure, samesite=samesite, max_age=604800, path="/")

async def current_user(request: Request):
    header = request.headers.get("Authorization", "")
    token = request.cookies.get("access_token") or (header[7:] if header.startswith("Bearer ") else None)
    if not token:
        raise HTTPException(status_code=401, detail="Silakan masuk untuk melanjutkan.")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Sesi tidak ditemukan.")
        if user.get("disabled"):
            raise HTTPException(status_code=401, detail="Akun ini sedang dinonaktifkan.")
        return user
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Sesi sudah berakhir.") from exc

def require_roles(*roles):
    async def checker(user=Depends(current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Kamu tidak punya akses ke halaman ini.")
        return user
    return checker

require_admin = require_roles("admin")

async def seed_content():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.captcha_challenges.create_index("expires_at", expireAfterSeconds=0)
    await db.reactions.create_index([("post_id", 1), ("user_id", 1), ("type", 1)], unique=True)
    await db.reports.create_index([("post_id", 1), ("user_id", 1)], unique=True)
    await db.profiles.create_index("user_id", unique=True)
    await db.aura_history.create_index([("user_id", 1), ("week_key", 1)], unique=True)
    await db.weekly_insights.create_index([("user_id", 1), ("week_key", 1)], unique=True)
    owner_email = os.environ.get("OWNER_EMAIL", os.environ.get("ADMIN_EMAIL", "raydiansyah@gmail.com")).lower()
    owner_password = os.environ.get("OWNER_PASSWORD") or os.environ["ADMIN_PASSWORD"]
    owner = await db.users.find_one({"email": owner_email}, {"_id": 0})
    if owner is None:
        await db.users.insert_one({"id": str(uuid.uuid4()), "email": owner_email, "password_hash": hash_password(owner_password), "alias": "Tim titikjiwa", "role": "admin", "created_at": now_iso()})
    elif not verify_password(owner_password, owner["password_hash"]):
        await db.users.update_one({"email": owner_email}, {"$set": {"password_hash": hash_password(owner_password)}})
    psy_email = os.environ.get("PSY_EMAIL")
    if psy_email and await db.users.find_one({"email": psy_email}, {"_id": 0}) is None:
        await db.users.insert_one({"id": str(uuid.uuid4()), "email": psy_email, "password_hash": hash_password(os.environ["PSY_PASSWORD"]), "alias": "dr. Maya Pradipta", "role": "psikolog", "psychologist_id": "psy-maya", "created_at": now_iso()})
    if await db.posts.count_documents({}) == 0:
        await db.posts.insert_many([
            {"id": "post-batas", "title": "Belajar berkata tidak tanpa rasa bersalah", "body": "Dulu saya mengira menjaga diri berarti mengecewakan orang lain. Pelan-pelan saya belajar bahwa batasan adalah bentuk kasih pada diri sendiri.", "topic": "Batasan diri", "alias": "Ruang Teduh", "sensitive": False, "support_count": 42, "comment_count": 6, "created_at": now_iso()},
            {"id": "post-pelan", "title": "Tidak apa-apa pulih dengan pelan", "body": "Ada hari ketika saya hanya mampu mandi dan makan. Ternyata langkah kecil tetap layak dirayakan.", "topic": "Proses pulih", "alias": "Langkah Kecil", "sensitive": False, "support_count": 28, "comment_count": 3, "created_at": now_iso()},
            {"id": "post-luka", "title": "Tentang rumah yang tidak selalu terasa aman", "body": "Saya menulis ini dengan hati-hati. Bertahun-tahun saya belajar mengenali bahwa pengalaman masa kecil memang bisa terbawa sampai dewasa.", "topic": "Masa kecil", "alias": "Anonim", "sensitive": True, "support_count": 19, "comment_count": 4, "created_at": now_iso()},
        ])
    if await db.articles.count_documents({}) == 0:
        await db.articles.insert_many([
            {"id": "article-grounding", "title": "5 cara grounding saat ingatan terasa berat", "excerpt": "Kembali ke saat ini dengan langkah kecil yang bisa dilakukan dalam lima menit.", "category": "Regulasi emosi", "author": "dr. Maya Pradipta", "verified": True, "read_time": "6 menit", "created_at": now_iso()},
            {"id": "article-batas", "title": "Membangun batasan tanpa kehilangan diri", "excerpt": "Batasan bukan tembok. Ia adalah cara memberi tahu dunia bagaimana kita ingin diperlakukan.", "category": "Relasi sehat", "author": "Psikolog Raka Anindya", "verified": True, "read_time": "8 menit", "created_at": now_iso()},
            {"id": "article-jurnal", "title": "Jurnal reflektif: mulai dari satu kalimat", "excerpt": "Tidak perlu menulis sempurna untuk bisa mendengar isi hati sendiri.", "category": "Jurnal", "author": "Tim titikjiwa", "verified": True, "read_time": "4 menit", "created_at": now_iso()},
        ])
    if await db.psychologists.count_documents({}) == 0:
        await db.psychologists.insert_many([
            {"id": "psy-maya", "name": "dr. Maya Pradipta, M.Psi.", "specialty": "Trauma & regulasi emosi", "city": "Online", "availability": "Senin–Kamis", "bio": "Mendampingi proses pulih dengan pendekatan yang pelan, aman, dan berpusat pada pengalamanmu.", "initials": "MP", "verified": True},
            {"id": "psy-raka", "name": "Psikolog Raka Anindya, M.Psi.", "specialty": "Relasi & batasan diri", "city": "Online", "availability": "Selasa–Sabtu", "bio": "Membantu memahami pola relasi dan membangun batasan yang terasa realistis.", "initials": "RA", "verified": True},
        ])

@app.on_event("startup")
async def startup():
    await seed_content()

@api_router.get("/")
async def root():
    return {"message": "titikjiwa API aktif", "service": "titikjiwa"}

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
@api_router.get("/auth/captcha")
async def create_captcha():
    first = secrets.randbelow(9) + 2
    second = secrets.randbelow(9) + 2
    operation = secrets.choice(["+", "−"])
    answer = first + second if operation == "+" else first - second
    challenge_id = secrets.token_urlsafe(24)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    await db.captcha_challenges.insert_one({"id": challenge_id, "answer": str(answer), "expires_at": expires_at})
    return {"id": challenge_id, "question": f"Berapa {first} {operation} {second}?", "expires_at": expires_at.isoformat()}

async def verify_captcha(challenge_id: str, answer: str):
    challenge = await db.captcha_challenges.find_one_and_delete({"id": challenge_id, "expires_at": {"$gt": datetime.now(timezone.utc)}})
    if not challenge or not secrets.compare_digest(str(challenge["answer"]), answer.strip()):
        raise HTTPException(status_code=400, detail="CAPTCHA salah atau sudah kedaluwarsa. Silakan minta soal baru.")

async def check_lockout(identifier: str):
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt and attempt.get("count", 0) >= MAX_FAILED_ATTEMPTS:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.")

async def record_failed_attempt(identifier: str):
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    count = (attempt.get("count", 0) if attempt else 0) + 1
    update = {"count": count}
    if count >= MAX_FAILED_ATTEMPTS:
        update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
    await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)

@api_router.post("/auth/register")
async def register(payload: UserCreate, request: Request, response: Response):
    await verify_captcha(payload.captcha_id, payload.captcha_answer)
    email = payload.email.lower()
    user = {"id": str(uuid.uuid4()), "email": email, "password_hash": hash_password(payload.password), "alias": payload.alias.strip(), "role": "member", "created_at": now_iso()}
    try:
        await db.users.insert_one(user)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="Email sudah terdaftar.") from exc
    set_auth_cookies(response, user)
    return {"user": public_user(user)}

@api_router.post("/auth/login")
async def login(payload: LoginInput, request: Request, response: Response):
    email = payload.email.lower()
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    identifier = f"{forwarded or request.client.host}:{email}"
    await check_lockout(identifier)
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Email atau kata sandi belum tepat.")
    if user.get("disabled"):
        raise HTTPException(status_code=403, detail="Akun ini sedang dinonaktifkan.")
    await db.login_attempts.delete_one({"identifier": identifier})
    await db.users.update_one({"id": user["id"]}, {"$set": {"prev_seen_at": user.get("last_seen_at"), "last_seen_at": now_iso()}})
    set_auth_cookies(response, user)
    return {"user": public_user(user)}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/", secure=True, samesite="none")
    response.delete_cookie("refresh_token", path="/", secure=True, samesite="none")
    return {"ok": True}

@api_router.post("/auth/refresh")
async def refresh_session(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Sesi tidak ditemukan.")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token tidak valid.")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Sesi sudah berakhir.") from exc
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Pengguna tidak ditemukan.")
    response.set_cookie("access_token", create_access_token(user), httponly=True, secure=True, samesite="none", max_age=900, path="/")
    return {"ok": True}

@api_router.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordInput):
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token,
            "user_id": user["id"],
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": False,
        })
        reset_link = f"{os.environ['FRONTEND_URL']}/atur-ulang?token={token}"
        if resend.api_key:
            html = (
                '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;padding:40px 0;">'
                '<tr><td align="center"><table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e0d8;padding:40px 36px;">'
                '<tr><td style="font-family:Georgia,serif;font-size:22px;color:#2b3a33;padding-bottom:14px;">Atur ulang kata sandimu</td></tr>'
                '<tr><td style="font-family:Arial,sans-serif;font-size:13px;line-height:1.7;color:#5d6b63;padding-bottom:26px;">Kami menerima permintaan pemulihan untuk akun titikjiwa kamu. Tautan ini berlaku satu jam dan hanya bisa dipakai sekali.</td></tr>'
                f'<tr><td style="padding-bottom:26px;"><a href="{reset_link}" style="background:#4a6b5d;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;padding:13px 22px;display:inline-block;">Buat kata sandi baru</a></td></tr>'
                '<tr><td style="font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:#87938a;">Jika kamu tidak meminta ini, abaikan email ini. Ruangmu tetap aman.</td></tr>'
                '</table></td></tr></table>'
            )
            try:
                await asyncio.to_thread(resend.Emails.send, {"from": f"titikjiwa <{os.environ['SENDER_EMAIL']}>", "to": [user["email"]], "subject": "Atur ulang kata sandi titikjiwa", "html": html})
            except Exception as exc:
                logger.error("Gagal mengirim email pemulihan: %s", exc)
        else:
            logger.info("Tautan reset kata sandi untuk %s: %s", user["email"], reset_link)
    return {"ok": True, "message": "Jika email terdaftar, tautan pemulihan akan dikirim."}

@api_router.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordInput):
    result = await db.password_reset_tokens.update_one(
        {"token": payload.token, "used": False, "expires_at": {"$gt": datetime.now(timezone.utc)}},
        {"$set": {"used": True, "used_at": now_iso()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Tautan pemulihan tidak valid atau sudah kedaluwarsa.")
    record = await db.password_reset_tokens.find_one({"token": payload.token}, {"_id": 0, "user_id": 1})
    if not record:
        raise HTTPException(status_code=400, detail="Tautan pemulihan tidak valid atau sudah kedaluwarsa.")
    await db.users.update_one({"id": record["user_id"]}, {"$set": {"password_hash": hash_password(payload.password)}})
    await db.refresh_tokens.delete_many({"user_id": record["user_id"]})
    return {"ok": True, "message": "Kata sandi berhasil diperbarui."}

@api_router.get("/auth/me")
async def me(user=Depends(current_user)):
    return public_user(user)

@api_router.get("/journals")
async def journals(user=Depends(current_user)):
    return await db.journals.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/journals")
async def create_journal(payload: JournalCreate, user=Depends(current_user)):
    entry = {"id": str(uuid.uuid4()), "user_id": user["id"], "title": payload.title.strip(), "body": payload.body.strip(), "mood": payload.mood, "created_at": now_iso()}
    await db.journals.insert_one(entry)
    return {key: entry[key] for key in ("id", "title", "body", "mood", "created_at")}

REACTION_TYPES = ("hug", "strength", "relate")

@api_router.get("/posts")
async def posts():
    items = await db.posts.find({}, {"_id": 0, "author_id": 0}).sort("created_at", -1).to_list(100)
    for item in items:
        item.setdefault("reactions", {"hug": item.get("support_count", 0), "strength": 0, "relate": 0})
        item.setdefault("support_type", "Butuh didengarkan")
    return items

@api_router.post("/posts")
async def create_post(payload: PostCreate, user=Depends(current_user)):
    post = {"id": str(uuid.uuid4()), "title": payload.title.strip(), "body": payload.body.strip(), "topic": payload.topic, "support_type": payload.support_type, "alias": "Anonim", "sensitive": payload.sensitive, "support_count": 0, "reactions": {"hug": 0, "strength": 0, "relate": 0}, "comment_count": 0, "created_at": now_iso(), "author_id": user["id"]}
    await db.posts.insert_one(post)
    return {key: post[key] for key in post if key not in ("author_id", "_id")}

class ReactInput(BaseModel):
    type: str

    @field_validator("type")
    @classmethod
    def validate_reaction_type(cls, value):
        value = value.strip()
        if value not in REACTION_TYPES:
            raise ValueError("Reaksi tidak dikenal.")
        return value

@api_router.post("/posts/{post_id}/react")
async def react_post(post_id: str, payload: ReactInput, user=Depends(current_user)):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0, "author_id": 1, "title": 1})
    if not post:
        raise HTTPException(status_code=404, detail="Cerita tidak ditemukan.")
    try:
        await db.reactions.insert_one({"post_id": post_id, "user_id": user["id"], "type": payload.type, "created_at": now_iso()})
    except DuplicateKeyError:
        return {"ok": True, "duplicate": True}
    await db.posts.update_one({"id": post_id}, {"$inc": {f"reactions.{payload.type}": 1}})
    if post.get("author_id") and post["author_id"] != user["id"]:
        label = {"hug": "Pelukan", "strength": "Kekuatan", "relate": "Aku paham"}[payload.type]
        await db.notifications.insert_one({"id": str(uuid.uuid4()), "user_id": post["author_id"], "text": f"Seseorang mengirim {label} untuk ceritamu \u201c{post['title'][:60]}\u201d.", "read": False, "created_at": now_iso()})
    return {"ok": True}

class EmergencyContactInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=3, max_length=20)

    @field_validator("name", "phone")
    @classmethod
    def validate_contact(cls, value):
        value = value.strip()
        if not value or any(ord(char) < 32 for char in value):
            raise ValueError("Kontak tidak valid.")
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value):
        if not re.fullmatch(r"[0-9+() .-]{3,20}", value):
            raise ValueError("Nomor telepon tidak valid.")
        return value

@api_router.post("/emergency-contact")
async def save_emergency_contact(payload: EmergencyContactInput, user=Depends(current_user)):
    contact = {"name": payload.name.strip(), "phone": payload.phone.strip()}
    await db.profiles.update_one({"user_id": user["id"]}, {"$set": {"emergency_contact": contact, "updated_at": now_iso()}}, upsert=True)
    return contact

@api_router.get("/emergency-contact")
async def get_emergency_contact(user=Depends(current_user)):
    profile = await db.profiles.find_one({"user_id": user["id"]}, {"_id": 0, "emergency_contact": 1})
    if not profile or not profile.get("emergency_contact"):
        raise HTTPException(status_code=404, detail="Belum ada kontak kepercayaan.")
    return profile["emergency_contact"]

def last_seen_text(iso):
    if not iso:
        return None
    try:
        delta = datetime.now(timezone.utc) - datetime.fromisoformat(iso)
    except ValueError:
        return None
    days = delta.days
    if days <= 0:
        return "hari ini"
    if days == 1:
        return "kemarin"
    if days < 30:
        return f"{days} hari yang lalu"
    return f"{days // 30} bulan yang lalu"

AURA_PALETTE = {"Tenang": "#4a6b5d", "Berharap": "#c98a66", "Bingung": "#c2a686", "Berat": "#6b7c8a", "Netral": "#b5aca0"}
AURA_NAME = {"Tenang": "Air yang Tenang", "Berharap": "Fajar Bersemi", "Bingung": "Kabut Pagi", "Berat": "Mendung yang Jujur", "Netral": "Tanah Lapang"}
AURA_DESC = {
    "Tenang": "Ketenangan mendominasi catatanmu. Pertahankan ritual kecil yang menopangnya.",
    "Berharap": "Ada cahaya yang tumbuh dalam tulisanmu. Harapanmu mulai berakar.",
    "Bingung": "Kabut berarti kamu sedang bergerak. Pelan-pelan, arah akan tampak.",
    "Berat": "Bebanmu nyata, dan kamu tetap memilih menulis. Itu keberanian.",
    "Netral": "Ketenangan netral adalah tanah lapang yang siap ditumbuhi.",
}

@api_router.get("/me/aura")
async def my_aura(user=Depends(current_user)):
    entries = await db.journals.find({"user_id": user["id"]}, {"_id": 0, "mood": 1}).to_list(200)
    counts = {}
    for entry in entries:
        counts[entry["mood"]] = counts.get(entry["mood"], 0) + 1
    ordered = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
    if not ordered:
        aura = {"name": "Embun Pagi", "colors": ["#4a6b5d", "#c2a686", "#e9e2d2"], "description": "Ruangmu masih baru — aura lembut ini siap berubah mengikuti perjalananmu."}
    else:
        colors = [AURA_PALETTE[mood] for mood, _ in ordered[:3] if mood in AURA_PALETTE] or ["#4a6b5d"]
        if len(colors) == 1:
            colors.append("#e9e2d2")
        dominant = ordered[0][0]
        aura = {"name": AURA_NAME.get(dominant, "Embun Pagi"), "colors": colors, "description": AURA_DESC.get(dominant, "")}
    week_key = datetime.now(timezone.utc).strftime("%G-W%V")
    await db.aura_history.update_one({"user_id": user["id"], "week_key": week_key}, {"$set": {**aura, "created_at": now_iso()}}, upsert=True)
    return {**aura, "journals": len(entries), "last_seen": last_seen_text(user.get("prev_seen_at")), "week_key": week_key}

@api_router.get("/me/aura/history")
async def aura_history(user=Depends(current_user)):
    return await db.aura_history.find({"user_id": user["id"]}, {"_id": 0, "user_id": 0}).sort("week_key", -1).to_list(24)

class SafetyPlanInput(BaseModel):
    signs: str = Field(min_length=1, max_length=300)
    strategies: str = Field(min_length=1, max_length=300)
    helpers: str = Field(min_length=1, max_length=300)

@api_router.post("/safety-plan")
async def save_safety_plan(payload: SafetyPlanInput, user=Depends(current_user)):
    plan = {"signs": payload.signs.strip(), "strategies": payload.strategies.strip(), "helpers": payload.helpers.strip()}
    await db.profiles.update_one({"user_id": user["id"]}, {"$set": {"safety_plan": plan, "updated_at": now_iso()}}, upsert=True)
    return plan

@api_router.get("/safety-plan")
async def get_safety_plan(user=Depends(current_user)):
    profile = await db.profiles.find_one({"user_id": user["id"]}, {"_id": 0, "safety_plan": 1})
    if not profile or not profile.get("safety_plan"):
        raise HTTPException(status_code=404, detail="Belum ada rencana aman.")
    return profile["safety_plan"]

@api_router.get("/admin/crisis-alerts")
async def crisis_alerts(admin=Depends(require_admin)):
    return await db.crisis_alerts.find({}, {"_id": 0, "user_id": 0}).sort("created_at", -1).to_list(50)

@api_router.post("/admin/crisis-alerts/{alert_id}/acknowledge")
async def acknowledge_crisis(alert_id: str, admin=Depends(require_admin)):
    result = await db.crisis_alerts.update_one({"id": alert_id}, {"$set": {"acknowledged": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sinyal tidak ditemukan.")
    return {"ok": True}

@api_router.get("/notifications")
async def list_notifications(user=Depends(current_user)):
    return await db.notifications.find({"user_id": user["id"]}, {"_id": 0, "user_id": 0}).sort("created_at", -1).to_list(20)

@api_router.post("/notifications/read")
async def read_notifications(user=Depends(current_user)):
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}

@api_router.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, payload: CommentCreate, user=Depends(current_user)):
    if await db.posts.find_one({"id": post_id}, {"_id": 0}) is None:
        raise HTTPException(status_code=404, detail="Cerita tidak ditemukan.")
    comment = {"id": str(uuid.uuid4()), "post_id": post_id, "alias": user["alias"], "role": user.get("role", "member"), "psychologist_id": user.get("psychologist_id"), "body": payload.body.strip(), "created_at": now_iso()}
    await db.comments.insert_one(comment)
    await db.posts.update_one({"id": post_id}, {"$inc": {"comment_count": 1}})
    post = await db.posts.find_one({"id": post_id}, {"_id": 0, "author_id": 1, "title": 1})
    if post and post.get("author_id") and post["author_id"] != user["id"]:
        await db.notifications.insert_one({"id": str(uuid.uuid4()), "user_id": post["author_id"], "text": f"Seseorang membalas ceritamu \u201c{post['title'][:60]}\u201d.", "read": False, "created_at": now_iso()})
    return {key: comment[key] for key in comment if key != "_id"}

@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    return await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(100)

@api_router.post("/posts/{post_id}/report")
async def report_post(post_id: str, user=Depends(current_user)):
    if await db.posts.find_one({"id": post_id}, {"_id": 1}) is None:
        raise HTTPException(status_code=404, detail="Cerita tidak ditemukan.")
    try:
        await db.reports.insert_one({"id": str(uuid.uuid4()), "post_id": post_id, "user_id": user["id"], "created_at": now_iso()})
    except DuplicateKeyError:
        return {"ok": True, "message": "Laporanmu sudah tercatat sebelumnya."}
    return {"ok": True, "message": "Laporan diterima dan akan ditinjau tim kami."}

class ArticleCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    excerpt: str = Field(min_length=1, max_length=600)
    category: str = Field(min_length=1, max_length=60)
    read_time: str = "5 menit"

@api_router.get("/admin/reports")
async def admin_reports(admin=Depends(require_admin)):
    reports = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    post_ids = list({report["post_id"] for report in reports})
    posts_map = {}
    if post_ids:
        posts_map = {post["id"]: post for post in await db.posts.find({"id": {"$in": post_ids}}, {"_id": 0, "author_id": 0}).to_list(200)}
    return [{**report, "post": posts_map.get(report["post_id"])} for report in reports]

@api_router.post("/admin/reports/{report_id}/dismiss")
async def dismiss_report(report_id: str, admin=Depends(require_admin)):
    result = await db.reports.delete_one({"id": report_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan.")
    return {"ok": True}

@api_router.delete("/admin/posts/{post_id}")
async def admin_delete_post(post_id: str, admin=Depends(require_admin)):
    result = await db.posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cerita tidak ditemukan.")
    await db.comments.delete_many({"post_id": post_id})
    await db.reports.delete_many({"post_id": post_id})
    return {"ok": True}

@api_router.post("/articles")
async def admin_create_article(payload: ArticleCreate, admin=Depends(require_roles("admin", "psikolog"))):
    article = {"id": str(uuid.uuid4()), "title": payload.title.strip(), "excerpt": payload.excerpt.strip(), "category": payload.category.strip(), "author": admin["alias"], "verified": True, "read_time": payload.read_time, "created_at": now_iso()}
    await db.articles.insert_one(article)
    return {key: article[key] for key in article if key != "_id"}

class PsychologistCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)
    specialty: str = Field(min_length=1, max_length=120)
    availability: str = Field(min_length=1, max_length=80)
    city: str = "Online"
    bio: str = Field(min_length=1, max_length=600)

class ProfileUpdate(BaseModel):
    specialty: str = Field(min_length=1, max_length=120)
    availability: str = Field(min_length=1, max_length=80)
    city: str = "Online"
    bio: str = Field(min_length=1, max_length=600)
    photo: Optional[str] = None

@api_router.get("/admin/psychologists")
async def admin_psychologists(admin=Depends(require_admin)):
    return await db.psychologists.find({}, {"_id": 0}).to_list(100)

@api_router.post("/admin/psychologists")
async def admin_create_psychologist(payload: PsychologistCreate, admin=Depends(require_admin)):
    email = payload.email.lower()
    psy_id = str(uuid.uuid4())
    initials = "".join(part[0] for part in payload.name.replace(",", " ").split() if part[0].isalpha())[:2].upper()
    await db.psychologists.insert_one({"id": psy_id, "name": payload.name.strip(), "specialty": payload.specialty.strip(), "city": payload.city.strip(), "availability": payload.availability.strip(), "bio": payload.bio.strip(), "initials": initials or "PS", "verified": True, "active": True})
    try:
        await db.users.insert_one({"id": str(uuid.uuid4()), "email": email, "password_hash": hash_password(payload.password), "alias": payload.name.strip(), "role": "psikolog", "psychologist_id": psy_id, "created_at": now_iso()})
    except DuplicateKeyError as exc:
        await db.psychologists.delete_one({"id": psy_id})
        raise HTTPException(status_code=409, detail="Email sudah terdaftar.") from exc
    return {"ok": True, "id": psy_id}

@api_router.post("/admin/psychologists/{psy_id}/toggle")
async def admin_toggle_psychologist(psy_id: str, admin=Depends(require_admin)):
    psy = await db.psychologists.find_one({"id": psy_id}, {"_id": 0})
    if not psy:
        raise HTTPException(status_code=404, detail="Psikolog tidak ditemukan.")
    active = not psy.get("active", True)
    await db.psychologists.update_one({"id": psy_id}, {"$set": {"active": active}})
    await db.users.update_many({"psychologist_id": psy_id}, {"$set": {"disabled": not active}})
    return {"ok": True, "active": active}

@api_router.get("/psychologists/me/stats")
async def psychologist_stats(user=Depends(require_roles("psikolog"))):
    pid = user.get("psychologist_id", "-")
    return {"assisted": await db.consultations.count_documents({"psychologist_id": pid, "status": "Terkonfirmasi"}), "pending": await db.consultations.count_documents({"psychologist_id": pid, "status": "Menunggu konfirmasi"}), "articles": await db.articles.count_documents({"author": user["alias"]})}

@api_router.post("/psychologists/me/profile")
async def update_psychologist_profile(payload: ProfileUpdate, user=Depends(require_roles("psikolog"))):
    pid = user.get("psychologist_id")
    if not pid:
        raise HTTPException(status_code=400, detail="Akun ini belum terhubung ke profil psikolog.")
    update = {"specialty": payload.specialty.strip(), "availability": payload.availability.strip(), "city": payload.city.strip(), "bio": payload.bio.strip()}
    if payload.photo:
        if not payload.photo.startswith("data:image/") or len(payload.photo) > 700_000:
            raise HTTPException(status_code=400, detail="Foto harus berupa gambar maksimal 500 KB.")
        update["photo"] = payload.photo
    await db.psychologists.update_one({"id": pid}, {"$set": update})
    return await db.psychologists.find_one({"id": pid}, {"_id": 0})

class OnboardingInput(BaseModel):
    brings: str = Field(min_length=1, max_length=600)
    feeling: str = Field(min_length=1, max_length=600)
    hope: str = Field(min_length=1, max_length=600)

class AiChatInput(BaseModel):
    message: str = Field(min_length=1, max_length=1200)

@api_router.post("/onboarding")
async def save_onboarding(payload: OnboardingInput, user=Depends(current_user)):
    doc = {"user_id": user["id"], "brings": payload.brings.strip(), "feeling": payload.feeling.strip(), "hope": payload.hope.strip(), "updated_at": now_iso()}
    await db.profiles.update_one({"user_id": user["id"]}, {"$set": doc}, upsert=True)
    return {"ok": True}

@api_router.get("/onboarding")
async def get_onboarding(user=Depends(current_user)):
    profile = await db.profiles.find_one({"user_id": user["id"]}, {"_id": 0, "user_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Wawancara belum diisi.")
    return profile

AI_SYSTEM_BASE = (
    "Kamu adalah Sinta, teman AI di aplikasi titikjiwa, ruang pemulihan trauma. "
    "Jawab dalam Bahasa Indonesia yang hangat dan manusiawi, singkat (2-4 kalimat). "
    "Kamu bukan terapis dan tidak memberi diagnosis. Validasi perasaan, lalu tawarkan satu langkah kecil yang lembut. "
    "Jika ada tanda bahaya atau krisis, arahkan ke bantuan profesional atau layanan darurat dengan penuh kepedulian. "
    "Boleh mengutip pengalaman komunitas yang relevan, tanpa menyebut nama atau identitas. "
    "Tulis teks polos tanpa format markdown (tanpa tanda bintang, pagar, atau daftar berpoin)."
)

def tokenize(text: str):
    return {w for w in re.findall(r"[a-zà-ÿ]{4,}", text.lower())}

async def retrieve_knowledge(query: str, limit: int = 4):
    words = tokenize(query)
    if not words:
        return []
    scored = []
    async for post in db.posts.find({}, {"_id": 0, "title": 1, "body": 1, "topic": 1}).limit(200):
        text = f"{post['title']} {post['body']} {post['topic']}"
        score = len(words & tokenize(text))
        if score:
            scored.append((score, f"Pengalaman komunitas ({post['topic']}): {post['title']} — {post['body'][:220]}"))
    async for article in db.articles.find({}, {"_id": 0, "title": 1, "excerpt": 1, "category": 1}).limit(100):
        text = f"{article['title']} {article['excerpt']} {article['category']}"
        score = len(words & tokenize(text))
        if score:
            scored.append((score, f"Panduan psikolog ({article['category']}): {article['title']} — {article['excerpt'][:220]}"))
    async for past in db.ai_interactions.find({}, {"_id": 0, "message": 1, "reply": 1}).sort("created_at", -1).limit(150):
        score = len(words & tokenize(past["message"]))
        if score:
            scored.append((score, f"Pernah dibahas: {past['message'][:140]} — Jawaban sebelumnya: {past['reply'][:220]}"))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [text for _, text in scored[:limit]]

CRISIS_TERMS = ("bunuh diri", "ingin mati", "pengen mati", "mengakhiri hidup", "akhiri hidup", "menyakiti diri", "melukai diri", "self harm", "self-harm", "sayat", "gantung diri", "tidak ingin hidup", "tidak mau hidup", "lebih baik aku mati", "lebih baik saya mati")

def is_crisis(text: str):
    lowered = text.lower()
    return any(term in lowered for term in CRISIS_TERMS)

@api_router.post("/ai/chat")
async def ai_chat(payload: AiChatInput, user=Depends(current_user)):
    if is_crisis(payload.message):
        await db.crisis_alerts.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"], "alias": user["alias"], "excerpt": payload.message[:140], "acknowledged": False, "created_at": now_iso()})
    knowledge = await retrieve_knowledge(payload.message)
    profile = await db.profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    parts = [AI_SYSTEM_BASE]
    if profile:
        parts.append(f"Tentang pengguna ini dari wawancara pengenalan — yang membawanya ke sini: {profile['brings']}. Yang paling terasa akhir-akhir ini: {profile['feeling']}. Harapannya: {profile['hope']}.")
    if knowledge:
        parts.append("Pengetahuan relevan dari komunitas dan psikolog:\n" + "\n".join(f"- {item}" for item in knowledge))
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"titikjiwa-{user['id']}", system_message="\n\n".join(parts)).with_model("openai", "gpt-5.4")

    async def event_stream():
        reply_parts = []
        try:
            async for event in chat.stream_message(UserMessage(text=payload.message)):
                if isinstance(event, TextDelta):
                    reply_parts.append(event.content)
                    yield f"data: {json.dumps({'token': event.content})}\n\n"
                elif isinstance(event, StreamDone):
                    break
        except Exception as exc:
            logger.error("AI stream error: %s", exc)
            yield f"data: {json.dumps({'error': 'Teman AI sedang terganggu. Coba lagi sebentar.'})}\n\n"
        reply = "".join(reply_parts).strip()
        if reply:
            await db.ai_interactions.insert_one({"id": str(uuid.uuid4()), "user_id": user["id"], "role": user.get("role", "member"), "message": payload.message.strip(), "reply": reply, "created_at": now_iso()})
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

@api_router.post("/ai/weekly-insight")
async def weekly_insight(user=Depends(current_user)):
    week_key = datetime.now(timezone.utc).strftime("%G-W%V")
    existing = await db.weekly_insights.find_one({"user_id": user["id"], "week_key": week_key}, {"_id": 0, "user_id": 0})
    if existing:
        return {"insight": existing["text"], "week": week_key, "cached": True}
    since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    entries = await db.journals.find({"user_id": user["id"], "created_at": {"$gte": since}}, {"_id": 0, "title": 1, "mood": 1}).to_list(50)
    if not entries:
        raise HTTPException(status_code=400, detail="Belum ada jurnal minggu ini untuk diringkas.")
    summary_lines = "\n".join(f"- [{entry['mood']}] {entry['title']}" for entry in entries)
    prompt = (
        "Berikut catatan jurnal pengguna selama 7 hari terakhir (suasana hati dan judulnya):\n"
        f"{summary_lines}\n\n"
        "Tulis catatan lembut 3-4 kalimat dalam Bahasa Indonesia: rangkum pola perasaannya minggu ini, hargai usahanya menulis, dan tawarkan satu ajakan kecil untuk minggu depan. Jangan mendiagnosis."
    )
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"insight-{user['id']}-{week_key}", system_message="Kamu adalah Sinta, teman AI titikjiwa yang hangat dan penuh perhatian.").with_model("openai", "gpt-5.4")
    reply_parts = []
    async for event in chat.stream_message(UserMessage(text=prompt)):
        if isinstance(event, TextDelta):
            reply_parts.append(event.content)
        elif isinstance(event, StreamDone):
            break
    text = "".join(reply_parts).strip() or "Terima kasih sudah menulis minggu ini. Setiap catatan kecil berarti."
    await db.weekly_insights.update_one({"user_id": user["id"], "week_key": week_key}, {"$set": {"text": text, "created_at": now_iso()}}, upsert=True)
    return {"insight": text, "week": week_key, "cached": False}

DEFAULT_SUGGESTIONS = ["Aku sulit tidur akhir-akhir ini", "Aku merasa bersalah saat menetapkan batasan", "Bagaimana cara memulai jurnal pertamaku?"]

@api_router.get("/ai/suggestions")
async def ai_suggestions(user=Depends(current_user)):
    profile = await db.profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        return {"suggestions": DEFAULT_SUGGESTIONS}
    if profile.get("suggestions"):
        return {"suggestions": profile["suggestions"]}
    prompt = (
        "Berdasarkan jawaban wawancara pengguna berikut:\n"
        f"- Yang membawanya ke sini: {profile['brings']}\n"
        f"- Yang paling terasa akhir-akhir ini: {profile['feeling']}\n"
        f"- Harapannya: {profile['hope']}\n\n"
        "Buat 3 saran kalimat pembuka yang bisa pengguna kirim ke teman AI. Syarat: orang pertama, lembut, maksimal 10 kata per kalimat, Bahasa Indonesia. Tulis hanya 3 baris tanpa nomor, tanpa tanda bintang."
    )
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"suggest-{user['id']}", system_message="Kamu membantu merumuskan kalimat pembuka yang personal dan lembut.").with_model("openai", "gpt-5.4")
    reply_parts = []
    async for event in chat.stream_message(UserMessage(text=prompt)):
        if isinstance(event, TextDelta):
            reply_parts.append(event.content)
        elif isinstance(event, StreamDone):
            break
    lines = [line.strip().strip("-•0123. ").strip('"') for line in "".join(reply_parts).split("\n") if line.strip()]
    suggestions = [line for line in lines if 5 <= len(line) <= 120][:3] or DEFAULT_SUGGESTIONS
    await db.profiles.update_one({"user_id": user["id"]}, {"$set": {"suggestions": suggestions}})
    return {"suggestions": suggestions}

@api_router.get("/ai/weekly-insights")
async def weekly_insight_archive(user=Depends(current_user)):
    return await db.weekly_insights.find({"user_id": user["id"]}, {"_id": 0, "user_id": 0}).sort("week_key", -1).to_list(24)

@api_router.get("/ai/history")
async def ai_history(user=Depends(current_user)):
    return await db.ai_interactions.find({"user_id": user["id"]}, {"_id": 0, "user_id": 0}).sort("created_at", 1).to_list(50)

class ConsultationStatus(BaseModel):
    status: str

class UserUpdate(BaseModel):
    role: Optional[str] = None
    alias: Optional[str] = None
    disabled: Optional[bool] = None

    @field_validator("alias")
    @classmethod
    def validate_alias(cls, value):
        if value is None:
            return value
        value = value.strip()
        if len(value) < 2 or any(ord(char) < 32 for char in value):
            raise ValueError("Nama samaran tidak valid.")
        return value

class UserPasswordReset(BaseModel):
    password: str = Field(min_length=8)

@api_router.get("/consultations")
async def list_consultations(user=Depends(require_roles("admin", "psikolog"))):
    query = {} if user["role"] == "admin" else {"psychologist_id": user.get("psychologist_id", "-")}
    items = await db.consultations.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    for item in items:
        item.pop("user_id", None)
    return items

@api_router.post("/consultations/{consultation_id}/status")
async def update_consultation_status(consultation_id: str, payload: ConsultationStatus, user=Depends(require_roles("admin", "psikolog"))):
    if payload.status not in ("Terkonfirmasi", "Ditolak"):
        raise HTTPException(status_code=400, detail="Status tidak dikenal.")
    query = {"id": consultation_id} if user["role"] == "admin" else {"id": consultation_id, "psychologist_id": user.get("psychologist_id", "-")}
    result = await db.consultations.update_one(query, {"$set": {"status": payload.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Permintaan konsultasi tidak ditemukan.")
    return {"ok": True}

@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(require_admin)):
    return {"members": await db.users.count_documents({"role": "member"}), "posts": await db.posts.count_documents({}), "reports_open": await db.reports.count_documents({}), "articles": await db.articles.count_documents({}), "consultations": await db.consultations.count_documents({}), "crisis_open": await db.crisis_alerts.count_documents({"acknowledged": False})}

@api_router.get("/admin/users")
async def admin_users(admin=Depends(require_admin)):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)

@api_router.patch("/admin/users/{user_id}")
async def admin_update_user(user_id: str, payload: UserUpdate, admin=Depends(require_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")
    if payload.role and payload.role not in ("member", "psikolog", "admin"):
        raise HTTPException(status_code=400, detail="Peran tidak dikenal.")
    if user_id == admin["id"] and (payload.disabled is True or (payload.role and payload.role != "admin")):
        raise HTTPException(status_code=400, detail="Tidak bisa menonaktifkan atau menurunkan peran akun sendiri.")
    update = {}
    if payload.role is not None:
        update["role"] = payload.role
    if payload.alias is not None:
        update["alias"] = payload.alias.strip()
    if payload.disabled is not None:
        update["disabled"] = payload.disabled
    if not update:
        raise HTTPException(status_code=400, detail="Tidak ada perubahan.")
    await db.users.update_one({"id": user_id}, {"$set": update})
    return {"ok": True}

@api_router.post("/admin/users/{user_id}/reset-password")
async def admin_reset_password(user_id: str, payload: UserPasswordReset, admin=Depends(require_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")
    await db.users.update_one({"id": user_id}, {"$set": {"password_hash": hash_password(payload.password)}})
    await db.login_attempts.delete_many({"identifier": {"$regex": user["email"]}})
    return {"ok": True, "message": "Kata sandi pengguna berhasil diatur ulang."}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin=Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Tidak bisa menghapus akun sendiri.")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")
    await db.users.delete_one({"id": user_id})
    await db.profiles.delete_many({"user_id": user_id})
    await db.journals.delete_many({"user_id": user_id})
    await db.notifications.delete_many({"user_id": user_id})
    await db.ai_interactions.delete_many({"user_id": user_id})
    await db.aura_history.delete_many({"user_id": user_id})
    await db.weekly_insights.delete_many({"user_id": user_id})
    await db.crisis_alerts.delete_many({"user_id": user_id})
    await db.reports.delete_many({"user_id": user_id})
    await db.consultations.delete_many({"user_id": user_id})
    await db.password_reset_tokens.delete_many({"user_id": user_id})
    if user.get("role") == "psikolog" and user.get("psychologist_id"):
        await db.psychologists.delete_many({"id": user["psychologist_id"]})
        await db.consultations.delete_many({"psychologist_id": user["psychologist_id"]})
    return {"ok": True, "message": "Pengguna beserta datanya telah dihapus."}

@api_router.get("/articles")
async def articles():
    return await db.articles.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.get("/psychologists")
async def psychologists():
    return await db.psychologists.find({"active": {"$ne": False}}, {"_id": 0}).to_list(100)

@api_router.post("/consultations")
async def consultations(payload: ConsultationCreate, user=Depends(current_user)):
    psychologist = await db.psychologists.find_one({"id": payload.psychologist_id}, {"_id": 0})
    if not psychologist:
        raise HTTPException(status_code=404, detail="Psikolog tidak ditemukan.")
    request_doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "psychologist_id": payload.psychologist_id, "preferred_day": payload.preferred_day, "note": payload.note.strip(), "status": "Menunggu konfirmasi", "created_at": now_iso()}
    await db.consultations.insert_one(request_doc)
    return {"message": "Permintaan konsultasi terkirim. Tim kami akan menghubungi kamu.", "status": request_doc["status"]}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ["FRONTEND_URL"]],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
