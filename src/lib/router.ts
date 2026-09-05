// 多谱路由/图片路径工具（纯函数，可被 Server/Client 组件共用）
// 新架构 URL：/chen/...、/zhao/...（clanId 即 URL 第一段）
// 图片：public/images/{clanId}/... → /images/{clanId}/...
// 注意：本文件不导入任何 Client-only 钩子，以免 Server 组件报错。
//       useClanId() 放在 @/lib/use-clan（"use client"）。

/** 从 pathname 推导当前 clanId（"/chen/person?id=x" → "chen"；"/" → 默认谱） */
export function getClanIdFromPath(pathname: string, fallback = "chen"): string {
  const m = pathname.match(/^\/([^/?]+)/);
  return m ? m[1] : fallback;
}

/** 图片基础路径：/images/{clanId} */
export function getImageBase(clanId: string): string {
  return `/images/${clanId}`;
}

/** 从原始文件名生成图片完整路径 */
export function makeImagePath(clanId: string, rawPath?: string): string | undefined {
  if (!rawPath) return undefined;
  const filename = rawPath.replace(/\\/g, "/").split("/").pop();
  return filename ? `${getImageBase(clanId)}/${filename}` : undefined;
}

/** 去字母后缀（陈安治C -> 陈安治），用于姓名匹配 */
export function stripSuffix(name: string): string {
  return (name || "").replace(/[A-Za-z]+$/, "").trim();
}
