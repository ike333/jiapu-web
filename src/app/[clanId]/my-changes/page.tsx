"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Baby, Heart, Cross, Clock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { getUser, fetchMyChanges, setActiveClan, type ChangeRecord } from "@/lib/api";
import { useClanId } from "@/lib/use-clan";

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending: { label: "待审核", cls: "bg-amber-100 text-amber-700", icon: <Clock size={12} /> },
  approved: { label: "已通过", cls: "bg-green-100 text-green-700", icon: <CheckCircle2 size={12} /> },
  rejected: { label: "已驳回", cls: "bg-red-100 text-red-600", icon: <XCircle size={12} /> },
};

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  birth: { label: "新生", icon: <Baby size={16} className="text-pink-500" /> },
  marriage: { label: "结婚", icon: <Heart size={16} className="text-red-500" /> },
  death: { label: "去世", icon: <Cross size={16} className="text-gray-500" /> },
};

function ChangeCard({ record }: { record: ChangeRecord }) {
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
          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${status.cls}`}>
            {status.icon}
            {status.label}
          </span>
        </div>
        <span className="text-xs text-gray-400">{record.created_at}</span>
      </div>
      {renderDetail()}
      {record.remark && <p className="text-xs text-gray-500 mt-2">备注：{record.remark}</p>}
      {record.reviewed_by && (
        <p className="text-xs text-gray-400 mt-2">
          {record.status === "approved" ? "审核通过" : "驳回"} · 审核人：{record.reviewed_by}
          {record.reviewed_at && ` · ${record.reviewed_at}`}
        </p>
      )}
    </div>
  );
}

export default function MyChangesPage() {
  const router = useRouter();
  const clanId = useClanId();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [records, setRecords] = useState<ChangeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveClan(clanId);
    setUser(getUser());
    if (!getUser()) {
      router.replace(`/${clanId}/login`);
      return;
    }
    fetchMyChanges(clanId)
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/${clanId}/submit`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
          <ArrowLeft size={16} />
          返回提交
        </Link>
        <Link href={`/${clanId}/admin`} className="text-sm text-primary-600 hover:text-primary-700">
          管理员入口 →
        </Link>
      </div>

      <div>
        <h1 className="chinese-heading text-2xl font-bold text-gray-900">我的记录</h1>
        <p className="text-sm text-gray-500 mt-1">共 {records.length} 条记录</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">加载中...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">还没有提交过记录</p>
          <Link href={`/${clanId}/submit`} className="btn-primary">去提交</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <ChangeCard key={r.id} record={r} />
          ))}
        </div>
      )}
    </div>
  );
}