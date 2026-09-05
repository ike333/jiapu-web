"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, User, KeyRound, LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { sendCode, register, login, setAuth, setActiveClan } from "@/lib/api";
import { useClanId } from "@/lib/use-clan";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const clanId = useClanId();
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    setActiveClan(clanId);
  }, [clanId]);

  const handleSendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      setError("请输入正确的 11 位手机号");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await sendCode(clanId, phone, mode);
      if (res.dev_code) {
        setDevCode(res.dev_code);
        setCode(res.dev_code);
      }
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) clearInterval(timer);
          return c - 1;
        });
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await login(clanId, phone, password);
        setAuth(res.token, res.user);
      } else {
        if (!name.trim()) {
          setError("请输入你在族谱中的姓名");
          return;
        }
        if (!fatherName.trim()) {
          setError("请输入父亲姓名");
          return;
        }
        if (!motherName.trim()) {
          setError("请输入母亲姓名");
          return;
        }
        const res = await register(clanId, phone, code, name.trim(), password, fatherName.trim(), motherName.trim());
        setAuth(res.token, res.user);
      }
      router.push(`/${clanId}/submit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
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
        {/* 模式切换 */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); setDevCode(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all
              ${mode === "login" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <LogIn size={16} />
            登录
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setError(""); setDevCode(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all
              ${mode === "register" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <UserPlus size={16} />
            注册
          </button>
        </div>

        <h1 className="chinese-heading text-2xl font-bold text-gray-900 mb-1 text-center">
          {mode === "login" ? "族人登录" : "族人注册"}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-2">
          {mode === "login"
            ? "登录后可提交族人信息变更"
            : "注册后可提交新生、结婚、去世等族人信息变更"}
        </p>
        <p className="text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-2 mb-6 leading-relaxed">
          仅浏览家谱信息无需注册，直接返回首页即可查看。注册是为了提交族人信息更新，
          需校验您与族谱中的记录一致。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 手机号 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <User size={14} className="text-gray-400" />
              手机号
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="11 位手机号"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <User size={14} className="text-gray-400" />
                你的姓名（族谱中记载的名字）<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="族谱中的姓名"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <User size={14} className="text-gray-400" />
                父亲姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="族谱中你父亲的姓名"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <User size={14} className="text-gray-400" />
                母亲姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="族谱中你母亲的姓名"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            </div>
          )}

          {mode === "register" && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
              为确保族人信息安全，注册需校验姓名、父亲、母亲与族谱记载一致（填母亲姓名与之匹配即可）。
              带"妻""配"的配偶请用丈夫姓名注册；如信息不符，请联系管理员协助登记。
            </p>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <KeyRound size={14} className="text-gray-400" />
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "至少 6 位" : "输入密码"}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-gray-400" />
                短信验证码
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6 位验证码"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || countdown > 0}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {countdown > 0 ? `${countdown}s 后重发` : "获取验证码"}
                </button>
              </div>
              {devCode && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  模拟验证码：<span className="font-mono font-bold">{devCode}</span>
                  （短信服务未接入，已自动填入）
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading ? "处理中..." : mode === "login" ? "登录" : "注册并登录"}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
          <Link
            href={`/${clanId}/admin-login`}
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary-600 transition-colors"
          >
            <ShieldCheck size={12} />
            管理员登录
          </Link>
        </div>
      </div>
    </div>
  );
}
