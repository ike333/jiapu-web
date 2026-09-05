"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { adminLogin, setAuth, setActiveClan } from "@/lib/api";
import { useClanId } from "@/lib/use-clan";

export default function AdminLoginPage() {
  const router = useRouter();
  const clanId = useClanId();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setActiveClan(clanId);
  }, [clanId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password.trim()) {
      setError("请输入管理员密码");
      return;
    }
    setLoading(true);
    try {
      const res = await adminLogin(clanId, password.trim());
      setAuth(res.token, res.user);
      router.push(`/${clanId}/admin`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Link href={`/${clanId}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <ArrowLeft size={16} />
        返回首页
      </Link>

      <div className="card">
        <div className="flex items-center justify-center mb-4">
          <ShieldCheck size={40} className="text-primary-600" />
        </div>
        <h1 className="chinese-heading text-2xl font-bold text-gray-900 mb-1 text-center">
          管理员登录
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          输入管理员密码进入审核后台
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <KeyRound size={14} className="text-gray-400" />
              管理员密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理员密码"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? "处理中..." : "进入管理"}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
          管理员凭密码登录，可审核族人提交的信息变更与反馈
        </p>
      </div>
    </div>
  );
}
