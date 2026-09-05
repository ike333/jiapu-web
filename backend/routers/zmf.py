"""知命坊联动 API：生成带签名的跳转 ticket（路径带谱前缀 /api/{clan_id}/zmf）
POST /api/{clan_id}/zmf/ticket
  - 需要登录（Bearer token）
  - body: { name?, gender?, birthDate?, birthPlace? }  排盘数据（可选，缺省用当前登录用户信息）
  - 调知命坊 /api/import 建号/复用，返回 ticket 与跳转 URL
"""
import hashlib
import hmac
import json
import os
import time
import urllib.request
import urllib.error
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from auth import decode_token, token_clan, resolve_user

router = APIRouter(prefix="/api/{clan_id}/zmf", tags=["zmf"])

# 共享密钥：与知命坊 wrangler.jsonc 的 ZONGPU_SECRET 一致
ZMF_ZONGPU_SECRET = os.environ.get(
    "ZMF_ZONGPU_SECRET",
    "f9e9b4b2b49b946daacfbab977e432a4f963fa96342acd12c22b5d28cfb2b7e7",
)
# 知命坊导入接口地址
ZMF_IMPORT_URL = os.environ.get(
    "ZMF_IMPORT_URL", "https://api.zmf68.com/api/import"
)
# 知命坊排盘页（跳转目标）
ZMF_PAIPAN_URL = os.environ.get("ZMF_PAIPAN_URL", "https://zmf68.com/paipan")


class ZmfTicketReq(BaseModel):
    name: Optional[str] = None        # 族人姓名（默认取登录用户名）
    gender: Optional[str] = None      # 男 | 女
    birthDate: Optional[str] = None   # 公历 YYYY-MM-DD
    birthTime: Optional[str] = None   # HH:MM（可选）
    birthPlace: Optional[str] = None  # 出生地（用于真太阳时）


def _hmac_hex(secret: str, message: str) -> str:
    return hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()


@router.post("/ticket")
def zmf_ticket(clan_id: str, req: ZmfTicketReq, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="请先登录")
    if token_clan(authorization[7:]) != clan_id:
        raise HTTPException(status_code=401, detail="登录信息不属于当前谱系")
    user = resolve_user(decode_token(authorization[7:]), clan_id)
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")

    # 组装导入参数
    name = (req.name or user.get("name") or "").strip()
    gender = req.gender or ""
    birth = req.birthDate or ""
    birth_time = req.birthTime or ""
    birth_place = req.birthPlace or ""

    # data 参数（供知命坊排盘页）：男_YYYY-M-D_H-M_出生地
    if birth and birth_time:
        # 统一为短横线格式
        d = birth.replace("/", "-").replace(".", "-")
        t = birth_time.replace(":", "-")
        data_param = f"{gender}_{d}_{t}_{birth_place}" if gender else f"{gender or '男'}_{d}_{t}_{birth_place}"
    elif birth:
        d = birth.replace("/", "-").replace(".", "-")
        data_param = f"{gender or '男'}_{d}_0-0_{birth_place}"
    else:
        data_param = f"{gender or '男'}"

    ts = int(time.time() * 1000)

    fields = {
        "phone": user["phone"],
        "name": name,
        "password": user.get("password", ""),   # 家谱 PBKDF2 哈希，转移至知命坊
        "gender": gender,
        "ts": str(ts),
    }
    sig = _hmac_hex(ZMF_ZONGPU_SECRET, "&".join(
        f"{k}={fields[k]}" for k in sorted(fields)
    ))
    payload = {**fields, "sig": sig}

    req_json = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req_ = urllib.request.Request(
        ZMF_IMPORT_URL,
        data=req_json,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req_, timeout=15) as resp:
            body = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "ignore")
        raise HTTPException(status_code=502, detail=f"知命坊导入失败: {e.code} {detail}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"知命坊导入失败: {e}")

    try:
        data = json.loads(body)
    except Exception:
        raise HTTPException(status_code=502, detail="知命坊返回格式异常")

    if not data.get("success"):
        raise HTTPException(status_code=502, detail=data.get("error", "知命坊导入失败"))

    ticket = data["data"]["ticket"]
    # 跳转 URL：ticket + data（data 仅含排盘信息，不含手机号/密码）
    from urllib.parse import quote
    target = f"{ZMF_PAIPAN_URL}?ticket={ticket}&data={quote(data_param)}"
    if name:
        target += f"&name={quote(name)}"

    return {"ticket": ticket, "url": target}
