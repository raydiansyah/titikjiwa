from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import os
import logging
import uuid
import secrets
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta


mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


JWT_ALGORITHM = "HS256"

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    alias: str = Field(min_length=2, max_length=30)

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class JournalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=5000)
    mood: str = "Netral"

class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=140)
    body: str = Field(min_length=1, max_length=5000)
    topic: str = "Perjalanan pulih"
    sensitive: bool = False

class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=800)

class ConsultationCreate(BaseModel):
    psychologist_id: str
    preferred_day: str
    note: str = Field(min_length=1, max_length=1000)

class ForgotPasswordInput(BaseModel):
    email: EmailStr

class ResetPasswordInput(BaseModel):
    token: str
    password: str = Field(min_length=8)

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def public_user(user):
    return {"id": user["id"], "email": user["email"], "alias": user["alias"], "role": user.get("role", "member")}

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user):
    return jwt.encode({"sub": user["id"], "email": user["email"], "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

def create_refresh_token(user):
    return jwt.encode({"sub": user["id"], "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, user):
    response.set_cookie("access_token", create_access_token(user), httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie("refresh_token", create_refresh_token(user), httponly=True, secure=True, samesite="none", max_age=604800, path="/")

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
        return user
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Sesi sudah berakhir.") from exc

async def seed_content():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    admin = await db.users.find_one({"email": os.environ["ADMIN_EMAIL"]}, {"_id": 0})
    if admin is None:
        await db.users.insert_one({"id": str(uuid.uuid4()), "email": os.environ["ADMIN_EMAIL"], "password_hash": hash_password(os.environ["ADMIN_PASSWORD"]), "alias": "Tim Sintesis", "role": "admin", "created_at": now_iso()})
    elif not verify_password(os.environ["ADMIN_PASSWORD"], admin["password_hash"]):
        await db.users.update_one({"email": os.environ["ADMIN_EMAIL"]}, {"$set": {"password_hash": hash_password(os.environ["ADMIN_PASSWORD"])}})
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
            {"id": "article-jurnal", "title": "Jurnal reflektif: mulai dari satu kalimat", "excerpt": "Tidak perlu menulis sempurna untuk bisa mendengar isi hati sendiri.", "category": "Jurnal", "author": "Tim Sintesis", "verified": True, "read_time": "4 menit", "created_at": now_iso()},
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
    return {"message": "Sintesis API aktif", "service": "sintesis"}

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

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
async def register(payload: UserCreate, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}, {"_id": 0}):
        raise HTTPException(status_code=409, detail="Email sudah terdaftar.")
    user = {"id": str(uuid.uuid4()), "email": email, "password_hash": hash_password(payload.password), "alias": payload.alias.strip(), "role": "member", "created_at": now_iso()}
    await db.users.insert_one(user)
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
    await db.login_attempts.delete_one({"identifier": identifier})
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
        logger.info("Tautan reset kata sandi untuk %s: /atur-ulang?token=%s", user["email"], token)
    return {"ok": True, "message": "Jika email terdaftar, tautan pemulihan akan dikirim."}

@api_router.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordInput):
    record = await db.password_reset_tokens.find_one({"token": payload.token})
    expires_at = record["expires_at"] if record else None
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not record or record.get("used") or expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Tautan pemulihan tidak valid atau sudah kedaluwarsa.")
    await db.users.update_one({"id": record["user_id"]}, {"$set": {"password_hash": hash_password(payload.password)}})
    await db.password_reset_tokens.update_one({"token": payload.token}, {"$set": {"used": True}})
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

@api_router.get("/posts")
async def posts():
    return await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/posts")
async def create_post(payload: PostCreate, user=Depends(current_user)):
    post = {"id": str(uuid.uuid4()), "title": payload.title.strip(), "body": payload.body.strip(), "topic": payload.topic, "alias": "Anonim", "sensitive": payload.sensitive, "support_count": 0, "comment_count": 0, "created_at": now_iso(), "author_id": user["id"]}
    await db.posts.insert_one(post)
    return {key: post[key] for key in post if key not in ("author_id", "_id")}

@api_router.post("/posts/{post_id}/support")
async def support_post(post_id: str, user=Depends(current_user)):
    result = await db.posts.update_one({"id": post_id}, {"$inc": {"support_count": 1}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cerita tidak ditemukan.")
    return {"ok": True}

@api_router.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, payload: CommentCreate, user=Depends(current_user)):
    if await db.posts.find_one({"id": post_id}, {"_id": 0}) is None:
        raise HTTPException(status_code=404, detail="Cerita tidak ditemukan.")
    comment = {"id": str(uuid.uuid4()), "post_id": post_id, "alias": user["alias"], "body": payload.body.strip(), "created_at": now_iso()}
    await db.comments.insert_one(comment)
    await db.posts.update_one({"id": post_id}, {"$inc": {"comment_count": 1}})
    return {key: comment[key] for key in comment if key != "_id"}

@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    return await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(100)

@api_router.post("/posts/{post_id}/report")
async def report_post(post_id: str, user=Depends(current_user)):
    await db.reports.insert_one({"id": str(uuid.uuid4()), "post_id": post_id, "user_id": user["id"], "created_at": now_iso()})
    return {"ok": True, "message": "Laporan diterima dan akan ditinjau tim kami."}

@api_router.get("/articles")
async def articles():
    return await db.articles.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.get("/psychologists")
async def psychologists():
    return await db.psychologists.find({}, {"_id": 0}).to_list(100)

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