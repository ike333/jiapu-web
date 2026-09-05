"""族谱身份校验：从 clans/{clanId}/genealogy.json 构建索引，注册时校验"姓名+父亲姓名(+母亲姓氏)"是否匹配
防止陌生人注册提交虚假信息。族谱数据更新后需重新复制 src/data/clans/{clanId}/genealogy.json 到本文件同目录。

校验规则：
- 姓名必须精确存在于族谱；如未找到，去掉字母后缀再试（陈仁勇A -> 陈仁勇）
- 父亲姓名：先按精确名找父子关系；匹配不到时尝试去后缀回退（覆盖祖谱用A/B/C/D区分同名兄弟的情况）
- 母亲：从父亲节点的 detail 提取配偶"姓"集合，注册者母亲姓须命中其一
  （"宋氏"→宋，"王莉"→王）。父亲无配偶记录或父节点缺失时跳过母亲校验
"""
import json
import os
import re

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "clans")

# 缓存：clan_id -> {精确名 -> {fathers:set[精确父名], mothers:{精确父名:set[姓]}}}
_indexes: dict = {}


def _surname_of(spouse_name: str) -> str:
    s = spouse_name.strip()
    if not s:
        return ""
    if s.endswith("氏"):
        return s[0]
    return s[0]


def _strip_suffix(name: str) -> str:
    """去字母后缀：陈仁勇A -> 陈仁勇"""
    return re.sub(r"[A-Za-z]+$", "", name).rstrip()


def _data_path(clan_id: str) -> str:
    return os.path.join(DATA_DIR, clan_id, "genealogy.json")


def _build_index(clan_id: str):
    global _indexes
    if clan_id in _indexes:
        return _indexes[clan_id]

    path = _data_path(clan_id)
    if not os.path.exists(path):
        _indexes[clan_id] = {}
        return _indexes[clan_id]

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    index: dict = {}
    # father_name 精确名 -> 该节点 detail 中配偶的姓集合
    spouses_of: dict[str, set[str]] = {}

    def collect_spouses(detail: str, out: list):
        """提取 detail 中所有配偶名：'妻宋氏' / '许安英' / '妻刘氏、王氏' """
        if not detail:
            return
        raw = re.findall(r"妻([^，。,\r\n]+?)(?:，|。|$|[\r\n])", detail)
        for r in raw:
            for it in re.split(r"[、,，]", r):
                it = it.strip()
                if it:
                    out.append(it)

    def walk(nodes, father_key):
        for node in nodes:
            name = node.get("name", "").strip()
            if not name:
                continue
            entry = index.setdefault(name, {"fathers": set(), "mothers": {}})
            if father_key:
                entry["fathers"].add(father_key)
            # 记录本节点配偶（供"本节点的子女"校验母亲）
            sp_out = []
            collect_spouses(node.get("detail") or "", sp_out)
            surns = {_surname_of(s) for s in sp_out if _surname_of(s)}
            if surns:
                spouses_of.setdefault(name, set()).update(surns)
            if node.get("children"):
                walk(node["children"], name)

    walk(data, None)

    # 合并：person.mothers[父亲名] = 父亲节点的配偶姓集合
    for person_name, entry in index.items():
        for fh in entry["fathers"]:
            if fh in spouses_of:
                entry["mothers"].setdefault(fh, set()).update(spouses_of[fh])

    _indexes[clan_id] = index
    return _indexes[clan_id]


def _lookup(clan_id: str, raw_name: str):
    """按精确名查；找不到则尝试去后缀。返回 (entry, 命中的原名)"""
    index = _build_index(clan_id)
    n = (raw_name or "").strip()
    if not n:
        return None, None
    if n in index:
        return index[n], n
    stripped = _strip_suffix(n)
    if stripped and stripped in index and stripped != n:
        return index[stripped], stripped
    return None, None


def _father_matches(entry, father_raw: str):
    """father 是否在 entry['fathers']；支持精确与去后缀回退"""
    f = (father_raw or "").strip()
    if not f:
        return None  # 未填父亲，返回 None 表示"未校验父亲"
    if f in entry["fathers"]:
        return f
    fs = _strip_suffix(f)
    if fs and fs in entry["fathers"]:
        return fs
    return False


def verify_person(clan_id: str, name: str, father_name: str | None, mother_name: str | None = None) -> bool:
    name = (name or "").strip()
    if not name:
        return False
    entry, _ = _lookup(clan_id, name)
    if not entry:
        return False

    # 父亲为空：只要求姓名存在
    father = (father_name or "").strip()
    if not father:
        return True

    matched = _father_matches(entry, father)
    if not matched:
        return False

    # 父亲真实匹配。母亲：命中父之配偶姓即可；无配偶记录则跳过
    mset = entry["mothers"].get(matched, set())
    if not mset:
        return True
    mother = (mother_name or "").strip()
    if not mother:
        return False
    return _surname_of(mother) in mset


def name_exists(clan_id: str, name: str) -> bool:
    entry, _ = _lookup(clan_id, name)
    return entry is not None