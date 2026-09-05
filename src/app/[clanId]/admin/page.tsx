"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Baby, Heart, Cross, Clock, CheckCircle2, XCircle, ArrowLeft, Check, X, ShieldCheck, MessageSquare, Reply, Users, Trash2, Megaphone, FileOutput, Download, Hammer, CheckCheck } from "lucide-react";
import {
  getUser, clearAuth, fetchPending, reviewChange,
  fetchFeedbacks, replyFeedback, setActiveClan,
  fetchUsers, updateUserRole, deleteUser,
  fetchExportPending, generateExport, markExported,
  type ChangeRecord, type FeedbackRecord, type UserRecord,
} from "@/lib/api";
import { useClanId } from "@/lib/use-clan";
import AdminAdsSection from "@/components/AdminAdsSection";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  birth: { label: "新生", icon: <Baby size={16} className="text-pink-500" /> },
  marriage: { label: "结婚", icon: <Heart size={16} className="text-red-500" /> },
  death: { label: "去世", icon: <Cross size={16} className="text-gray-500" /> },
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: { label: "待审核", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "已通过", cls: "bg-green-100 text-green-700" },
  rejected: { label: "已驳回", cls: "bg-red-100 text-red-600" },
};

function AdminCard({ record, onReview }: { record: ChangeRecord; onReview: (id: number, d: "approve" | "reject") => void }) {
  const data = record.data as Record<string, string>;
  const status = STATUS_CONFIG[record.status];

  const renderDetail = () => {
    if (record.type === "birth") {
      return (
        <div className="text-sm text-gray-700 space-y-1">
          <p>新生儿：<span className="font-medium">{data.childName}</span>（{data.gender === "male" ? "男" : "女"}）</p>
          {data.birthDate && <p>出生日期：{data.birthDate}{data.birthTime ? ` ${data.birthTime}` : ""}</p>}
          {data.fatherName && <p>父亲：{data.fatherName}</p>}
          {data.motherName && <p>母亲：{data.motherName}</p>}
          {data.birthPlace && <p>出生地：{data.birthPlace}</p>}
        </div>
      );
    }
    if (record.type === "marriage") {
      return (
        <div className="text-sm text-gray-700 space-y-1">
          <p>新郎：<span className="font-medium">{data.groomName}</span></p>
          {data.brideName && <p>新娘：{data.brideName}</p>}
          {data.brideBirthDate && <p>新娘出生日期：{data.brideBirthDate}</p>}
          {data.marriageDate && <p>结婚日期：{data.marriageDate}</p>}
        </div>
      );
    }
    return (
      <div className="text-sm text-gray-700 space-y-1">
        <p>逝者：<span className="font-medium">{data.name}</span></p>
        {data.deathDate && <p>去世日期：{data.deathDate}</p>}
        {data.age && <p>享年：{data.age}</p>}
        {data.burialPlace && <p>安葬地：{data.burialPlace}</p>}
      </div>
    );
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {TYPE_CONFIG[record.type].icon}
          <span className="font-medium text-gray-900">{TYPE_CONFIG[record.type].label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>{record.created_at}</p>
          <p>提交：{record.submitter_name} ({record.submitter_phone})</p>
        </div>
      </div>
      {renderDetail()}
      {record.remark && <p className="text-xs text-gray-500 mt-2">备注：{record.remark}</p>}
      {record.reviewed_by && (
        <p className="text-xs text-gray-400 mt-2">
          {record.status === "approved" ? "已通过" : "已驳回"} · 审核人：{record.reviewed_by} · {record.reviewed_at}
        </p>
      )}
      {record.status === "pending" && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onReview(record.id, "approve")}
            className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Check size={16} />
            通过
          </button>
          <button
            onClick={() => onReview(record.id, "reject")}
            className="flex-1 flex items-center justify-center gap-1 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
          >
            <X size={16} />
            驳回
          </button>
        </div>
      )}
    </div>
  );
}

