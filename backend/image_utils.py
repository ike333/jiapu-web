"""图片压缩工具：上传照片时自动压到目标大小以内，避免不熟悉图片处理的用户被 1MB 限制难倒。

策略：
- 保持原图比例与观感，仅当体积超过目标时才压缩。
- JPEG：循环降低 quality，使体积收敛到目标以下。
- 尺寸过大的图先等比缩到 MAX_DIMENSION。
- PNG（含透明）与 GIF 动图等无法无损压小的，转成 JPEG（白底，单帧 PNG 直接转，动图取第一帧）。
"""
from io import BytesIO

from PIL import Image

# 目标体积上限（字节）：留足余量，保证落盘后远小于 Nginx 的 1MB 阈值
TARGET_SIZE = 900 * 1024  # 900KB
# 最长边上限（像素），超出先等比缩小，避免超大分辨率图
MAX_DIMENSION = 4000
# 起始 JPEG 质量
START_QUALITY = 90
# 质量下限，低于此已无法再降（此时直接接受接近目标的结果）
MIN_QUALITY = 40


def _to_rgb(img: Image.Image) -> Image.Image:
    """转为 RGB：处理 RGBA/LA/P 等带透明或调色板模式，透明区域铺白底。"""
    if img.mode in ("RGBA", "LA"):
        rgba = img.convert("RGBA")
        background = Image.new("RGB", rgba.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.getchannel("A"))
        return background
    return img.convert("RGB")


def _shrink_if_huge(img: Image.Image) -> Image.Image:
    """若最长边超过 MAX_DIMENSION，等比缩小。"""
    w, h = img.size
    longest = max(w, h)
    if longest <= MAX_DIMENSION:
        return img
    ratio = MAX_DIMENSION / longest
    return img.resize((max(1, round(w * ratio)), max(1, round(h * ratio))), Image.LANCZOS)


def _jpeg_bytes(img: Image.Image, quality: int) -> bytes:
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    return buf.getvalue()


def compress_image(data: bytes) -> tuple[bytes, str]:
    """把上传的图片字节压缩到 TARGET_SIZE 以内。

    返回 (字节, 扩展名)：压缩后可能转为 JPEG（扩展名 .jpg），未压缩则保持原格式扩展名。
    """
    img = None
    try:
        img = Image.open(BytesIO(data))
        img.load()
    except Exception:
        # 无法解析的图片（或 Pillow 不支持的格式）：不做处理，交由上层校验/原样保存
        ext = "." + (img.format.lower() if img and img.format else "bin")
        return data, ext

    if len(data) <= TARGET_SIZE:
        # 已达标，原样返回，保持原格式扩展名
        ext = "." + (img.format or "jpg").lower()
        return data, ext

    if img.format == "GIF" and getattr(img, "is_animated", False):
        # 动图：取第一帧转 JPEG（保留动画意义不大，体积优先）
        img.seek(0)
        frame = img.convert("RGBA")
        rgb = Image.new("RGB", frame.size, (255, 255, 255))
        rgb.paste(frame, mask=frame.getchannel("A"))
        img = rgb
    else:
        img = _to_rgb(img)

    img = _shrink_if_huge(img)
    img = img.copy()

    # 先线性降质量；若到 MIN_QUALITY 仍未达标，再逐步缩小分辨率继续压（保证收敛到目标内）
    current = img
    max_side = max(current.size)
    while True:
        for quality in range(START_QUALITY, MIN_QUALITY - 1, -5):
            out = _jpeg_bytes(current, quality)
            if len(out) <= TARGET_SIZE:
                return out, ".jpg"
        # 降质量不足以达标：缩小到 90% 分辨率，继续；分辨率过小则接受当前结果
        if max_side < 400 or current.size[0] < 200 or current.size[1] < 200:
            return _jpeg_bytes(current, MIN_QUALITY), ".jpg"
        w, h = current.size
        current = current.resize(
            (max(1, round(w * 0.9)), max(1, round(h * 0.9))), Image.LANCZOS
        )
