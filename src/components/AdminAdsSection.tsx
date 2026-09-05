"use client";

import { useState, useEffect } from "react";
import {
  fetchAdConfig,
  updateAdConfig,
  type AdConfig,
} from "@/lib/api";

const SCENE_KEYS = ["birthday", "marriage", "memorial", "baby", "festival"];
const SCENE_LABELS: Record<string, string> = {
  birthday: "生日 / 寿礼",
  marriage: "婚嫁",
  memorial: "祭祀 / 纪念",
  baby: "新生儿",
  festival: "节日",
};

const PROVIDERS: {
  value: "pdd" | "baidu" | "off";
  label: string;
  desc: string;
}[] = [
  {
    value: "pdd",
    label: "拼多多好物",
    desc: "按场景关键词唤起商品卡片，点专属链接下单，本谱获得平台返佣",
  },
  {
    value: "baidu",
    label: "百度联盟广告",
    desc: "展示百度广告代码位（需在下方粘贴投放代码）",
  },
  {
    value: "off",
    label: "关闭广告",
    desc: "全站不展示任何广告，也不调用相关接口",
  },
];

export default function AdminAdsSection({ clanId }: { clanId: string }) {
  const [enabled, setEnabled] = useState(true);
  const [provider, setProvider] = useState<"pdd" | "baidu" | "off">("pdd");
  const [baiduCode, setBaiduCode] = useState("");
  const [scenes, setScenes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAdConfig()
      .then((c: AdConfig) => {
        setEnabled(c.enabled);
        setProvider(c.provider || "pdd");
        setBaiduCode(c.baidu_code || "");
        setScenes(c.scenes || {});
      })
      .catch(() => {});
  }, []);

  const save = async (patch: {
    enabled?: boolean;
    provider?: "pdd" | "baidu" | "off";
    baidu_code?: string;
    scenes?: Record<string, string>;
  }) => {
    setSaving(true);
    setMsg(null);
    try {
      const next = await updateAdConfig(patch);
      setEnabled(next.enabled);
      setProvider(next.provider);
      setBaiduCode(next.baidu_code || "");
      setScenes(next.scenes || {});
      setMsg("已保存");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="chinese-heading text-lg font-bold text-gray-900">
        广告设置
      </h2>

      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">全站广告总开关</p>
          <p className="text-sm text-gray-500">
            关闭后，网站所有广告位与场景推荐卡立即停止展示，且不再调用相关广告接口
          </p>
        </div>
        <button
          onClick={() => save({ enabled: !enabled })}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            enabled ? "bg-primary-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              enabled ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <p className="font-medium text-gray-900">广告源</p>
        <p className="text-sm text-gray-500">
          全站广告统一使用同一广告源；切换立即生效。
        </p>
        {PROVIDERS.map((p) => (
          <label
            key={p.value}
            className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
              provider === p.value
                ? "border-primary-400 bg-primary-50"
                : "border-gray-200 hover:border-primary-300"
            }`}
          >
            <input
              type="radio"
              name="provider"
              checked={provider === p.value}
              onChange={() => setProvider(p.value)}
              className="mt-1 accent-primary-600"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">{p.label}</div>
              <div className="text-xs text-gray-500">{p.desc}</div>
            </div>
          </label>
        ))}
        {provider !== "off" && (
          <button
            onClick={() =>
              save(
                provider === "pdd"
                  ? { provider }
                  : { provider, baidu_code: baiduCode }
              )
            }
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving
              ? "保存中..."
              : `保存：${PROVIDERS.find((p) => p.value === provider)?.label}`}
          </button>
        )}
      </div>

      {provider === "baidu" && (
        <div className="card p-4 space-y-2">
          <p className="font-medium text-gray-900">百度联盟投放代码</p>
          <p className="text-sm text-gray-500">
            从 union.baidu.com 媒体平台创建代码位后，把整段投放代码（含
            &lt;script&gt;）粘贴到这里。
          </p>
          <textarea
            value={baiduCode}
            onChange={(e) => setBaiduCode(e.target.value)}
            rows={5}
            placeholder={"<div id='...'></div>\n<script>...百度代码位脚本...</script>"}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:border-primary-400 outline-none"
          />
        </div>
      )}

      {provider === "pdd" && (
        <div className="card p-4 space-y-3">
          <p className="font-medium text-gray-900">场景关键词</p>
          <p className="text-sm text-gray-500">
            不同礼仪时点展示对应商品；修改后立即生效，无需改代码。
          </p>
          {SCENE_KEYS.map((k) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-24 text-sm text-gray-600">
                {SCENE_LABELS[k]}
              </span>
              <input
                value={scenes[k] || ""}
                onChange={(e) => setScenes({ ...scenes, [k]: e.target.value })}
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-primary-400 outline-none"
              />
            </div>
          ))}
          <button
            onClick={() => save({ scenes })}
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? "保存中..." : "保存场景词"}
          </button>
        </div>
      )}

      {msg && <p className="text-sm text-green-600">{msg}</p>}
    </div>
  );
}