function FeedbackCard({ record, onReply }: { record: FeedbackRecord; onReply: (id: number, reply: string) => Promise<void> }) {
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-primary-500" />
          <span className={`text-xs px-2 py-0.5 rounded-full ${record.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
            {record.status === "pending" ? "待回复" : "已回复"}
          </span>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>{record.created_at}</p>
          <p>提交：{record.submitter_name} ({record.submitter_phone})</p>
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{record.content}</p>
      {record.status === "replied" && record.reply && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">已回复：{record.reply}</p>
          <p className="text-xs text-gray-400">回复人：{record.replied_by} · {record.replied_at}</p>
        </div>
      )}
      {record.status === "pending" && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <textarea
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
            rows={2}
            placeholder="回复内容..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <button
            onClick={() => { setReplying(true); onReply(record.id, reply.trim()).finally(() => setReplying(false)); }}
            disabled={!reply.trim() || replying}
            className="flex items-center gap-1 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
          >
            <Reply size={14} />
            {replying ? "回复中..." : "回复"}
          </button>
        </div>
      )}
    </div>
  );
}

function UserCard({ record, onRole, onDelete }: {
  record: UserRecord;
  onRole: (id: number, role: "user" | "admin") => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [acting, setActing] = useState(false);
  const run = (fn: () => Promise<void>) => async () => {
    setActing(true);
    try { await fn(); } finally { setActing(false); }
  };
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-500" />
          <span className="font-medium text-gray-900">{record.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${record.role === "admin" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-600"}`}>
            {record.role === "admin" ? "管理员" : "普通用户"}
          </span>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>{record.phone}</p>
          <p>注册：{record.created_at}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {record.role === "user" ? (
          <button
            onClick={run(() => onRole(record.id, "admin"))}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
          >
            <ShieldCheck size={14} />
            设为管理员
          </button>
        ) : (
          <button
            onClick={run(() => onRole(record.id, "user"))}
            disabled={acting}
            className="flex-1 flex items-center justify-center gap-1 bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 disabled:opacity-60 transition-colors"
          >
            <Users size={14} />
            设为普通用户
          </button>
        )}
        <button
          onClick={() => { if (window.confirm(`确认删除用户「${record.name}」（${record.phone}）？此操作不可恢复。`)) { run(() => onDelete(record.id))(); } }}
          disabled={acting}
          className="flex items-center justify-center gap-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-60 transition-colors"
        >
          <Trash2 size={14} />
          删除
        </button>
      </div>
    </div>
  );
}

