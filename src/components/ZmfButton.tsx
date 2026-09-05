"use client";

// 知命坊详测按钮：登录用户点击后调后端生成跳转 URL，新窗口打开知命坊排盘
import { useState } from "react";
import { Sparkles, Loader2, LogIn } from "lucide-react";
import { getToken } from "@/lib/api";
import { useClanId } from "@/lib/use-clan";

interface ZmfButtonProps {
  name?: string;
  gender?: "male" | "female";
  birthDate?: string;   // 可预填的出生日期（如 detail 中解析出的）
  birthTime?: string;   // HH:MM
  birthPlace?: string;  // 出生地
}

export default function ZmfButton({
  name,
  gender,
  birthDate,
  birthTime,
  birthPlace,
}: ZmfButtonProps) {
  const clanId = useClanId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [bDate, setBDate] = useState(birthDate || "");
  const [bTime, setBTime] = useState(birthTime || "");
  const [bPlace, setBPlace] = useState(birthPlace || "");

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

  const handleClick = async () => {
    const token = getToken();
    if (!token) {
      setError("请先登录后再使用知命坊详测功能");
      setShowForm(false);
      return;
    }
    setError("");

    if (!showForm) {
      setShowForm(true);
      return;
    }

    if (!bDate) {
      setError("请填写出生日期");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/${clanId}/zmf/ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name || undefined,
          gender: gender === "female" ? "女" : gender === "male" ? "男" : undefined,
          birthDate: bDate,
          birthTime: bTime || undefined,
          birthPlace: bPlace || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || `请求失败 (${res.status})`);
        return;
      }
      if (data.url) {
        window.open(data.url, "_blank", "noopener");
        setShowForm(false);
      } else {
        setError("未获得跳转链接");
      }
    } catch (e) {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {showForm ? (
        <div className="border border-primary-100 rounded-xl p-4 bg-primary-50/50 space-y-3">
          <p className="text-sm text-gray-600">
            填写出生信息，将跳转至知命坊进行详细命理分析（免费）。
          </p>
          <div>
            <label className="block text-xs text-gray-500 mb-1">出生日期</label>
            <input
              type="date"
              value={bDate}
              onChange={(e) => setBDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">出生时间（可选）</label>
            <input
              type="time"
              value={bTime}
              onChange={(e) => setBTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">出生地点（可选）</label>
            <input
              type="text"
              value={bPlace}
              onChange={(e) => setBPlace(e.target.value)}
              placeholder="如：陕西西安"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleClick}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? "跳转中..." : "开始详测"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-primary-200 text-primary-700 hover:bg-primary-50 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          知命坊详测
        </button>
      )}
    </div>
  );
}