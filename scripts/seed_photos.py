"""把静态 photo_map.json 中的旧照片迁移到后端 uploads 目录 + photos 表（幂等可重跑）

命名规范：本人照片 {姓名}.jpg，配偶照片 {姓名}O.jpg（姓名含 A/B/C 后缀）。
源文件：public/images/{clanId}/{photo_map中的文件名}
目标：backend/uploads/{clanId}/{新文件名}
用法：python scripts/seed_photos.py [clan_id ...]  （缺省全部谱）
"""
import json
import os
import shutil
import sqlite3
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "public", "images")
DATA_DIR = os.path.join(ROOT, "src", "data", "clans")
UPLOAD_BASE = os.path.join(ROOT, "backend", "uploads")
DB_PATH = os.path.join(ROOT, "backend", "data", "genealogy.db")

CLANS = ["chen", "zhao", "wang"]


def seed(clan_id: str):
    photo_map_path = os.path.join(DATA_DIR, clan_id, "photo_map.json")
    if not os.path.exists(photo_map_path):
        print(f"[{clan_id}] 无 photo_map.json，跳过")
        return
    with open(photo_map_path, "r", encoding="utf-8") as f:
        photo_map = json.load(f)

    src_clan = os.path.join(SRC_DIR, clan_id)
    dst_clan = os.path.join(UPLOAD_BASE, clan_id)
    os.makedirs(dst_clan, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    count = 0
    for person_name, info in photo_map.items():
        for slot in ("self", "spouse"):
            raw = info.get(slot)
            if not raw:
                continue
            ext = os.path.splitext(raw)[1].lower() or ".jpg"
            if slot == "spouse":
                new_name = f"{person_name}O{ext}"
            else:
                new_name = f"{person_name}{ext}"
            src = os.path.join(src_clan, os.path.basename(raw.replace("\\", "/")))
            dst = os.path.join(dst_clan, new_name)
            if os.path.exists(src):
                shutil.copy2(src, dst)
                conn.execute(
                    "INSERT INTO photos (clan, person_id, slot, filename, uploaded_by) VALUES (?, ?, ?, ?, ?) "
                    "ON CONFLICT(clan, person_id, slot) DO UPDATE SET filename=excluded.filename, "
                    "uploaded_by=excluded.uploaded_by",
                    (clan_id, person_name, slot, new_name, "seed"),
                )
                count += 1
            else:
                print(f"  [警告] 源文件不存在：{src}")
    conn.commit()
    conn.close()
    print(f"[{clan_id}] 迁移完成：{count} 张照片")


def main():
    clans = sys.argv[1:] if len(sys.argv) > 1 else CLANS
    for c in clans:
        seed(c)


if __name__ == "__main__":
    main()