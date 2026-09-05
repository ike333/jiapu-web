"use client";

// Client 专属钩子：获取当前 [clanId] 动态段
import { useParams } from "next/navigation";

/** Client 组件获取当前 clanId（优先用 useParams 的 [clanId] 动态段） */
export function useClanId(): string {
  const params = useParams<{ clanId?: string }>();
  return params?.clanId ?? "chen";
}
