"""广告总开关配置：全局单开关 + 场景关键词（admin 可改，立即生效，无需重启）

GET  /api/ads/config  -> { enabled, scenes }          (公开)
POST /api/ads/config  -> { enabled, scenes }          (仅 admin，Body: {enabled?, scenes?})
"""
import json
import os
from fastapi import APIRouter, HTTPException, Header
from auth import decode_token

router = APIRouter(prefix="/api/ads", tags=["ads"])

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ads_config.json")

DEFAULT_CONFIG = {
    "enabled": True,
    "provider": "pdd",
    "baidu_code": "",
    "scenes": {
        "birthday": "寿礼 生日礼 养生",
        "marriage": "喜糖 婚庆礼盒 红包",
        "memorial": "鲜花 祭祀用品",
        "baby": "长命锁 婴儿用品",
        "festival": "中秋礼盒 特产",
    },
}


def _load():
    try:
        with open(CONFIG_PATH, encoding="utf-8") as f:
            cfg = json.load(f)
        cfg.setdefault("enabled", True)
        provider = cfg.get("provider", "pdd")
        cfg["provider"] = provider if provider in ("pdd", "baidu", "off") else "pdd"
        cfg.setdefault("baidu_code", "")
        cfg.setdefault("scenes", DEFAULT_CONFIG["scenes"])
        return cfg
    except Exception:
        return dict(DEFAULT_CONFIG)


def _save(cfg):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


def _require_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="请先登录")
    try:
        subject = decode_token(authorization[7:])
    except Exception:
        raise HTTPException(status_code=401, detail="登录已失效")
    if subject != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return subject


@router.get("/config")
def get_config():
    cfg = _load()
    return {
        "enabled": cfg["enabled"],
        "provider": cfg["provider"],
        "baidu_code": cfg.get("baidu_code", ""),
        "scenes": cfg["scenes"],
    }


@router.post("/config")
def update_config(payload: dict, authorization: str = Header(None)):
    _require_admin(authorization)
    cfg = _load()
    if "enabled" in payload:
        cfg["enabled"] = bool(payload["enabled"])
    if "provider" in payload and payload["provider"] in ("pdd", "baidu", "off"):
        cfg["provider"] = payload["provider"]
    if "baidu_code" in payload:
        cfg["baidu_code"] = str(payload["baidu_code"] or "")
    if "scenes" in payload and isinstance(payload["scenes"], dict):
        cfg["scenes"] = {k: str(v) for k, v in payload["scenes"].items()}
    _save(cfg)
    return {
        "enabled": cfg["enabled"],
        "provider": cfg["provider"],
        "baidu_code": cfg.get("baidu_code", ""),
        "scenes": cfg["scenes"],
    }
