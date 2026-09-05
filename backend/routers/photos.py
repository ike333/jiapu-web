"""人物照片 API（路径带谱前缀 /api/{clan_id}/photos）

C 方案：照片全托管后端。
- 存储：backend/uploads/{clan}/{filename}（系统命名，见 make_filename）
- 数据库：photos 表（clan / person_id / slot / filename），person_id 即人物规范名（含 A/B/C 后缀）
- 照片 URL：/uploads/{clan}/{filename}（开发拼 NEXT_PUBLIC_API_BASE，生产 Nginx 同源）
- GET 全谱返回 {person_name: {self: url, spouse: url}}，公开可查
- POST multipart 上传：登录用户可传自己（姓名匹配），admin 可传任何人
- DELETE：admin 删除
"""
import os
import re
import shutil
import time
import uuid

from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form

from auth import decode_token, token_clan, resolve_user
from db import db_query, get_conn
from identity import name_exists, _strip_suffix
from image_utils import compress_image

router = APIRouter(prefix="/api/{clan_id}/photos", tags=["photos"])

# 允许的图片类型与扩展名
ALLOWED = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
# 上传入口上限：接收原始大图后由 compress_image 自动压到 1MB 内；此值应配合 Nginx
# client_max_body_size（建议 10m）一起放开
MAX_SIZE = 10 * 1024 * 1024  # 10MB

UPLOAD_BASE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
)


def _clan_dir(clan_id: str) -> str:
    d = os.path.join(UPLOAD_BASE, clan_id)
    os.makedirs(d, exist_ok=True)
    return d


def _safe_name(name: str) -> str:
    """保留中文字符/字母/数字，其余替换为下划线，避免路径穿越"""
    cleaned = re.sub(r"[^\w\u4e00-\u9fff-]", "_", name or "").strip("_")
    return cleaned or "person"


def _make_filename(person_name: str, slot: str, ext: str) -> str:
    base = _safe_name(person_name)
    return f"{base}O{ext}" if slot == "spouse" else f"{base}{ext}"


def _person_exists(clan_id: str, person_name: str) -> bool:
    return name_exists(clan_id, person_name)


def _current_user(clan_id: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="请先登录")
    if token_clan(authorization[7:]) != clan_id:
        raise HTTPException(status_code=401, detail="登录信息不属于当前谱系")
    user = resolve_user(decode_token(authorization[7:]), clan_id)
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


def _photo_url(clan_id: str, filename: str) -> str:
    return f"/uploads/{clan_id}/{filename}"


def _prev_dir(clan_id: str) -> str:
    """留底目录 uploads/{clan}/prev/"""
    d = os.path.join(_clan_dir(clan_id), "prev")
    os.makedirs(d, exist_ok=True)
    return d


def _archive_old_photo(clan_id: str, person_id: str, slot: str, filename: str, archived_by: str):
    """存档旧照片：把 uploads/{clan}/{filename} 移到 prev/ 目录，并写入 photos_history。

    返回 True 表示确实有旧文件被存档，False 表示无旧文件。
    """
    src = os.path.join(_clan_dir(clan_id), filename)
    if not os.path.exists(src):
        return False
    ts = time.strftime("%Y%m%d%H%M%S")
    safe = _safe_name(person_id)
    prev_name = f"{safe}{'_O' if slot == 'spouse' else ''}_old_{ts}_{os.path.basename(filename)}"
    dst = os.path.join(_prev_dir(clan_id), prev_name)
    shutil.move(src, dst)
    conn = get_conn()
    conn.execute(
        "INSERT INTO photos_history (clan, person_id, slot, filename, uploaded_by, archived_by) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (clan_id, person_id, slot, prev_name, None, archived_by),
    )
    conn.commit()
    conn.close()
    return True


@router.get("")
def list_photos(clan_id: str):
    """返回全谱照片映射 {person_id: {self: url|null, spouse: url|null}}（公开）"""
    rows = db_query("photos", where={"clan": clan_id})
    result: dict = {}
    for r in rows:
        slot_map = result.setdefault(r["person_id"], {"self": None, "spouse": None})
        slot_map[r["slot"]] = _photo_url(clan_id, r["filename"])
    return result


