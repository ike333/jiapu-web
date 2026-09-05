"""
解析 赵氏整理01.md → src/data/clans/zhao/genealogy.json
依据：辈分标注 + 文本顺序（栈式遍历），承嗣跨辈用 generation 覆盖。
用法：python scripts/build_zhao_genealogy.py
"""
import json
import os
import re

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD_PATH = os.path.join(PROJECT_DIR, "material", "zhao", "赵氏整理01.md")
OUT_DIR = os.path.join(PROJECT_DIR, "src", "data", "clans", "zhao")

# 承嗣跨辈：generation 覆盖（血缘辈分）
GEN_OVERRIDE = {
    "美均A": 12,  # 血缘济斌长子=12世，挂崇满A(10世)下
    "贤武A": 13,  # 济生外孙=美群之子，血缘13世，挂济生(11世)下
}

# 女儿提取：从 detail 的"生女X：..."片段提取女性，作为 female 子节点
# 有名者用原名；无名者用占位名"赵长女/赵次女"（与陈氏"陈长女"一致），detail 保留"配夫XXX"
DAUGHTER_RE = re.compile(r"生女[一二三四五六七八九十]+[:：]([^。\n]*)")
DAUGHTER_NAME_RE = re.compile(r"^(?:长|次|三|四|五|六|七|八|九|十|幺)?女|配夫.*$")
CN_ORDER = ["长", "次", "三", "四", "五", "六", "七", "八", "九", "十"]


def extract_daughters(detail):
    """从 detail 提取女儿名列表，返回 [(name, detail), ...]"""
    out = []
    for sm in DAUGHTER_RE.finditer(detail or ""):
        seg = re.split(r"[，,]", sm.group(1).strip())[0].strip()
        if not seg:
            continue
        order = 0
        for part in re.split(r"[、，]", seg):
            part = part.strip()
            if not part:
                continue
            order += 1
            order_label = CN_ORDER[order - 1] if order <= len(CN_ORDER) else str(order)
            name = DAUGHTER_NAME_RE.sub("", part).strip()
            if name:
                out.append((name, ""))
            else:
                # 无名：用"赵{序}女"占位，detail 保留原文（含配夫信息）
                out.append((f"赵{order_label}女", part))
    return out


def parse_node(line):
    """解析节点行，返回 (gen, name, detail) 或 None"""
    line = line.strip()
    m = re.match(r"^#{2,6}\s+(\d{1,2})世\s+([^\s（(]+)(?:\s*[（(]([^）)]*)[）)])?\s*$", line)
    if m:
        return int(m.group(1)), m.group(2), ""
    m = re.match(r"^-?\s*\**(\d{1,2})世\s+([^*\s（(]+)(?:\s*[（(]([^）)]*)[）)])?\**\s*：?(.*)$", line)
    if m:
        return int(m.group(1)), m.group(2), (m.group(4) or "").strip()
    return None


def main():
    with open(MD_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    stack = []
    roots = []
    name_index = {}

    for raw in lines:
        node = parse_node(raw)
        if node is None:
            continue
        gen, name, detail = node
        if name == "四大房":
            continue

        node_dict = {
            "name": name,
            "gender": "male",
            "detail": detail,
            "children": [],
        }
        if name in GEN_OVERRIDE:
            node_dict["generation"] = GEN_OVERRIDE[name]

        parent = None
        if name == "赵雨" and "世玉" in name_index:
            parent = name_index["世玉"]
        else:
            while stack and stack[-1][0] >= gen:
                stack.pop()
            if stack:
                parent = stack[-1][1]
        if parent is None:
            roots.append(node_dict)
        else:
            parent["children"].append(node_dict)

        # 从 detail 提取女儿，追加为 female 子节点（辈分=父+1，房支继承父）
        for dname, ddetail in extract_daughters(detail):
            dnode = {
                "name": dname,
                "gender": "female",
                "detail": ddetail,
                "children": [],
            }
            node_dict["children"].append(dnode)

        stack.append((gen, node_dict))
        name_index[name] = node_dict

    errors = []
    person_count = [0]

    def walk(nodes, parent_gen, parent_name):
        for nd in nodes:
            person_count[0] += 1
            gen = nd.get("generation", (parent_gen + 1) if parent_gen is not None else 1)
            expected = (parent_gen + 1) if parent_gen is not None else 1
            if nd.get("generation") is None and gen != expected:
                errors.append(f"{nd['name']}: 父{parent_name}辈分{parent_gen}, 应{expected}, 实{gen}")
            walk(nd["children"], gen, nd["name"])

    walk(roots, None, None)
    print(f"根节点数: {len(roots)}, 总人数: {person_count[0]}")
    if errors:
        print("校验错误:")
        for e in errors:
            print("  " + e)
        return

    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, "genealogy.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(roots, f, ensure_ascii=False, indent=2)
    print(f"已生成 {out_path} ({os.path.getsize(out_path):,} bytes)")


if __name__ == "__main__":
    main()