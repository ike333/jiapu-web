"use client";

import { useEffect, useState } from "react";
import { fetchDdkGoods, fetchAdConfig, type DdkGood, type AdConfig } from "@/lib/api";
import { ShoppingBag, ExternalLink } from "lucide-react";

export default function SceneRecommend({
  scene,
  title,
}: {
  scene: string;
  title?: string;
}) {
  const [cfg, setCfg] = useState<AdConfig | null>(null);
  const [items, setItems] = useState<DdkGood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const c = await fetchAdConfig();
        const kw = c.scenes?.[scene];
        if (!c.enabled || c.provider !== "pdd" || !kw) {
          setCfg(c);
          setLoading(false);
          return;
        }
        const res = await fetchDdkGoods(kw, 1, 4);
        if (!active) return;
        setItems((res.items || []).slice(0, 4));
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
  }, [scene]);

  if (cfg && (!cfg.enabled || cfg.provider !== "pdd" || !cfg.scenes?.[scene])) return null;
  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">加载中…</div>;
  if (items.length === 0) return null;

  return (
    <section className="card p-4 space-y-3">
      <h3 className="font-bold text-gray-900 flex items-center gap-2">
        <ShoppingBag size={18} className="text-accent-gold" /> {title || "相关好礼"}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((g) => (
          <a
            key={g.id}
            href={g.promoUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-transparent hover:border-accent-gold/40"
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
