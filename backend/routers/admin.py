"""管理员审核 API：查看待审核记录、通过/驳回、整理人员变动（路径带谱前缀 /api/{clan_id}/admin）"""
import json
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from auth import decode_token, token_clan, resolve_user
from db import db_query, db_update, get_conn
from shixi_export import changes_to_text

router = APIRouter(prefix="/api/{clan_id}/admin", tags=["admin"])


class ReviewReq(BaseModel):
    decision: str  # approve | reject
    note: Optional[str] = None


def _require_admin(clan_id: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="请先登录")
    if token_clan(authorization[7:]) != clan_id:
        raise HTTPException(status_code=401, detail="登录信息不属于当前谱系")
    user = resolve_user(decode_token(authorization[7:]), clan_id)
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


@router.get("/pending")
def pending_list(clan_id: str, status: str = "pending", authorization: str = Header(None)):
    _require_admin(clan_id, authorization)
    rows = db_query(
        "changes",
        where={"status": status, "clan": clan_id},
        order_by="id DESC",
    )
    for r in rows:
        try:
            r["data"] = json.loads(r["data"])
        except Exception:
            pass
    return rows


@router.post("/review/{change_id}")
def review(clan_id: str, change_id: int, req: ReviewReq, authorization: str = Header(None)):
    admin = _require_admin(clan_id, authorization)
    rows = db_query("changes", where={"id": change_id, "clan": clan_id})
    if not rows:
        raise HTTPException(status_code=404, detail="记录不存在")

    new_status = "approved" if req.decision == "approve" else "rejected"
    db_update(
        "changes",
        {
            "status": new_status,
            "reviewed_by": admin["name"],
            "reviewed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        },
        {"id": change_id},
    )
    return {"message": "已通过" if new_status == "approved" else "已驳回", "id": change_id}


@router.get("/stats")
def stats(clan_id: str, authorization: str = Header(None)):
    _require_admin(clan_id, authorization)
    conn = get_conn()
    cur = conn.execute(
        "SELECT type, status, COUNT(*) as cnt FROM changes WHERE clan=? GROUP BY type, status",
        (clan_id,),
    )
    rows = cur.fetchall()
    conn.close()
    result = {}
    for r in rows:
        result.setdefault(r["type"], {})[r["status"]] = r["cnt"]
    return result


# ---------- 整理人员变动（审核通过 → 世系表风格文本） ----------

def _approved_unexported(clan_id: str):
    """查询已通过但尚未整理（exported_at IS NULL）的变动，data 解析为 dict"""
    conn = get_conn()
    rows = conn.execute(
        "SELECT id, type, data, status, submitter_name, submitter_phone, reviewed_by, reviewed_at, "
        "created_at, remark FROM changes "
        "WHERE clan=? AND status='approved' AND exported_at IS NULL ORDER BY id",
        (clan_id,),
    ).fetchall()
    conn.close()
    out = []
    for r in rows:
        d = dict(r)
        try:
            d["data"] = json.loads(d["data"])
        except Exception:
            pass
        out.append(d)
    return out


@router.get("/export/pending")
def export_pending(clan_id: str, authorization: str = Header(None)):
    """未整理（审核通过且未导出）变动清单"""
    _require_admin(clan_id, authorization)
    return _approved_unexported(clan_id)


@router.post("/export/generate")
def export_generate(clan_id: str, authorization: str = Header(None)):
    """把未整理的已通过变动渲染为 世系表.txt 风格文本（不改变数据库状态）"""
    _require_admin(clan_id, authorization)
    rows = _approved_unexported(clan_id)
    changes = []
    for r in rows:
        d = dict(r)
        data = d["data"] if isinstance(d["data"], dict) else {}
        data["type"] = d["type"]
        changes.append(data)
    return {"count": len(changes), "text": changes_to_text(changes)}


class ExportMarkReq(BaseModel):
    change_ids: List[int]


@router.post("/export/mark")
def export_mark(clan_id: str, req: ExportMarkReq, authorization: str = Header(None)):
    """把本次整理过的变动标记为已导出（exported_at），避免重复生成"""
    _require_admin(clan_id, authorization)
    if not req.change_ids:
        raise HTTPException(status_code=400, detail="未选择要标记的变动")
    marks = [str(int(i)) for i in req.change_ids]
    conn = get_conn()
    cur = conn.execute(
        f"UPDATE changes SET exported_at=? "
        f"WHERE clan=? AND status='approved' AND id IN ({','.join('?' * len(marks))})",
        [datetime.now().strftime("%Y-%m-%d %H:%M:%S"), clan_id, *marks],
    )
    conn.commit()
    updated = cur.rowcount
    conn.close()
    return {"message": f"已标记 {updated} 条为已整理", "updated": updated}


class RoleReq(BaseModel):
    role: str  # user | admin


@router.get("/users")
def list_users(clan_id: str, authorization: str = Header(None)):
    _require_admin(clan_id, authorization)
    rows = db_query("users", where={"clan": clan_id}, order_by="id DESC")
    for r in rows:
        r.pop("password", None)
    return rows


@router.post("/users/{user_id}/role")
def set_user_role(clan_id: str, user_id: int, req: RoleReq, authorization: str = Header(None)):
    _require_admin(clan_id, authorization)
    if req.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="role 只能为 user 或 admin")
    rows = db_query("users", where={"id": user_id, "clan": clan_id})
    if not rows:
        raise HTTPException(status_code=404, detail="用户不存在")
    db_update("users", {"role": req.role}, {"id": user_id, "clan": clan_id})
    return {"message": "已更新角色", "id": user_id, "role": req.role}


@router.delete("/users/{user_id}")
def delete_user(clan_id: str, user_id: int, authorization: str = Header(None)):
    _require_admin(clan_id, authorization)
    rows = db_query("users", where={"id": user_id, "clan": clan_id})
    if not rows:
        raise HTTPException(status_code=404, detail="用户不存在")
    conn = get_conn()
    conn.execute("DELETE FROM users WHERE id=? AND clan=?", (user_id, clan_id))
    conn.commit()
    conn.close()
    return {"message": "已删除", "id": user_id}
