"""
生成 public/data/clans/{clanId}/people.json
从 clans/{clanId}/genealogy.json + photo_map.json 生成展平的人物数据
供客户端人物详情页使用

用法：
    python scripts/generate_people_data.py            # 生成全部谱
    python scripts/generate_people_data.py chen        # 只生成指定谱
"""
import json
import re
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_DIR, "src", "data", "clans")


def extract_spouse_name(detail):
    """从 detail 文本中提取配偶姓名"""
    if not detail:
        return None
    m = re.search(r'妻([^，。, \r\n]+?)(?:，|。|$|[\r\n])', detail)
    if m:
        return m.group(1).strip()
    return None


def flatten_tree(nodes, meta, parent_id=None, gen=1, branch="", id_counter=None):
    """将树结构展平，返回 {id: PersonData}"""
    if id_counter is None:
        id_counter = [0]
    result = {}
    branch_gen = meta.get("branchGen", 2)
    strip_prefix = meta.get("stripPrefix", "")
    for i, node in enumerate(nodes):
        pid = f"p_{id_counter[0]}"
        id_counter[0] += 1
        # 辈分：优先用节点自带 generation 覆盖（承嗣跨辈），否则按父辈分+1
        gen_eff = node.get("generation", gen)
        # 房支归属：第1代（始祖）无房支；branchGen 代用自己的名字（去掉姓前缀）作房支；其余继承父亲
        if gen_eff == 1:
            node_branch = ""
        elif gen_eff == branch_gen:
            name = node["name"]
            node_branch = name[len(strip_prefix):] if strip_prefix and name.startswith(strip_prefix) else name
        else:
            node_branch = branch
        flat = {
            "id": pid,
            "name": node["name"],
            "gender": node["gender"],
            "detail": node.get("detail", ""),
            "spouseName": extract_spouse_name(node.get("detail", "")),
            "generation": gen_eff,
            "rank": i + 1,
            "branch": node_branch,
            "parentId": parent_id,
            "hasChildren": len(node.get("children", [])) > 0,
            "childCount": len(node.get("children", [])),
        }
        result[pid] = flat
        children_flat = flatten_tree(
            node.get("children", []), meta, pid, gen_eff + 1, node_branch, id_counter
        )
        result.update(children_flat)
    return result


def make_photo_path(raw_path):
    """从原始路径提取文件名，生成 /images/xxx 格式"""
    if not raw_path:
        return None
    filename = raw_path.replace("\\", "/").rsplit("/", 1)[-1]
    return f"/images/{filename}"


def generate_clan(clan_id):
    clan_dir = os.path.join(DATA_DIR, clan_id)
    if not os.path.isdir(clan_dir):
        print(f"[跳过] 不存在 {clan_dir}")
        return False

    with open(os.path.join(clan_dir, "meta.json"), "r", encoding="utf-8") as f:
        meta = json.load(f)
    with open(os.path.join(clan_dir, "genealogy.json"), "r", encoding="utf-8") as f:
        genealogy = json.load(f)
    with open(os.path.join(clan_dir, "photo_map.json"), "r", encoding="utf-8") as f:
        photo_map = json.load(f)

    # 展平
    people = flatten_tree(genealogy, meta)

    # 计算每个人的祖先和子女
    for pid, person in people.items():
        # 祖先路径（从根到父）
        ancestors = []
        current = person["parentId"]
        while current:
            if current in people:
                ancestors.insert(0, {"id": current, "name": people[current]["name"]})
                current = people[current]["parentId"]
            else:
                break
        person["ancestors"] = ancestors

        # 子女列表
        children = []
        for cid, cp in people.items():
            if cp["parentId"] == pid:
                child_info = {
                    "id": cid,
                    "name": cp["name"],
                    "gender": cp["gender"],
                    "spouseName": cp.get("spouseName"),
                }
                # 子女照片
                if cp["name"] in photo_map:
                    self_photo = make_photo_path(photo_map[cp["name"]].get("self"))
                    if self_photo:
                        child_info["photo"] = self_photo
                children.append(child_info)
        person["children"] = children

        # 自己的照片
        if person["name"] in photo_map:
            photos = photo_map[person["name"]]
            person_photo = {}
            self_photo = make_photo_path(photos.get("self"))
            if self_photo:
                person_photo["self"] = self_photo
            spouse_photo = make_photo_path(photos.get("spouse"))
            if spouse_photo:
                person_photo["spouse"] = spouse_photo
            if photos.get("spouse_name"):
                person_photo["spouseName"] = photos["spouse_name"]
            person["photo"] = person_photo if person_photo else None
        else:
            person["photo"] = None

    # 写入
    output = {"people": people}
    out_path = os.path.join(PROJECT_DIR, "public", "data", "clans", clan_id, "people.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    total = len(people)
    file_size = os.path.getsize(out_path)
    print(f"Generated {total} people to public/data/clans/{clan_id}/people.json ({file_size:,} bytes)")
    return True


def main():
    args = sys.argv[1:]
    if args:
        clan_ids = [a for a in args if a != "--all"]
    else:
        clan_ids = [d for d in os.listdir(DATA_DIR) if os.path.isdir(os.path.join(DATA_DIR, d))]

    if not clan_ids:
        print("没有可生成的谱系数据。")
        return

    for cid in clan_ids:
        generate_clan(cid)


if __name__ == "__main__":
    main()