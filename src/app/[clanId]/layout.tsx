import type { Metadata } from "next";
import { getClanMeta, getClanIds } from "@/lib/clans";
import Navbar from "@/components/Navbar";

// 构建时全量导出所有谱
export function generateStaticParams() {
  return getClanIds().map((clanId) => ({ clanId }));
}

export function generateMetadata({ params }: { params: { clanId: string } }): Metadata {
  const meta = getClanMeta(params.clanId);
  return {
    title: meta.metadata.title,
    description: meta.metadata.description,
    keywords: meta.metadata.keywords,
  };
}

export default function ClanLayout({ children, params }: { children: React.ReactNode; params: { clanId: string } }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}