"""
解析 王氏中间稿 wang_mid.txt → src/data/clans/wang/genealogy.json
中间稿顺序为深度优先（父总在子前），父子用"最近同名父"匹配；
同父同名自动加 A/B 后缀（如万鼎两女国娥 → 国娥、国娥A）。
用法：python scripts/build_wang_genealogy.py
"""
import json
import os
import re

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MID = os.path.join(os.environ.get("TEMP", "C:/Users/chenbo/AppData/Local/Temp"), "opencode", "wang_mid.txt")
OUT_PATH = os.path.join(PROJECT_DIR, "src", "data", "clans", "wang", "genealogy.json")

ORDER_RE = re.compile(
    r"^(王)?([\u4e00-\u9fff·]+?)\s*(长子|次子|三子|四子|五子|六子|七子|八子|九子|之子|之女|长女|次女|三女|四女|五女|六女|继子|嗣子)(?:（[^）]+）)?$"
)

SPECIAL = {
    "永太": ("始祖", "次子", "永泰"),
    "永吉": ("始祖", "三子", None),
    "永庆": ("始祖", "四子", None),
    "可奉": ("仁德", "之子", None),
    "降霞": ("屏恩", "之女", None),
    "万寿": ("屏燦", "之子", None),
}

FATHER_MAP = {
    "宗安": "安",
    "宗勇": "勇",
    "永太": "永泰",
}


def norm(name):
    n = name.strip()
    n = n.replace("琮", "宗").replace("鋒", "锋").replace("锋", "峰")
    n = n.replace("桀", "杰").replace("州", "洲").replace("德花", "小花")
    return n


def is_decl(detail):
    d = detail.strip()
    if d in ("后续。", "已续。", "后续", "已续"):
        return True
    if d.startswith("过继") and len(d) <= 30 and d.endswith(("后续。", "已续。", "后续", "已续")):
        return True
    return False


def parse_line(line):
    if line.startswith("## ") or line.startswith("== "):
        return None
    parts = line.split("|")
    if len(parts) < 2:
        return None
    rank = parts[0].strip()
    name_part = parts[1].strip()
    detail = "|".join(parts[2:]).strip() if len(parts) > 2 else ""
    alias = ""
    m = re.match(r"^(.*?)\s*（([^）]+)）$", name_part)
    if m:
        name = m.group(1).strip()
        alias = m.group(2).strip()
    else:
        name = name_part
    return {"rank": rank, "name": name, "alias": alias, "detail": detail}


def collect_nodes():
    """解析中间稿 → nodes 列表（name/gender/detail/father/order/gen）"""
    with open(MID, encoding="utf-8") as f:
        lines = [l.rstrip("\n") for l in f if l.strip()]

    recs = [r for r in (parse_line(l) for l in lines) if r]
    has_detail = {r["name"] for r in recs if not is_decl(r["detail"])}

    root_detail = ("来旬始祖（始祖父、始祖母，名不详）：湖北省黄州府麻城县人氏，"
                   "贸易至陕西省兴安府旬阳县（洵阳）投籍落业，定居旬阳县城北门内。"
                   "始祖父葬旬阳县北路蔡家湾老茔丁山癸向；始祖母葬蒿塔塘老茔正坐甲山庚向。"
                   "生四子：永昌、永泰、永吉、永庆。")
    nodes = [{"name": "始祖", "gender": "male", "detail": root_detail,
              "father": None, "order": "始祖", "gen": 1}]

    def find_father(father_name):
        cands = []
        for c in (FATHER_MAP.get(father_name, father_name), father_name):
            if c not in cands:
                cands.append(c)
        for cand in cands:
            nc = norm(cand)
            for nd in reversed(nodes):
                if norm(nd["name"]) == nc:
                    return nd
        return None

    for rec in recs:
        name = rec["name"]
        rank = rec["rank"]
        alias = rec["alias"]
        detail = rec["detail"]

        if is_decl(detail) and name in has_detail:
            continue

        if rank:
            clean_rank = re.sub(r"\s*王\s*$", "", rank).strip()
            m = ORDER_RE.match(clean_rank)
            if not m:
                raise SystemExit(f"无法解析排行: {rank}")
            father = m.group(2)
            order = m.group(3)
            rm = re.search(r"（([^）]+)）", rank)
            rank_note = rm.group(1) if rm else ""
        else:
            if name not in SPECIAL:
                raise SystemExit(f"rank 为空且无 SPECIAL: {name}")
            father, order, fixed = SPECIAL[name]
            rank_note = ""
            if fixed:
                name = fixed

        father = father.lstrip("王")

        if name == "景" and father == "训":
            continue

        if name == "仁贵":
            cut = detail.find("明倫堂")
            if cut > 0:
                detail = detail[:cut].rstrip()

        gender = "female" if "女" in order else "male"

        prefix_parts = []
        if alias:
            prefix_parts.append(alias)
        if rank_note:
            prefix_parts.append(rank_note)
        if prefix_parts:
            detail = "（" + "，".join(prefix_parts) + "）" + detail

        f = find_father(father)
        if f is None:
            if father == "正经":
                zj_father = find_father("可泰")
                if not zj_father:
                    raise SystemExit("正经占位: 可泰未找到")
                nodes.append({"name": "正经", "gender": "male",
                              "detail": "（可泰四子）无可考记录。",
                              "father": "可泰", "order": "四子",
                              "gen": zj_father["gen"] + 1})
                f = nodes[-1]
            elif norm(father) == "治恩":
                zl_father = find_father("宗良")
                if not zl_father:
                    raise SystemExit("马治恩占位: 宗良未找到")
                nodes.append({"name": "马治恩", "gender": "male",
                              "detail": "（继子）无详细资料。",
                              "father": "宗良", "order": "继子",
                              "gen": zl_father["gen"] + 1})
                f = nodes[-1]
            else:
                raise SystemExit(f"孤儿: {name} 父={father} 未找到")

        nodes.append({"name": name, "gender": gender, "detail": detail,
                      "father": f["name"], "order": order, "gen": f["gen"] + 1})

    return nodes


def build_tree(nodes):
    """nodes → 树；同父同名加 A/B 后缀；返回 roots"""
    index = {}          # name -> [节点]（添加顺序，父引用取最近）
    roots = []
    for nd in nodes:
        node_dict = {"name": nd["name"], "gender": nd["gender"],
                     "detail": nd["detail"], "children": []}
        if nd["father"] is None:
            roots.append(node_dict)
        else:
            cands = index.get(nd["father"])
            if not cands:
                raise SystemExit(f"构建孤儿: {nd['name']} 父={nd['father']}")
            parent = cands[-1]
            # 同父同名 → A/B/C 后缀
            used = {c["name"] for c in parent["children"]}
            base = nd["name"]
            if base in used:
                suffix = "A"
                while base + suffix in used:
                    suffix = chr(ord(suffix) + 1)
                node_dict["name"] = base + suffix
            parent["children"].append(node_dict)
        index.setdefault(nd["name"], []).append(node_dict)
    return roots


def main():
    nodes = collect_nodes()
    roots = build_tree(nodes)

    count = [0]

    def walk(ns):
        for nd in ns:
            count[0] += 1
            walk(nd["children"])

    walk(roots)
    print(f"总人数: {count[0]}")

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(roots, f, ensure_ascii=False, indent=2)
    print(f"已生成 {OUT_PATH} ({os.path.getsize(OUT_PATH):,} bytes)")


if __name__ == "__main__":
    main()