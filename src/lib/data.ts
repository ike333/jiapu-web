// 陈氏宗谱 - 数据访问层（多谱版）
// 所有函数第一个参数为 clanId，按谱隔离缓存与配置。
// 后续换 Prisma 时只改这个文件；Prisma 版本只需把函数体改成 Prisma 查询即可。

import type {
  PersonNode,
  PersonFlat,
  PhotoInfo,
  DocumentItem,
  SearchResult,
  GenerationStats,
  BranchStats,
  TreeNode,
} from "@/lib/types";
import { GenealogySchema, DocumentsSchema, PhotoMapSchema, validateData } from "@/lib/validation";
import { getClanGenealogy, getClanDocuments, getClanPhotoMap, getClanMeta } from "@/lib/clans";

if (process.env.NODE_ENV === "development") {
  validateData(getClanGenealogy("chen"), GenealogySchema, "genealogy.json");
  validateData(getClanDocuments("chen"), DocumentsSchema, "documents.json");
  validateData(getClanPhotoMap("chen"), PhotoMapSchema, "photo_map.json");
}

// ==============================
// 内部：树展平（按 clanId 隔离缓存）
// ==============================

const _flatCacheMap = new Map<string, PersonFlat[]>();
const _nameIndexMap = new Map<string, Map<string, PersonFlat>>();

/** 将树结构展平为数组 */
function flattenTree(clanId: string): PersonFlat[] {
  const cached = _flatCacheMap.get(clanId);
  if (cached) return cached;

  const genealogyData = getClanGenealogy(clanId);
  const meta = getClanMeta(clanId);

  const result: PersonFlat[] = [];
  let idCounter = 0;

  function walk(nodes: PersonNode[], parentId: string | null, gen: number, branch: string) {
    nodes.forEach((node, i) => {
      const id = `p_${idCounter++}`;
      // 辈分：优先用节点自带 generation 覆盖（承嗣跨辈），否则按父辈分+1
      const nodeGen = node.generation ?? gen;
      // 房支归属：第1代（始祖）无房支；branchGen 代用 node 自己的名字（去掉姓前缀）作房支；其余继承父亲
      let nodeBranch: string;
      if (nodeGen === 1) {
        nodeBranch = "";
      } else if (nodeGen === meta.branchGen) {
        nodeBranch = meta.stripPrefix && node.name.startsWith(meta.stripPrefix)
          ? node.name.slice(meta.stripPrefix.length)
          : node.name;
      } else {
        nodeBranch = branch;
      }
      const flat: PersonFlat = {
        id,
        name: node.name,
        gender: node.gender,
        detail: node.detail || "",
        spouseName: extractSpouseName(node.detail, node.gender),
        generation: nodeGen,
        rank: i + 1,
        branch: nodeBranch,
        parentId,
        hasChildren: node.children.length > 0,
        childCount: node.children.length,
      };
      result.push(flat);
      walk(node.children, id, nodeGen + 1, nodeBranch);
    });
  }

  walk(genealogyData, null, 1, "");
  _flatCacheMap.set(clanId, result);
  return result;
}

/** 从 detail 文本中提取配偶姓名：男性取「妻」后内容，女性取「夫/嫁/适」后内容 */
function extractSpouseName(detail: string, gender: string): string | undefined {
  if (!detail) return undefined;
  // 男性 "妻刘氏" "妻侯氏、王氏"；女性 "嫁柯善兴" "适XXX" "夫XXX"
  const m =
    gender === "male"
      ? detail.match(/妻([^，。,\r\n]+?)(?:，|。|$|[\r\n])/)
      : detail.match(/(?:夫|嫁|适)([^，。,\r\n]+?)(?:，|。|$|[\r\n])/);
  if (m) return m[1].trim();
  return undefined;
}

/** 获取名字索引 */
function getNameIndex(clanId: string): Map<string, PersonFlat> {
  const cached = _nameIndexMap.get(clanId);
  if (cached) return cached;
  const all = flattenTree(clanId);
  const index = new Map<string, PersonFlat>();
  for (const p of all) {
    if (!index.has(p.name)) {
      index.set(p.name, p);
    }
  }
  _nameIndexMap.set(clanId, index);
  return index;
}

// ==============================
// 公开 API
// ==============================

/** 获取所有人（展平列表） */
export function getAllPeople(clanId: string): PersonFlat[] {
  return flattenTree(clanId);
}

/** 显示名：谱名（除详情外）统一带姓，如王氏"永昌"→"王永昌"；始祖名不详保持"始祖" */
export function displayName(clanId: string, name: string): string {
  if (!name) return name;
  const surname = getClanMeta(clanId).surname;
  if (!surname) return name;
  if (name === "始祖") return name;
  if (name.startsWith(surname)) return name;
  return surname + name;
}

/** 按 ID 获取单个人 */
export function getPersonById(clanId: string, id: string): PersonFlat | undefined {
  return flattenTree(clanId).find((p) => p.id === id);
}

/** 获取某个人的所有祖先路径 */
export function getAncestorPath(clanId: string, id: string): PersonFlat[] {
  const all = flattenTree(clanId);
  const person = all.find((p) => p.id === id);
  if (!person) return [];

  const path: PersonFlat[] = [];
  let current = person;
  while (current.parentId) {
    const parent = all.find((p) => p.id === current.parentId);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }
  return path;
}

