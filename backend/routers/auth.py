"""认证相关 API：发送验证码、注册、登录、当前用户（路径带谱前缀 /api/{clan_id}/auth）"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from auth import (
    hash_password,
    verify_password,
    create_token,
    decode_token,
    token_clan,
    resolve_user,
    send_sms_code,
    verify_code,
    find_user_by_phone,
    get_user,
    ADMIN_PASSWORD,
)
from identity import verify_person
from db import db_insert

router = APIRouter(prefix="/api/{clan_id}/auth", tags=["auth"])


class SendCodeReq(BaseModel):
    phone: str
    purpose: str  # register | login


class RegisterReq(BaseModel):
    phone: str
    code: str
    name: str
    password: str
    fatherName: str = ""  # 族谱中该人的父亲姓名
    motherName: str = ""  # 族谱中母亲姓名（用于加一道校验）


class LoginReq(BaseModel):
    phone: str
    password: str


class CodeLoginReq(BaseModel):
    phone: str
    code: str


@router.post("/send-code")
def send_code(clan_id: str, req: SendCodeReq):
    if len(req.phone) != 11 or not req.phone.isdigit():
        raise HTTPException(status_code=400, detail="手机号格式不正确")
    if req.purpose not in ("register", "login"):
        raise HTTPException(status_code=400, detail="purpose 必须是 register 或 login")

    code = send_sms_code(req.phone, req.purpose)
    # 模拟模式：验证码直接返回，真实短信接入后移除该返回
    return {
        "message": "验证码已发送",
        "simulated": not hasattr(code, "startswith") or code is None,
        "dev_code": code,  # 模拟模式下返回，便于测试
    }


class AdminLoginReq(BaseModel):
    password: str


@router.post("/admin-login")
def admin_login(clan_id: str, req: AdminLoginReq):
    from hmac import compare_digest

    if not req.password or not compare_digest(req.password, ADMIN_PASSWORD):
        raise HTTPException(status_code=400, detail="管理员密码错误")
    token = create_token("admin", clan_id)
    return {"token": token, "user": resolve_user("admin", clan_id)}


@router.post("/register")
def register(clan_id: str, req: RegisterReq):
    if len(req.phone) != 11 or not req.phone.isdigit():
        raise HTTPException(status_code=400, detail="手机号格式不正确")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="密码至少 6 位")
    if not verify_code(req.phone, "register", req.code):
        raise HTTPException(status_code=400, detail="验证码错误或已过期")

    if find_user_by_phone(req.phone, clan_id):
        raise HTTPException(status_code=400, detail="该手机号已注册")

    if not verify_person(clan_id, req.name, req.fatherName, req.motherName):
        raise HTTPException(
            status_code=400,
            detail=(
                "姓名与族谱不一致，无法完成注册。请确认填写的姓名（含误字）与族谱一致，"
                "父亲、母亲姓名与族谱记载相符；如您是族人后代或配偶，请联系管理员协助登记"
            ),
        )

    user_id = db_insert(
        "users",
        {
            "phone": req.phone,
            "name": req.name.strip(),
            "password": hash_password(req.password),
            "role": "user",
            "clan": clan_id,
        },
    )
    return {"token": create_token(user_id, clan_id), "user": get_user(user_id, clan_id)}


@router.post("/login")
def login(clan_id: str, req: LoginReq):
    user = find_user_by_phone(req.phone, clan_id)
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=400, detail="手机号或密码错误")
    return {"token": create_token(user["id"], clan_id), "user": user}


@router.post("/code-login")
def code_login(clan_id: str, req: CodeLoginReq):
    if not verify_code(req.phone, "login", req.code):
        raise HTTPException(status_code=400, detail="验证码错误或已过期")
    user = find_user_by_phone(req.phone, clan_id)
    if not user:
        raise HTTPException(status_code=400, detail="该手机号未注册，请先注册")
    return {"token": create_token(user["id"], clan_id), "user": user}


@router.get("/me")
def me(clan_id: str, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登录")
    subject = decode_token(authorization[7:])
    # 校验 token 所属谱与路径一致
    if token_clan(authorization[7:]) != clan_id:
        raise HTTPException(status_code=401, detail="登录信息不属于当前谱系")
    user = resolve_user(subject, clan_id)
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    # 不返回密码哈希
    user.pop("password", None)
    return user
