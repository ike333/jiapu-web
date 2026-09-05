"""意见反馈 API：用户提交/查看，管理员列表/回复（路径带谱前缀 /api/{clan_id}/feedback）"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from auth import decode_token, token_clan, resolve_user
from db import db_insert, db_query, db_update

router = APIRouter(prefix="/api/{clan_id}/feedback", tags=["feedback"])


class SubmitFeedbackReq(BaseModel):
    content: str


class ReplyFeedbackReq(BaseModel):
    reply: str


def _current_user(clan_id: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="请先登录")
    if token_clan(authorization[7:]) != clan_id:
        raise HTTPException(status_code=401, detail="登录信息不属于当前谱系")
    user = resolve_user(decode_token(authorization[7:]), clan_id)
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


def _require_admin(clan_id: str, authorization: str = Header(None)):
    user = _current_user(clan_id, authorization)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


@router.post("")
def submit(clan_id: str, req: SubmitFeedbackReq, authorization: str = Header(None)):
    user = _current_user(clan_id, authorization)
    content = (req.content or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="反馈内容不能为空")
    db_insert(
        "feedbacks",
        {
            "content": content,
            "submitter_id": user["id"],
            "submitter_name": user["name"],
            "submitter_phone": user["phone"],
            "status": "pending",
            "clan": clan_id,
        },
    )
    return {"message": "反馈已提交，管理员会尽快查看"}


@router.get("/mine")
def my_feedbacks(clan_id: str, authorization: str = Header(None)):
    user = _current_user(clan_id, authorization)
    return db_query(
        "feedbacks",
        where={"submitter_id": user["id"], "clan": clan_id},
        order_by="id DESC",
    )


@router.get("/list")
def feedback_list(clan_id: str, status: str = "pending", authorization: str = Header(None)):
    _require_admin(clan_id, authorization)
    where = {"clan": clan_id}
    if status != "all":
        where["status"] = status
    return db_query("feedbacks", where=where, order_by="id DESC")


@router.post("/reply/{feedback_id}")
def reply(clan_id: str, feedback_id: int, req: ReplyFeedbackReq, authorization: str = Header(None)):
    admin = _require_admin(clan_id, authorization)
    rows = db_query("feedbacks", where={"id": feedback_id, "clan": clan_id})
    if not rows:
        raise HTTPException(status_code=404, detail="反馈不存在")
    reply_text = (req.reply or "").strip()
    if not reply_text:
        raise HTTPException(status_code=400, detail="回复内容不能为空")
    db_update(
        "feedbacks",
        {
            "status": "replied",
            "reply": reply_text,
            "replied_by": admin["name"],
            "replied_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        },
        {"id": feedback_id},
    )
    return {"message": "已回复"}