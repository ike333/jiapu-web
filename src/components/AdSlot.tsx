"use client";

import { useEffect, useState } from "react";
import { fetchDdkGoods, fetchAdConfig, type DdkGood, type AdConfig } from "@/lib/api";
import { ShoppingBag, ExternalLink, Megaphone } from "lucide-react";
import BaiduAd from "@/components/BaiduAd";

export default function AdSlot({
  keyword,
  title = "家族好礼",
  limit = 8,
}: {
  keyword?: string;
  title?: string;
  limit?: number;
}) {
  const [cfg, setCfg] = useState<AdConfig | null>(null);
  const [items, setItems] = useState<DdkGood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const c = await fetchAdConfig();
        if (!c.enabled) {
          setCfg(c);
          setLoading(false);
          return;
        }
        if (c.provider === "pdd") {
          const kw =
            keyword && keyword.trim()
              ? keyword.trim()
              : (Object.values(c.scenes)[0] || "家族好礼");
          const res = await fetchDdkGoods(kw, 1, limit);
          if (!active) return;
          setItems((res.items || []).slice(0, limit));
        }
        setCfg(c);
      } catch {
        setCfg({ enabled: true, provider: "pdd", scenes: {} });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [keyword, limit]);

  if (cfg && !cfg.enabled) return null;

  if (cfg && cfg.provider === "baidu") {
    if (!cfg.baidu_code) return null;
    return (
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Megaphone size={14} className="text-accent-gold" />
          广告 · 支持家谱网站日常运营
        </div>
        <BaiduAd code={cfg.baidu_code} />
      </section>
    );
  }

  if (cfg && cfg.provider === "off") return null;
  if (loading) return <div className="text-center py-10 text-gray-400 text-sm">加载中…</div>;
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="chinese-heading text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag size={20} className="text-accent-gold" /> {title}
        </h2>
        <span className="text-xs text-gray-400">专属链接下单，价格不变，本谱获平台返还佣金</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((g) => (
          <a
            key={g.id}
            href={g.promoUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group shrink-0 w-40 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-transparent hover:border-accent-gold/40"
          >
            <div className="relative aspect-square bg-gray-100">
              {g.tag && (
                <span className="absolute top-1.5 left-1.5 z-10 bg-accent-gold text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
                  {g.tag}
                </span>
              )}
              {g.image && (
                <img
                  src={g.image}
                  alt={g.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
            </div>
            <div className="p-2.5">
              <p className="text-xs text-gray-800 line-clamp-2 min-h-[2rem] group-hover:text-primary-700 transition-colors">
                {g.title}
              </p>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                {g.couponPrice != null && (
                  <span className="text-red-500 font-bold text-sm">¥{g.couponPrice}</span>
                )}
                {g.originPrice != null && (
                  <span className="text-gray-400 text-[11px] line-through">¥{g.originPrice}</span>
                )}
              </div>
              <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] text-accent-gold">
                去拼多多 <ExternalLink size={10} />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}