@router.post("")
async def upload_photos(
    clan_id: str,
    person_name: str = Form(...),
    self_file: UploadFile = File(None),
    spouse_file: UploadFile = File(None),
    authorization: str = Header(None),
):
    """上传/更换照片：两个可选槽位（本人/配偶），multipart/form-data
    person_name 为族谱中的规范名（含 A/B/C 后缀）。
    权限：admin 可传任何人；普通用户仅可传自己（去后缀后须与注册姓名一致）"""
    user = _current_user(clan_id, authorization)
    person_name = (person_name or "").strip()
    if not person_name:
        raise HTTPException(status_code=400, detail="缺少人物姓名")

    if user["role"] != "admin":
        if _strip_suffix(person_name) != _strip_suffix(user["name"]):
            raise HTTPException(status_code=403, detail="只能上传本人照片，需要管理员代传")

    if not _person_exists(clan_id, person_name):
        raise HTTPException(status_code=400, detail=f"族谱中不存在「{person_name}」")

    if not self_file and not spouse_file:
        raise HTTPException(status_code=400, detail="请选择至少一张照片")

    saved = []
    for slot, file in (("self", self_file), ("spouse", spouse_file)):
        if not file:
            continue
        ext = ALLOWED.get(file.content_type or "")
        if not ext:
            raise HTTPException(status_code=400, detail=f"不支持的图片类型：{file.content_type}")
        data = await file.read()
        if len(data) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="图片大小不能超过 10MB")

        # 自动压缩：超过 1MB 的照片压到 1MB 内（可能转成 JPEG），让不了解图片压缩的用户免于为难
        data, ext = compress_image(data)
        filename = _make_filename(person_name, slot, ext)
        path = os.path.join(_clan_dir(clan_id), filename)

        # 旧照片留底：按 photos 表当前记录的文件名存档（后缀可能与新上传不同，如 .jpg vs .jpeg）
        cur_photo = db_query(
            "photos",
            where={"clan": clan_id, "person_id": person_name, "slot": slot},
        )
        if cur_photo:
            _archive_old_photo(clan_id, person_name, slot, cur_photo[0]["filename"], user["name"])

        with open(path, "wb") as f:
            f.write(data)

        # upsert photos 表（同 person+slot 覆盖）
        conn = get_conn()
        conn.execute(
            "INSERT INTO photos (clan, person_id, slot, filename, uploaded_by) VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(clan, person_id, slot) DO UPDATE SET filename=excluded.filename, "
            "uploaded_by=excluded.uploaded_by, created_at=datetime('now','localtime')",
            (clan_id, person_name, slot, filename, user["name"]),
        )
        conn.commit()
        conn.close()
        saved.append({"slot": slot, "url": _photo_url(clan_id, filename)})

    return {"message": "上传成功", "photos": saved}


@router.delete("")
def delete_photo(
    clan_id: str,
    person_name: str,
    slot: str = "self",
    authorization: str = Header(None),
):
    """删除某槽位照片（管理员）。person_name 为规范名（含 A/B/C 后缀）"""
    user = _current_user(clan_id, authorization)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    rows = db_query(
        "photos",
        where={"clan": clan_id, "person_id": person_name, "slot": slot},
    )
    if not rows:
        raise HTTPException(status_code=404, detail="照片不存在")
    path = os.path.join(UPLOAD_BASE, clan_id, rows[0]["filename"])
    if os.path.exists(path):
        os.remove(path)
    conn = get_conn()
    conn.execute(
        "DELETE FROM photos WHERE clan=? AND person_id=? AND slot=?",
        (clan_id, person_name, slot),
    )
    conn.commit()
    conn.close()
    return {"message": "已删除"}


@router.get("/history")
def photo_history(clan_id: str, person_name: str, slot: str = "self"):
    """查询某人在某槽位的旧照片留底列表（公开，返回 prev/ 下的历史文件路径）。
    按时间正序，最后一条为最近一次被替换的旧图。"""
    rows = db_query(
        "photos_history",
        where={"clan": clan_id, "person_id": person_name, "slot": slot},
        order_by="id ASC",
    )
    return [
        {
            "filename": r["filename"],
            "url": f"/uploads/{clan_id}/prev/{r['filename']}",
            "archived_at": r["created_at"],
            "archived_by": r["archived_by"],
        }
        for r in rows
    ]