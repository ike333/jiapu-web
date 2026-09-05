"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, MessageSquare, Reply, LogOut } from "lucide-react";
import { getUser, clearAuth, submitFeedback, fetchMyFeedbacks, setActiveClan, type FeedbackRecord } from "@/lib/api";
import { useClanId } from "@/lib/use-clan";

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending: { label: "待回复", cls: "bg-amber-100 text-amber-700", icon: <Clock size={12} /> },
  replied: { label: "已回复", cls: "bg-green-100 text-green-700", icon: <CheckCircle2 size={12} /> },
};

export default function FeedbackPage() {
  const router = useRouter();
  const clanId = useClanId();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [content, setContent] = useState("");
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setActiveClan(clanId);
    setUser(getUser());
    if (!getUser()) {
      router.replace(`/${clanId}/login`);
      return;
    }
    fetchMyFeedbacks(clanId)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [router, clanId]);

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">请先登录</p>
        <Link href={`/${clanId}/login`} className="btn-primary">去登录</Link>
      </div>
    );
  }

  const handleLogout = () => {
    clearAuth();
    router.push(`/${clanId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const text = content.trim();
    if (!text) {
      setError("请填写反馈内容");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitFeedback(clanId, text);
      setMessage(res.message);
      setContent("");
      const list = await fetchMyFeedbacks(clanId);
      setRecords(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/${clanId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
          <ArrowLeft size={16} />
          返回首页
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {user.name} {user.role === "admin" && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">管理员</span>}
          </span>
          <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={14} />
            退出
          </button>
        </div>
      </div>

      <div>
        <h1 className="chinese-heading text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare size={24} className="text-primary-600" />
          意见反馈
        </h1>
        <p className="text-sm text-gray-500 mt-1">对族谱信息、网站功能或其他事项提出建议，管理员会查看并回复</p>
      </div>

      {message && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-3">
        <label className="text-xs text-gray-500 block">反馈内容 *</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请描述您想反馈的信息或建议..."
        />
        <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
          {submitting ? "提交中..." : "提交反馈"}
        </button>
      </form>

      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3">我的反馈（{records.length}）</h2>
        {loading ? (
          <div className="text-center py-10 text-gray-400">加载中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-10 text-gray-400">还没有提交过反馈</div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => {
              const status = STATUS_CONFIG[r.status];
              return (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${status.cls}`}>
                      {status.icon}
                      {status.label}
                    </span>
                    <span className="text-xs text-gray-400">{r.created_at}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{r.content}</p>
                  {r.status === "replied" && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                        <Reply size={12} />
                        管理员回复：
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{r.reply}</p>
                      {r.replied_by && (
                        <p className="text-xs text-gray-400 mt-1">回复人：{r.replied_by} · {r.replied_at}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}