"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ShoppingBag, Search, ExternalLink } from "lucide-react";
import { fetchDdkGoods, fetchAdConfig, type DdkGood } from "@/lib/api";

export default function MallPage() {
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<DdkGood[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [adsOpen, setAdsOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = (kw: string) => {
    setLoading(true);
    setError(null);
    fetchDdkGoods(kw, 1, 40)
      .then((res) => {
        setItems(res.items || []);
        setConfigured(res.configured !== false);
        if (res.error) setError(res.error);
      })
      .catch((e) => setError(e?.message || "加载失败"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdConfig()
      .then((c) => {
        if (!c.enabled || c.provider !== "pdd") {
          setAdsOpen(false);
          setLoading(false);
        } else {
          load("");
        }
      })
      .catch(() => load(""));
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!adsOpen) return;
    load(keyword.trim());
  };

  if (!adsOpen) {
    return (
      <div className="text-center py-20 text-gray-400">
        <ShoppingBag className="mx-auto mb-3 text-gray-300" size={40} />
        好物频道暂未开放
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="chinese-heading text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag size={22} className="text-accent-gold" /> 精选好物
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          通过下方专属链接下单，价格与你直接购买一致，我们的家谱可获得平台返还的小额佣金，感谢支持
        </p>
      </div>

      {/* 搜索 */}
      <form onSubmit={onSearch} className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜你想买的好物（如：茶叶、文玩、书籍）..."
          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm
                     focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
        />
      </form>

      {/* 状态提示 */}
      {!configured && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          尚未配置拼多多开放平台凭证，请在后端设置 PDD_CLIENT_ID / PDD_CLIENT_SECRET / PDD_PID。
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          加载失败：{error}
        </div>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">加载中…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">暂无商品，换个关键词试试</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  <span className="absolute top-2 left-2 z-10 bg-accent-gold text-white text-[11px] font-bold px-2 py-0.5 rounded">
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
              <div className="p-3">
                <p className="text-sm text-gray-800 line-clamp-2 min-h-[2.5rem] group-hover:text-primary-700 transition-colors">
                  {g.title}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  {g.couponPrice != null && (
                    <span className="text-red-500 font-bold text-base">¥{g.couponPrice}</span>
                  )}
                  {g.originPrice != null && (
                    <span className="text-gray-400 text-xs line-through">¥{g.originPrice}</span>
                  )}
                </div>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-accent-gold">
                  去拼多多购买 <ExternalLink size={12} />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
