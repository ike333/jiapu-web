"""族人变化记录 API：新生 / 结婚 / 去世，提交后进入待审核（路径带谱前缀 /api/{clan_id}/changes）"""
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from auth import decode_token, token_clan, resolve_user
from db import db_insert, db_query

router = APIRouter(prefix="/api/{clan_id}/changes", tags=["changes"])


class ChangeBase(BaseModel):
    remark: Optional[str] = None


class BirthChange(ChangeBase):
    childName: str
    gender: str  # male | female
    birthDate: Optional[str] = None
    birthTime: Optional[str] = None
    fatherName: Optional[str] = None
    motherName: Optional[str] = None
    birthPlace: Optional[str] = None


class MarriageChange(ChangeBase):
    groomName: str
    brideName: Optional[str] = None
    brideBirthDate: Optional[str] = None
    marriageDate: Optional[str] = None


class DeathChange(ChangeBase):
    name: str
    deathDate: Optional[str] = None
    age: Optional[str] = None
    burialPlace: Optional[str] = None


def _current_user(clan_id: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="请先登录")
    if token_clan(authorization[7:]) != clan_id:
        raise HTTPException(status_code=401, detail="登录信息不属于当前谱系")
    user = resolve_user(decode_token(authorization[7:]), clan_id)
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    return user


@router.post("/birth")
def submit_birth(clan_id: str, req: BirthChange, authorization: str = Header(None)):
    user = _current_user(clan_id, authorization)
    db_insert(
        "changes",
        {
            "type": "birth",
            "data": json.dumps(req.model_dump(), ensure_ascii=False),
            "status": "pending",
            "clan": clan_id,
            "submitter_id": user["id"],
            "submitter_name": user["name"],
            "submitter_phone": user["phone"],
            "remark": req.remark,
        },
    )
    return {"message": "新生儿信息已提交，等待审核"}


@router.post("/marriage")
def submit_marriage(clan_id: str, req: MarriageChange, authorization: str = Header(None)):
    user = _current_user(clan_id, authorization)
    db_insert(
        "changes",
        {
            "type": "marriage",
            "data": json.dumps(req.model_dump(), ensure_ascii=False),
            "status": "pending",
            "clan": clan_id,
            "submitter_id": user["id"],
            "submitter_name": user["name"],
            "submitter_phone": user["phone"],
            "remark": req.remark,
        },
    )
    return {"message": "婚姻信息已提交，等待审核"}


@router.post("/death")
def submit_death(clan_id: str, req: DeathChange, authorization: str = Header(None)):
    user = _current_user(clan_id, authorization)
    db_insert(
        "changes",
        {
            "type": "death",
            "data": json.dumps(req.model_dump(), ensure_ascii=False),
            "status": "pending",
            "clan": clan_id,
            "submitter_id": user["id"],
            "submitter_name": user["name"],
            "submitter_phone": user["phone"],
            "remark": req.remark,
        },
    )
    return {"message": "去世信息已提交，等待审核"}


@router.get("/mine")
def my_changes(clan_id: str, authorization: str = Header(None)):
    user = _current_user(clan_id, authorization)
    rows = db_query(
        "changes",
        where={"submitter_id": user["id"], "clan": clan_id},
        order_by="id DESC",
    )
    for r in rows:
        try:
            r["data"] = json.loads(r["data"])
        except Exception:
            pass
    return rows


def _user_or_none(clan_id: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    if token_clan(authorization[7:]) != clan_id:
        return None
    return resolve_user(decode_token(authorization[7:]), clan_id)