/** 获取某个人的直接子女 */
export function getChildren(clanId: string, parentId: string): PersonFlat[] {
  return flattenTree(clanId)
    .filter((p) => p.parentId === parentId)
    .sort((a, b) => a.rank - b.rank);
}

/** 获取某个人的所有后代（递归） */
export function getDescendants(clanId: string, id: string): PersonFlat[] {
  const result: PersonFlat[] = [];
  const all = flattenTree(clanId);
  const nameIndex = new Map<string, PersonFlat[]>();
  for (const p of all) {
    if (p.parentId) {
      const arr = nameIndex.get(p.parentId) || [];
      arr.push(p);
      nameIndex.set(p.parentId, arr);
    }
  }

  function collect(pid: string) {
    const children = nameIndex.get(pid) || [];
    for (const child of children) {
      result.push(child);
      collect(child.id);
    }
  }
  collect(id);
  return result;
}

/** 获取某人的照片信息 */
export function getPersonPhotos(clanId: string, name: string): PhotoInfo | undefined {
  return getClanPhotoMap(clanId)[name];
}

/** 按姓名搜索（模糊匹配，支持带姓/不带姓两种输入） */
export function searchPeople(clanId: string, query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const all = flattenTree(clanId);

  return all
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        displayName(clanId, p.name).toLowerCase().includes(q) ||
        (p.spouseName && p.spouseName.toLowerCase().includes(q))
    )
    .map((p) => {
      const path = getAncestorPath(clanId, p.id);
      return {
        ...p,
        path: path.map((a) => displayName(clanId, a.name)),
      };
    })
    .sort((a, b) => a.generation - b.generation || a.name.length - b.name.length)
    .slice(0, 50);
}

/** 获取所有文档 */
export function getAllDocuments(clanId: string): Record<string, DocumentItem> {
  return getClanDocuments(clanId);
}

/** 获取单篇文档 */
export function getDocument(clanId: string, key: string): DocumentItem | undefined {
  return getClanDocuments(clanId)[key];
}

/** 世代统计 */
export function getGenerationStats(clanId: string): GenerationStats[] {
  const all = flattenTree(clanId);
  const map = new Map<number, { male: number; female: number }>();

  for (const p of all) {
    const entry = map.get(p.generation) || { male: 0, female: 0 };
    if (p.gender === "male") entry.male++;
    else entry.female++;
    map.set(p.generation, entry);
  }

  return Array.from(map.entries())
    .map(([generation, { male, female }]) => ({
      generation,
      male,
      female,
      total: male + female,
    }))
    .sort((a, b) => a.generation - b.generation);
}

/** 房支统计 */
export function getBranchStats(clanId: string): BranchStats[] {
  const all = flattenTree(clanId);
  const map = new Map<string, number>();

  for (const p of all) {
    if (p.generation > 1) {
      const branch = p.branch;
      map.set(branch, (map.get(branch) || 0) + 1);
    }
  }

  return Array.from(map.entries())
    .map(([branch, count]) => ({ branch, count }))
    .sort((a, b) => b.count - a.count);
}

/** 获取树根节点（用于树状图可视化） */
export function getTreeRoot(clanId: string): TreeNode {
  function convert(node: PersonNode, gen: number): TreeNode {
    return {
      id: node.name,
      name: node.name,
      gender: node.gender,
      generation: gen,
      children: node.children.length > 0 ? node.children.map((c) => convert(c, gen + 1)) : undefined,
    };
  }
  const root = (getClanGenealogy(clanId) as PersonNode[])[0];
  return convert(root, 1);
}

/** 获取子树（仅展开到指定深度） */
export function getSubtree(clanId: string, rootId: string, depth: number = 3): TreeNode | null {
  const all = flattenTree(clanId);
  const person = all.find((p) => p.id === rootId);
  if (!person) return null;

  function buildTree(pid: string, currentDepth: number): TreeNode {
    const p = all.find((x) => x.id === pid)!;
    const children = getChildren(clanId, pid);
    return {
      id: p.id,
      name: p.name,
      gender: p.gender,
      generation: p.generation,
      children:
        currentDepth < depth && children.length > 0
          ? children.map((c) => buildTree(c.id, currentDepth + 1))
          : undefined,
    };
  }

  return buildTree(rootId, 1);
}

/** 统计信息 */
export function getSummary(clanId: string) {
  const all = flattenTree(clanId);
  const meta = getClanMeta(clanId);
  const males = all.filter((p) => p.gender === "male").length;
  const females = all.filter((p) => p.gender === "female").length;
  const maxGen = Math.max(...all.map((p) => p.generation));
  const docCount = Object.keys(getClanDocuments(clanId)).length;
  const photoCount = Object.keys(getClanPhotoMap(clanId)).length;

  return {
    totalPeople: all.length,
    males,
    females,
    generations: maxGen,
    documents: docCount,
    photos: photoCount,
    rootName: all[0]?.name || meta.rootName,
    branches: meta.branches,
  };
}