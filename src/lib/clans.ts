// 谱系注册表
// 多谱架构核心：所有谱的数据在此集中注册，客户端通过 clanId 访问。
// 加新谱：在 src/data/clans/{clanId}/ 放入 meta.json + genealogy.json + documents.json + photo_map.json，
// 然后在此文件顶部加 import 并在 clans 数组加一行即可，其余代码零改动。

import type { ClanMeta, PersonNode, DocumentItem, PhotoInfo } from "@/lib/types";

import chenMeta from "@/data/clans/chen/meta.json";
import chenGenealogy from "@/data/clans/chen/genealogy.json";
import chenDocuments from "@/data/clans/chen/documents.json";
import chenPhotoMap from "@/data/clans/chen/photo_map.json";

import zhaoMeta from "@/data/clans/zhao/meta.json";
import zhaoGenealogy from "@/data/clans/zhao/genealogy.json";
import zhaoDocuments from "@/data/clans/zhao/documents.json";
import zhaoPhotoMap from "@/data/clans/zhao/photo_map.json";

import wangMeta from "@/data/clans/wang/meta.json";
import wangGenealogy from "@/data/clans/wang/genealogy.json";
import wangDocuments from "@/data/clans/wang/documents.json";
import wangPhotoMap from "@/data/clans/wang/photo_map.json";

export interface ClanBundle {
  meta: ClanMeta;
  genealogy: PersonNode[];
  documents: Record<string, DocumentItem>;
  photoMap: Record<string, PhotoInfo>;
}

export const clans: ClanBundle[] = [
  {
    meta: chenMeta as ClanMeta,
    genealogy: chenGenealogy as PersonNode[],
    documents: chenDocuments as Record<string, DocumentItem>,
    photoMap: chenPhotoMap as Record<string, PhotoInfo>,
  },
  {
    meta: zhaoMeta as ClanMeta,
    genealogy: zhaoGenealogy as PersonNode[],
    documents: zhaoDocuments as Record<string, DocumentItem>,
    photoMap: zhaoPhotoMap as Record<string, PhotoInfo>,
  },
  {
    meta: wangMeta as ClanMeta,
    genealogy: wangGenealogy as PersonNode[],
    documents: wangDocuments as Record<string, DocumentItem>,
    photoMap: wangPhotoMap as Record<string, PhotoInfo>,
  },
  // 加新谱：import zhaoMeta from "@/data/clans/zhao/meta.json"; 等
];

export function getClanMeta(clanId: string): ClanMeta {
  const clan = clans.find((c) => c.meta.clanId === clanId);
  if (!clan) throw new Error(`未知谱系: ${clanId}`);
  return clan.meta;
}

export function getClanGenealogy(clanId: string): PersonNode[] {
  const clan = clans.find((c) => c.meta.clanId === clanId);
  if (!clan) throw new Error(`未知谱系: ${clanId}`);
  return clan.genealogy;
}

export function getClanDocuments(clanId: string): Record<string, DocumentItem> {
  const clan = clans.find((c) => c.meta.clanId === clanId);
  if (!clan) throw new Error(`未知谱系: ${clanId}`);
  return clan.documents;
}

export function getClanPhotoMap(clanId: string): Record<string, PhotoInfo> {
  const clan = clans.find((c) => c.meta.clanId === clanId);
  if (!clan) throw new Error(`未知谱系: ${clanId}`);
  return clan.photoMap;
}

export function getClanIds(): string[] {
  return clans.map((c) => c.meta.clanId);
}

export function getDefaultClanId(): string {
  return clans[0]?.meta.clanId ?? "chen";
}