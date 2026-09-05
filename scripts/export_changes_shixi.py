# -*- coding: utf-8 -*-
"""
世系表格式导出程序
========================
把数据库中「审核通过」的族人信息变更（新生/结婚/去世），导出为 世系表.txt
的样式文本，供核对后并入族谱母本。

用法（在项目根目录）：
    python scripts/export_changes_shixi.py            # 生成条目，写入 世系表-新增条目.txt
    python scripts/export_changes_shixi.py --apply    # 直接合并进 世系表.txt（先备份 .bak）

信息顺序（参考 世系表.txt 每行）：
    名字：原名xx。生于…，逝于…。葬…。妻X氏，生于…。育子N：a、b、c。育女N：长女…，嫁…。电话：…。
"""
import json
import os
import re
import sqlite3
import sys
import shutil

sys.stdout.reconfigure(encoding="utf-8")

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_DIR, "backend"))
from shixi_export import CN_NUM, fmt_birth_line, gen_birth, gen_marriage, gen_death  # noqa: E402

SHIXI_PATH = os.path.join(PROJECT_DIR, os.environ.get("SHIXI_FILE", os.path.join("material", "chen", "世系表.txt")))
OUT_PATH = os.path.join(PROJECT_DIR, "material", "chen", "世系表-新增条目.txt")
DB_PATH = os.path.join(PROJECT_DIR, "backend", "data", "genealogy.db")
GBK = "gbk"
UTF8 = "utf-8"

CN_NUM_TO_INT = {v: k for k, v in enumerate(CN_NUM)}


def read_shixi():
    with open(SHIXI_PATH, "rb") as f:
        raw = f.read()
    return raw.decode(GBK).splitlines()


def write_shixi(lines):
    text = "\n".join(lines)
    # 与原文件保持一致：GBK 编码，行尾统一 \n（保留原样）
    with open(SHIXI_PATH, "wb") as f:
        f.write(text.encode(GBK))


