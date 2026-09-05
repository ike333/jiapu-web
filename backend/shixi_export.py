# -*- coding: utf-8 -*-
"""世系表风格文本生成（共享逻辑）
管理后台「整理人员变动」API 与 scripts/export_changes_shixi.py 共用：
把 changes 表「审核通过」的变动记录，渲染为 世系表.txt 风格的文本条目。
"""
import re

CN_NUM = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"]


def fmt_birth_line(child_name, birth_date):
    """新生儿行：名字：生于公历…"""
    if birth_date:
        m = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})", birth_date.strip())
        if m:
            return f"{child_name}：生于公历{m.group(1)}年{m.group(2)}月{m.group(3)}日。"
        return f"{child_name}：生于{birth_date}。"
    return f"{child_name}："


def gen_birth(ch):
    """新生变更 → 文本"""
    child_name = ch.get("childName") or ""
    birth_date = ch.get("birthDate") or ""
    father = ch.get("fatherName") or ""
    gender = ch.get("gender")  # male | female
    tag = "（男）" if gender == "male" else ("（女）" if gender == "female" else "")
    lines = [f"〔新生〕 {child_name}{tag}"]
    lines.append(f"  新增行：{fmt_birth_line(child_name, birth_date)}")
    if father:
        lines.append(f"  父行：{father} 的「育子/育女」列表需追加 {child_name}")
    return lines


def gen_marriage(ch):
    groom = ch.get("groomName") or ""
    bride = ch.get("brideName") or ""
    bride_birth = ch.get("brideBirthDate") or ""
    date = ch.get("marriageDate") or ""
    lines = [f"〔结婚〕 {groom}" + (f" 配 {bride}" if bride else "")]
    seg = f"妻{bride}" if bride else "（新娘姓名未填）"
    if bride_birth:
        seg += f"，妻生于{bride_birth}"
    seg += f"，婚期 {date}。" if date else "。"
    lines.append(f"  在 {groom} 行补充配偶信息：{seg}")
    return lines


def gen_death(ch):
    name = ch.get("name") or ""
    date = ch.get("deathDate") or ""
    burial = ch.get("burialPlace") or ""
    lines = [f"〔去世〕 {name}"]
    seg = "逝于" + (date or "不详")
    if burial:
        seg += f"，葬{burial}"
    lines.append(f"  在 {name} 行补充：「{seg}」。")
    return lines


def gen_change_text(ch):
    """按变更类型返回文本行列表；未知类型返回空"""
    t = ch.get("type")
    if t == "birth":
        return gen_birth(ch)
    if t == "marriage":
        return gen_marriage(ch)
    if t == "death":
        return gen_death(ch)
    return []


def changes_to_text(changes):
    """多条变更 → 世系表风格纯文本（每条之间空一行）"""
    sections = []
    for ch in changes:
        sections.extend(gen_change_text(ch))
        sections.append("")
    text = "\n".join(sections).rstrip("\n")
    return text + "\n" if text else ""