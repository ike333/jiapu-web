// 陈氏宗谱 - 类型定义
// 后续换 Prisma 时，这些类型直接映射到 Prisma Model

export interface PersonNode {
  name: string;
  gender: "male" | "female";
  detail: string;
  children: PersonNode[];
  /** 可选辈分覆盖：用于承嗣跨辈（如美均A=12世挂崇满A下、贤武A=13世挂济生下）。缺省则按父辈分+1推算 */
  generation?: number;
}

export interface PersonFlat {
  id: string;
  name: string;
  gender: "male" | "female";
  detail: string;
  spouseName?: string;
  burialPlace?: string;
  birthYear?: string;
  deathYear?: string;
  generation: number;
  rank: number;
  branch: string;
  parentId: string | null;
  hasChildren: boolean;
  childCount: number;
}

export interface PhotoInfo {
  self?: string;
  spouse?: string;
  spouse_name?: string;
}

export interface DocumentItem {
  title: string;
  content: string;
}

export interface SearchResult extends PersonFlat {
  path: string[]; // 从始迁祖到此人的路径
}

export interface GenerationStats {
  generation: number;
  male: number;
  female: number;
  total: number;
}

export interface BranchStats {
  branch: string;
  count: number;
}

export interface DescendantCount {
  generation: string; // "2(自)", "3(文)" etc
  male: number;
  female: number;
}

// 家谱树节点（用于 D3.js 可视化）
export interface TreeNode {
  id: string;
  name: string;
  gender: "male" | "female";
  generation: number;
  children?: TreeNode[];
  _collapsed?: boolean;
}

// 谱系元信息（meta.json）
export interface ClanMeta {
  clanId: string;
  name: string;
  surname: string;
  rootName: string;
  branches: string[];
  branchGen: number; // 第几代开始分房支（陈氏=2，赵氏=3）
  stripPrefix: string; // 房支名要去掉的姓前缀（陈氏="陈"，赵氏=""）
  region: string;
  rootIntro: string;
  themeColor: string;
  features: { auth: boolean; submit: boolean; feedback: boolean };
  wechatAccounts?: string[]; // 各谱微信公众号列表（陈氏含"陈家庄"，公共号"我们的家谱"）
  wechatQr?: Record<string, string>; // 公众号名 → 二维码图片路径（点击弹窗扫码）
  metadata: {
    title: string;
    description: string;
    keywords: string;
  };
}