def num_to_cn(n):
    if 0 <= n <= 10:
        return CN_NUM[n]
    if n < 20:
        return "十" + CN_NUM[n - 10]
    if n < 100:
        return CN_NUM[n // 10] + "十" + (CN_NUM[n % 10] if n % 10 else "")
    return str(n)


def cn_to_num(s):
    s = s.strip()
    try:
        return int(s)
    except ValueError:
        pass
    digits = {c: i for i, c in enumerate("零一二三四五六七八九")}
    if not s or any(c not in digits and c not in "十百" for c in s):
        return None
    total = 0
    num = 0
    for c in s:
        if c in digits:
            num = digits[c]
        elif c == "十":
            total += (num or 1) * 10
            num = 0
        elif c == "百":
            total += (num or 1) * 100
            num = 0
    total += num
    return total


def split_person_line(line):
    """把 '名字：内容' 拆成 (姓名, 内容)。标题行（第N代）返回 (None, line)"""
    m = re.match(r"^第[一二三四五六七八九十百0-9]+代：", line)
    if m:
        return None, line
    idx = line.find("：")
    if idx <= 0:
        return None, line if not line.strip() else line
    return line[:idx].strip(), line[idx + 1 :]


def strip_suffix(name):
    return re.sub(r"[A-Za-z]+$", "", name).rstrip()


def parse_shixi(lines):
    """解析世系表 → 人物列表。每项: {name, gen, line_idx, text}；gen 为 None 表示标题/空行"""
    people = []
    cur_gen = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        m = re.match(r"^第([一二三四五六七八九十百0-9]+)代：", stripped)
        if m:
            cur_gen = cn_to_num(m.group(1))
            people.append({"name": None, "gen": cur_gen, "line_idx": i, "text": stripped, "heading": True})
            continue
        if not stripped:
            continue
        name, content = split_person_line(stripped)
        people.append(
            {
                "name": name,
                "gen": cur_gen,
                "line_idx": i,
                "text": stripped,
                "content": content,
                "heading": False,
            }
        )
    return people


def find_person(people, raw_name):
    """按精确名找；找不到再去后缀、去陈姓前缀。返回人物 dict 或 None"""
    if not raw_name:
        return None
    candidates = [raw_name]
    base = strip_suffix(raw_name)
    if base != raw_name:
        candidates.append(base)
    if base.startswith("陈") and len(base) > 1:
        candidates.append(base[1:])
    for c in candidates:
        for p in people:
            if p.get("name") == c:
                return p
    return None


# ---------- 可选 --apply：合并进 世系表.txt ----------

def _parent_index_text(father_entry, child_name):
    """在父行中追加子名到 '育子N：…' 列表并更新计数；返回新 content 或 None"""
    content = father_entry.get("content") or ""
    if not content:
        return None
    # 匹配最后一个 "育子N：a、b、c。"（可能有多个子段落）
    pat = re.compile(r"(育子[一二三四五六七八九十百0-9]+：)([^。]+?)(。)", re.S)
    m = pat.search(content)
    if not m:
        return None
    count_str, names, end = m.group(1).replace("育子", "").rstrip("："), m.group(2), m.group(3)
    cur = cn_to_num(count_str)
    new_names = names.strip()
    if not new_names:
        new_names = child_name
    else:
        # 去掉已有同名/后缀，避免重复
        existing = [n.strip() for n in new_names.split("、") if n.strip()]
        base = strip_suffix(child_name)
        if any(strip_suffix(n) == base for n in existing):
            return None  # 已存在，不用加
        new_names = new_names + "、" + child_name
    next_num = (cur + 1) if cur is not None else None
    new_seg = f"育子{num_to_cn(next_num) if next_num is not None else count_str}：{new_names}{end}"
    content = content[: m.start()] + new_seg + content[m.end() :]
    return content


def _file_name(name):
    """世系表.txt 中人名省略陈姓前缀，故 apply 时去除。陈 以外的姓保留原样"""
    if name.startswith("陈") and len(name) > 1:
        return name[1:]
    return name


def apply_birth(people_full, ch):
    """把新生儿并入世系表：1) 父行育子列表追加；2) 新行插入到对应世代区块末尾"""
    lines = people_full["lines"]
    people = people_full["people"]
    father = ch.get("fatherName") or ""
    child = ch.get("childName") or ""
    if not child:
        return None
    child_file = _file_name(child)
    fe = find_person(people, father)
    updated = None
    if fe and not fe["heading"]:
        content = _parent_index_text(fe, child_file)
        if content is not None:
            idx = fe["line_idx"]
            new_text = (fe["name"] or "") + "：" + content
            lines[idx] = new_text
            updated = (idx, fe["text"], new_text)
    # 插入新生儿行：放在 父世代+1 的区块末尾（该区块最后一个标题行之后）
    child_gen = (fe["gen"] + 1) if fe else None
    insert_at = len(lines)
    if child_gen is not None:
        # 找第 child_gen 代的标题行
        start = None
        for i, p in enumerate(people):
            if p.get("heading") and p.get("gen") == child_gen:
                start = i
                break
        if start is not None:
            # 该区块内容到下一个标题行之前
            block_start_line = people[start]["line_idx"]
            end_line = len(lines)
            for p in people[start + 1 :]:
                if p.get("heading"):
                    end_line = p["line_idx"]
                    break
            insert_at = end_line  # 插到区块末尾（下一个标题前）
            # 若父亲行就在该区块，插在父亲行之后更合理
            if fe and fe["line_idx"] > block_start_line and fe["line_idx"] < insert_at:
                insert_at = fe["line_idx"] + 1
    new_line = fmt_birth_line(child_file, ch.get("birthDate") or "")
    lines.insert(insert_at, new_line)
    return updated


def merge_changes(changes):
    lines = read_shixi()
    people = parse_shixi(lines)
    for ch in changes:
        t = ch.get("type")
        if t == "birth":
            apply_birth({"lines": lines, "people": people}, ch)
        # marriage / death 只做提示，不自动改原文（配偶/逝日信息可能需人工核对）
    return lines


def main():
    apply_mode = "--apply" in sys.argv
    always = os.environ.get("CHANGE_SHIXI_SAVE", "0") == "1"

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT type, data, status, submitter_name, created_at FROM changes WHERE status='approved' ORDER BY id"
    ).fetchall()
    conn.close()

    changes = []
    for r in rows:
        try:
            data = json.loads(r["data"])
        except Exception:
            data = {}
        data["type"] = r["type"]
        data["_submitter"] = r["submitter_name"]
        changes.append(data)

    if not changes:
        print("没有审核通过的变更记录。")
        return

    sections = []
    for ch in changes:
        t = ch.get("type")
        if t == "birth":
            sections.extend(gen_birth(ch))
        elif t == "marriage":
            sections.extend(gen_marriage(ch))
        elif t == "death":
            sections.extend(gen_death(ch))
        sections.append("")

    if apply_mode:
        merged = merge_changes(changes)
        shutil.copyfile(SHIXI_PATH, SHIXI_PATH + ".bak")
        write_shixi(merged)
        print(f"已合并到 {os.path.basename(SHIXI_PATH)}（备份 {os.path.basename(SHIXI_PATH)}.bak）。")
    else:
        with open(OUT_PATH, "w", encoding=UTF8) as f:
            f.write("\n".join(sections))
        print(f"共 {len(changes)} 条已通过变更，条目已写入 {os.path.basename(OUT_PATH)}。")
    print("\n".join(sections))
    print("\n提示：--apply 模式会自动把「新生」的父行育子列表与新行并入世系表.txt；"
          "结婚/去世仅生成提示文本，需人工核对后补录。")


if __name__ == "__main__":
    main()