"""认证工具：密码哈希、短信验证码（模拟）、JWT"""
import hashlib
import os
import random
import time
import jwt
import sqlite3
from datetime import datetime, timedelta
from db import get_conn, db_insert

SECRET_KEY = os.environ.get("JWT_SECRET", "chen-genealogy-dev-secret-change-me")
JWT_EXPIRE_HOURS = 24 * 7

# 短信服务开关：False = 模拟（验证码直接返回给前端）
SMS_ENABLED = os.environ.get("SMS_ENABLED", "0") == "1"

# 管理员密码：仅用于 /api/auth/admin-login（无需注册手机号）
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123456")

# 管理员虚拟主体的名称（不在 users 表中）
ADMIN_SUBJECT = "admin"


def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 100000).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split("$")
        calc = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 100000).hex()
        return calc == digest
    except Exception:
        return False


def create_token(user_id, clan_id: str = "chen") -> str:
    payload = {
        "sub": str(user_id),
        "clan": clan_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRE_HOURS * 3600,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_payload(token: str):
    """返回完整 JWT payload（含 sub、clan），解析失败返回 None"""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except Exception:
        return None


def decode_token(token: str):
    """返回 token 主体(user_id) 的字符串表示，管理员 token 为 ADMIN_SUBJECT"""
    payload = decode_payload(token)
    return payload["sub"] if payload else None


def token_clan(token: str):
    """返回 token 所属谱系"""
    payload = decode_payload(token)
    return payload.get("clan", "chen") if payload else None


def resolve_user(subject, clan_id: str = None):
    """把 token 主体解析为用户字典。管理员 token 返回虚拟管理员（不在 users 表）。
    clan_id 不为空时校验用户属于该谱（admin 虚拟用户不校验）。"""
    if subject == ADMIN_SUBJECT:
        return {
            "id": 0,
            "phone": "",
            "name": "管理员",
            "role": "admin",
            "password": "",
            "clan": clan_id or "chen",
        }
    try:
        return get_user(int(subject), clan_id)
    except Exception:
        return None


def send_sms_code(phone: str, purpose: str):
    """生成验证码并保存。SMS_ENABLED=0 时为模拟，返回验证码。
    接入真实短信时：把模拟分支替换为调用短信服务商 API，并返回 None。"""
    code = f"{random.randint(0, 999999):06d}"
    expires = (datetime.now() + timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")
    # 失效旧的未使用验证码
    conn = get_conn()
    conn.execute(
        "UPDATE sms_codes SET used=1 WHERE phone=? AND purpose=? AND used=0",
        (phone, purpose),
    )
    conn.commit()
    conn.close()
    db_insert("sms_codes", {"phone": phone, "purpose": purpose, "code": code, "expires_at": expires})

    if SMS_ENABLED:
        # TODO: 接入真实短信服务商（阿里云/腾讯云 SMS）
        return None
    return code  # 模拟模式：直接返回，供前端提示


def verify_code(phone: str, purpose: str, code: str) -> bool:
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM sms_codes WHERE phone=? AND purpose=? AND code=? AND used=0 ORDER BY id DESC LIMIT 1",
        (phone, purpose, code),
    ).fetchone()
    if not row:
        conn.close()
        return False
    if row["expires_at"] < datetime.now().strftime("%Y-%m-%d %H:%M:%S"):
        conn.close()
        return False
    conn.execute("UPDATE sms_codes SET used=1 WHERE id=?", (row["id"],))
    conn.commit()
    conn.close()
    return True


def find_user_by_phone(phone: str, clan_id: str = None):
    conn = get_conn()
    if clan_id:
        row = conn.execute(
            "SELECT * FROM users WHERE phone=? AND clan=?", (phone, clan_id)
        ).fetchone()
    else:
        row = conn.execute("SELECT * FROM users WHERE phone=?", (phone,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user(user_id: int, clan_id: str = None):
    conn = get_conn()
    if clan_id:
        row = conn.execute(
            "SELECT * FROM users WHERE id=? AND clan=?", (user_id, clan_id)
        ).fetchone()
    else:
        row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None