function ExportSection({ clanId }: { clanId: string }) {
  const [records, setRecords] = useState<ChangeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setRecords(await fetchExportPending(clanId));
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clanId]);

  const handleGenerate = async () => {
    setBusy(true);
    setDoneMsg(null);
    try {
      const r = await generateExport(clanId);
      setText(r.text);
      setCount(r.count);
    } catch (e) {
      setDoneMsg(`生成失败：${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleMark = async () => {
    if (records.length === 0 || !text) return;
    if (!window.confirm(`确认将本次整理（${records.length} 条）标记为已处理？标记后下次不再重复生成。`)) return;
    setBusy(true);
    try {
      const r = await markExported(clanId, records.map((x) => x.id));
      setDoneMsg(r.message);
      setText(null);
      setCount(0);
      await load();
    } catch (e) {
      setDoneMsg(`标记失败：${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = () => {
    if (text == null) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `世系表-新增条目-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileOutput size={18} className="text-primary-600" />
          <h2 className="font-medium text-gray-900">整理人员变动</h2>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          把审核通过的<b>新生 / 结婚 / 去世</b>变动，整理成「世系表」格式文本。
          生成的条目供核对后并入族谱母本；确认并入后请点击「标记已处理」，避免下次重复生成。
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="text-sm text-gray-600">
            待整理：<b className="text-primary-700">{records.length}</b> 条
          </span>
          <button
            onClick={handleGenerate}
            disabled={busy || records.length === 0}
            className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Hammer size={16} />
            {busy ? "生成中..." : "生成世系表条目"}
          </button>
          {text && count > 0 && (
            <>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <Download size={16} />
                下载 txt
              </button>
              <button
                onClick={handleMark}
                disabled={busy}
                className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCheck size={16} />
                标记已处理
              </button>
            </>
          )}
        </div>
        {doneMsg && <p className="text-sm text-gray-600">{doneMsg}</p>}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : records.length === 0 && !text ? (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle2 className="mx-auto mb-2 text-green-400" size={40} />
          暂无待整理的已通过变动
        </div>
      ) : (
        <>
          {records.length > 0 && (
            <div className="space-y-2">
              {records.map((r) => {
                const d = r.data as Record<string, string>;
                const label =
                  r.type === "birth" ? `新生「${d.childName ?? ""}」` :
                  r.type === "marriage" ? `结婚「${d.groomName ?? ""}」配 ${d.brideName ?? ""}` :
                  `去世「${d.name ?? ""}」`;
                return (
                  <div key={r.id} className="card p-3 flex items-center justify-between text-sm">
                    <span className="text-gray-700">{label}</span>
                    <span className="text-xs text-gray-400">#{r.id}</span>
                  </div>
                );
              })}
            </div>
          )}
          {text && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
              <div className="px-4 py-2 bg-gray-100 text-xs text-gray-500 border-b border-gray-200">
                共 {count} 条 · 世系表格式预览（UTF-8）
              </div>
              <pre className="p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-auto">
                {text}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const clanId = useClanId();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [section, setSection] = useState<"changes" | "feedback" | "users" | "ads" | "export">("changes");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [records, setRecords] = useState<ChangeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [fbStatus, setFbStatus] = useState<"pending" | "replied" | "all">("pending");
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [fbLoading, setFbLoading] = useState(false);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  const load = async (s: "pending" | "approved" | "rejected") => {
    setLoading(true);
    try {
      setRecords(await fetchPending(clanId, s));
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbacks = async (s: "pending" | "replied" | "all") => {
    setFbLoading(true);
    try {
      setFeedbacks(await fetchFeedbacks(clanId, s));
    } catch {
      setFeedbacks([]);
    } finally {
      setFbLoading(false);
    }
  };

  const loadUsers = async () => {
    setUserLoading(true);
    try {
      setUsers(await fetchUsers(clanId));
    } catch {
      setUsers([]);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    setActiveClan(clanId);
    setUser(getUser());
    if (!getUser()) {
      router.replace(`/${clanId}/login`);
      return;
    }
    if (getUser()?.role !== "admin") {
      router.replace(`/${clanId}/submit`);
      return;
    }
    if (section === "ads" || section === "export") return;
    if (section === "changes") {
      load(status);
    } else if (section === "feedback") {
      loadFeedbacks(fbStatus);
    } else {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, clanId, section, status, fbStatus]);

  if (!user || user.role !== "admin") {
    return (
      <div className="text-center py-20">
        <ShieldCheck className="mx-auto text-gray-300 mb-3" size={48} />
        <p className="text-gray-500 mb-4">需要管理员权限</p>
        <Link href={`/${clanId}/submit`} className="btn-primary">返回</Link>
      </div>
    );
  }

  const handleReview = async (id: number, decision: "approve" | "reject") => {
    await reviewChange(clanId, id, decision);
    load(status);
  };

  const handleReply = async (id: number, reply: string) => {
    await replyFeedback(clanId, id, reply);
    await loadFeedbacks(fbStatus);
  };

  const handleRole = async (id: number, role: "user" | "admin") => {
    await updateUserRole(clanId, id, role);
    await loadUsers();
  };

  const handleDelete = async (id: number) => {
    await deleteUser(clanId, id);
    await loadUsers();
  };

  const tabs: { key: "pending" | "approved" | "rejected"; label: string }[] = [
    { key: "pending", label: "待审核" },
    { key: "approved", label: "已通过" },
    { key: "rejected", label: "已驳回" },
  ];

  const fbTabs: { key: "pending" | "replied" | "all"; label: string }[] = [
    { key: "pending", label: "待回复" },
    { key: "replied", label: "已回复" },
    { key: "all", label: "全部" },
  ];

  const sectionTabs: { key: "changes" | "feedback" | "users" | "ads" | "export"; label: string }[] = [
    { key: "changes", label: "变更审核" },
    { key: "feedback", label: "反馈管理" },
    { key: "users", label: "用户管理" },
    { key: "ads", label: "广告管理" },
    { key: "export", label: "整理变动" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/${clanId}/submit`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
          <ArrowLeft size={16} />
          返回
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            管理员：{user.name}
          </span>
          <button
            onClick={() => { clearAuth(); router.push(`/${clanId}`); }}
            className="text-xs text-gray-400 hover:text-red-500"
          >
            退出
          </button>
        </div>
      </div>

      <div>
        <h1 className="chinese-heading text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck size={24} className="text-primary-600" />
          管理后台
        </h1>
        <p className="text-sm text-gray-500 mt-1">审核族人信息变更，处理用户反馈，管理注册用户</p>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {sectionTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSection(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all
              ${section === t.key ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.key === "changes" ? <ShieldCheck size={16} /> : t.key === "feedback" ? <MessageSquare size={16} /> : t.key === "users" ? <Users size={16} /> : t.key === "ads" ? <Megaphone size={16} /> : <FileOutput size={16} />}
            {t.label}
          </button>
        ))}
      </div>

      {section === "changes" ? (
        <>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatus(t.key)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all
                  ${status === t.key ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">加载中...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Clock className="mx-auto mb-3 text-gray-300" size={40} />
              暂无{status === "pending" ? "待审核" : status === "approved" ? "已通过" : "已驳回"}记录
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((r) => (
                <AdminCard key={r.id} record={r} onReview={handleReview} />
              ))}
            </div>
          )}
        </>
      ) : section === "feedback" ? (
        <>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {fbTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFbStatus(t.key)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all
                  ${fbStatus === t.key ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {fbLoading ? (
            <div className="text-center py-16 text-gray-400">加载中...</div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MessageSquare className="mx-auto mb-3 text-gray-300" size={40} />
              暂无反馈
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((r) => (
                <FeedbackCard key={r.id} record={r} onReply={handleReply} />
              ))}
            </div>
          )}
        </>
      ) : section === "users" ? (
        <>
          {userLoading ? (
            <div className="text-center py-16 text-gray-400">加载中...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="mx-auto mb-3 text-gray-300" size={40} />
              暂无注册用户
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400">共 {users.length} 位注册用户</p>
              <div className="space-y-3">
                {users.map((r) => (
                  <UserCard key={r.id} record={r} onRole={handleRole} onDelete={handleDelete} />
                ))}
              </div>
            </>
          )}
        </>
      ) : section === "export" ? (
        <ExportSection clanId={clanId} />
      ) : (
        <AdminAdsSection clanId={clanId} />
      )}
    </div>
  );
}
