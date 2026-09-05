"""多多进宝（拼多多 CPS 导购）API：拉取商品 + 生成带 PID 的推广链接
GET /api/ddk/goods?keyword=茶叶&page=1&page_size=20
  - 公开接口（无需登录）
  - 调拼多多开放平台 pdd.ddk.goods.search 拉商品，pdd.ddk.goods.promotion.url.generate 转链
  - 凭证读环境变量 PDD_CLIENT_ID / PDD_CLIENT_SECRET / PDD_PID（backend/.env）
"""
import os
import datetime
import hashlib
import json
import urllib.request
import urllib.error
import urllib.parse
from fastapi import APIRouter
from typing import Optional

ADS_CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ads_config.json")


def _ads_enabled():
    try:
        with open(ADS_CONFIG_PATH, encoding="utf-8") as f:
            c = json.load(f)
        return c.get("enabled", True) and c.get("provider", "pdd") == "pdd"
    except Exception:
        return True


try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

router = APIRouter(prefix="/api/ddk", tags=["ddk"])

PDD_GATEWAY = "https://gw-api.pinduoduo.com/api/router"
PDD_CLIENT_ID = os.environ.get("PDD_CLIENT_ID", "")
PDD_CLIENT_SECRET = os.environ.get("PDD_CLIENT_SECRET", "")
PDD_PID = os.environ.get("PDD_PID", "")


def _sign(params: dict) -> str:
    sp = sorted(params.items(), key=lambda kv: kv[0])
    qs = "".join(f"{k}{v}" for k, v in sp)
    raw = PDD_CLIENT_SECRET + qs + PDD_CLIENT_SECRET
    return hashlib.md5(raw.encode("utf-8")).hexdigest().upper()


def _call(rtype: str, **biz) -> dict:
    params = {
        "type": rtype,
        "client_id": PDD_CLIENT_ID,
        "timestamp": str(int(datetime.datetime.now().timestamp())),
        "format": "JSON",
        "sign_method": "md5",
    }
    for k, v in biz.items():
        if v is None:
            continue
        params[k] = v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)
    params["sign"] = _sign(params)
    data = urllib.parse.urlencode(params, quote_via=urllib.parse.quote).encode("utf-8")
    req = urllib.request.Request(
        PDD_GATEWAY,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _fen_to_yuan(fen: Optional[int]) -> Optional[float]:
    return None if fen is None else round(fen / 100, 2)


@router.get("/goods")
def ddk_goods(keyword: str = "", page: int = 1, page_size: int = 20):
    if not _ads_enabled():
        return {"items": [], "total": 0, "configured": True, "ads_disabled": True}
    # 拼多多网关要求 page_size ∈ [10,100]，越界直接 50001 参数校验失败
    page_size = min(max(int(page_size), 10), 100)
    page = max(int(page), 1)
    if not (PDD_CLIENT_ID and PDD_CLIENT_SECRET and PDD_PID):
        return {
            "items": [],
            "total": 0,
            "configured": False,
            "message": "未配置拼多多开放平台凭证（PDD_CLIENT_ID/PDD_CLIENT_SECRET/PDD_PID）",
        }

    # 1) 拉商品
    try:
        search = _call(
            "pdd.ddk.goods.search",
            keyword=(keyword or "").strip() or "热门",
            pid=PDD_PID,
            page=page,
            page_size=min(page_size, 100),
            sort_type=0,
        )
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "ignore")
        return {"items": [], "total": 0, "error": f"搜索接口错误: {e.code} {detail}"}
    except Exception as e:
        return {"items": [], "total": 0, "error": f"搜索接口异常: {e}"}

    err = search.get("error_response")
    if err:
        return {"items": [], "total": 0, "error": err.get("error_msg", "拼多多返回错误")}

    glist = (search.get("goods_search_response") or {}).get("goods_list", []) or []
    if not glist:
        return {"items": [], "total": 0, "configured": True}

    # 2) 批量转链
    goods_sign_list = [g.get("goods_sign") for g in glist if g.get("goods_sign")]
    url_map: dict = {}
    if goods_sign_list:
        try:
            promo = _call(
                "pdd.ddk.goods.promotion.url.generate",
                p_id=PDD_PID,
                goods_sign_list=goods_sign_list,
                generate_short_url=True,
                generate_mobile=True,
                multi_group=False,
            )
            perr = promo.get("error_response")
            if not perr:
                ulist = (promo.get("goods_promotion_url_generate_response") or {}).get(
                    "goods_promotion_url_list", []
                ) or []
                for gs, u in zip(goods_sign_list, ulist):
                    url_map[gs] = u
        except Exception:
            pass

    items = []
    for g in glist:
        gs = g.get("goods_sign")
        u = url_map.get(gs) or {}
        promo_url = (
            u.get("short_url")
            or u.get("url")
            or u.get("mobile_short_url")
            or u.get("mobile_url")
            or ""
        )
        coupon = _fen_to_yuan(g.get("coupon_discount"))
        origin = _fen_to_yuan(g.get("min_group_price"))
        coupon_price = (round(origin - coupon, 2) if (origin is not None and coupon) else origin)
        tag = "券" if coupon else (g.get("sales_tip") or "")
        items.append(
            {
                "id": gs,
                "title": g.get("goods_name", ""),
                "image": g.get("goods_thumbnail_url", ""),
                "couponPrice": coupon_price,
                "originPrice": origin,
                "promoUrl": promo_url,
                "tag": tag,
                "mallName": g.get("mall_name", ""),
                "salesTip": g.get("sales_tip", ""),
            }
        )

    total = (search.get("goods_search_response") or {}).get("total_count", len(items))
    return {"items": items, "total": total, "configured": True}


@router.get("/authorize")
def ddk_authorize():
    """生成多多进宝推广位 PID 的授权备案链接（换 PID 时自助获取，无需手算）。

    返回 {url, mobile_url}；用拼多多 APP 打开 mobile_url（或浏览器打开 url），
    登录多多客账号授权即完成 PID 备案，之后 /api/ddk/goods 正常返回带推广链接的商品。
    """
    if not (PDD_CLIENT_ID and PDD_CLIENT_SECRET and PDD_PID):
        return {
            "configured": False,
            "error": "未配置拼多多开放平台凭证（PDD_CLIENT_ID/PDD_CLIENT_SECRET/PDD_PID）",
        }
    try:
        r = _call(
            "pdd.ddk.rp.prom.url.generate",
            p_id_list=[PDD_PID],
            channel_type=10,
            generate_we_app=False,
        )
    except urllib.error.HTTPError as e:
        return {"configured": True, "error": f"备案接口错误: {e.code} {e.read().decode('utf-8', 'ignore')}"}
    except Exception as e:
        return {"configured": True, "error": f"备案接口异常: {e}"}
    err = r.get("error_response")
    if err:
        return {"configured": True, "error": err.get("error_msg", "拼多多返回错误")}
    ulist = (r.get("rp_promotion_url_generate_response") or {}).get("url_list", []) or []
    if not ulist:
        return {"configured": True, "error": "未返回授权链接"}
    return {
        "configured": True,
        "url": ulist[0].get("url", ""),
        "mobile_url": ulist[0].get("mobile_url", ""),
        "tip": "用拼多多 APP 打开 mobile_url（或浏览器打开 url），登录多多客账号授权即完成 PID 备案；授权后 /api/ddk/goods 即可正常返回带推广链接的商品",
    }
