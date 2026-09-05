"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Baby, Heart, Cross, CheckCircle2, LogOut, ShieldCheck } from "lucide-react";
import { getUser, clearAuth, submitBirth, submitMarriage, submitDeath, setActiveClan } from "@/lib/api";
import { useClanId } from "@/lib/use-clan";

type ChangeType = "birth" | "marriage" | "death";

interface FormState {
  childName: string;
  gender: "male" | "female";
  birthDate: string;
  birthTime: string;
  fatherName: string;
  motherName: string;
  birthPlace: string;
  groomName: string;
  brideName: string;
  brideBirthDate: string;
  marriageDate: string;
  name: string;
  deathDate: string;
  age: string;
  burialPlace: string;
  remark: string;
}

const emptyForm: FormState = {
  childName: "",
  gender: "male",
  birthDate: "",
  birthTime: "",
  fatherName: "",
  motherName: "",
  birthPlace: "",
  groomName: "",
  brideName: "",
  brideBirthDate: "",
  marriageDate: "",
  name: "",
  deathDate: "",
  age: "",
  burialPlace: "",
  remark: "",
};

export default function SubmitPage() {
  const router = useRouter();
  const clanId = useClanId();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [type, setType] = useState<ChangeType>("birth");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setActiveClan(clanId);
    setUser(getUser());
    if (!getUser()) {
      router.replace(`/${clanId}/login`);
    }
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

  const setField = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const payload: Record<string, string> = {};
      if (type === "birth") {
        if (!form.childName.trim()) throw new Error("请填写新生儿姓名");
        payload.childName = form.childName.trim();
        payload.gender = form.gender;
        payload.birthDate = form.birthDate;
        payload.birthTime = form.birthTime;
        payload.fatherName = form.fatherName.trim();
        payload.motherName = form.motherName.trim();
        payload.birthPlace = form.birthPlace.trim();
        const res = await submitBirth(clanId, payload);
        setMessage(res.message);
      } else if (type === "marriage") {
        if (!form.groomName.trim()) throw new Error("请填写新郎姓名");
        payload.groomName = form.groomName.trim();
        payload.brideName = form.brideName.trim();
        payload.brideBirthDate = form.brideBirthDate;
        payload.marriageDate = form.marriageDate;
        const res = await submitMarriage(clanId, payload);
        setMessage(res.message);
      } else {
        if (!form.name.trim()) throw new Error("请填写逝者姓名");
        payload.name = form.name.trim();
        payload.deathDate = form.deathDate;
        payload.age = form.age.trim();
        payload.burialPlace = form.burialPlace.trim();
        const res = await submitDeath(clanId, payload);
        setMessage(res.message);
      }
      setForm(emptyForm);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setLoading(false);
    }
  };

  const typeTabs: { key: ChangeType; label: string; icon: React.ReactNode }[] = [
    { key: "birth", label: "新生", icon: <Baby size={18} className="text-pink-500" /> },
    { key: "marriage", label: "结婚", icon: <Heart size={18} className="text-red-500" /> },
    { key: "death", label: "去世", icon: <Cross size={18} className="text-gray-500" /> },
  ];

  const inputCls =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between">
        <Link href={`/${clanId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
          <ShieldCheck size={16} />
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
        <h1 className="chinese-heading text-2xl font-bold text-gray-900">提交族人信息变更</h1>
        <p className="text-sm text-gray-500 mt-1">记录族人新生、结婚、去世等变化，提交后由管理员审核</p>
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

      {/* 类型切换 */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {typeTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setType(t.key); setMessage(""); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all
              ${type === t.key ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {type === "birth" && (
          <>
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                <Baby size={16} className="text-pink-500" />
                新生儿信息
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">新生儿姓名 *</label>
                  <input className={inputCls} value={form.childName} onChange={(e) => setField("childName", e.target.value)} placeholder="例：陈崇小明" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">性别</label>
                  <div className="flex gap-2">
                    {(["male", "female"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setField("gender", g)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors
                          ${form.gender === g
                            ? g === "male" ? "border-blue-400 bg-blue-50 text-blue-700" : "border-pink-400 bg-pink-50 text-pink-700"
                            : "border-gray-200 text-gray-500"}`}
                      >
                        {g === "male" ? "男" : "女"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">出生日期</label>
                    <input type="date" className={inputCls} value={form.birthDate} onChange={(e) => setField("birthDate", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">出生时间</label>
                    <input type="time" className={inputCls} value={form.birthTime} onChange={(e) => setField("birthTime", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">父亲姓名</label>
                    <input className={inputCls} value={form.fatherName} onChange={(e) => setField("fatherName", e.target.value)} placeholder="例：陈安波" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">母亲姓名</label>
                    <input className={inputCls} value={form.motherName} onChange={(e) => setField("motherName", e.target.value)} placeholder="例：王莉" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">出生地</label>
                  <input className={inputCls} value={form.birthPlace} onChange={(e) => setField("birthPlace", e.target.value)} placeholder="例：旬阳县棕溪镇" />
                </div>
              </div>
            </div>
          </>
        )}

        {type === "marriage" && (
          <>
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                <Heart size={16} className="text-red-500" />
                婚姻信息
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">新郎姓名 *</label>
                  <input className={inputCls} value={form.groomName} onChange={(e) => setField("groomName", e.target.value)} placeholder="例：陈安波" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">新娘姓名</label>
                  <input className={inputCls} value={form.brideName} onChange={(e) => setField("brideName", e.target.value)} placeholder="例：王莉" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">新娘出生日期</label>
                    <input type="date" className={inputCls} value={form.brideBirthDate} onChange={(e) => setField("brideBirthDate", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">结婚日期</label>
                    <input type="date" className={inputCls} value={form.marriageDate} onChange={(e) => setField("marriageDate", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {type === "death" && (
          <>
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                <Cross size={16} className="text-gray-500" />
                去世信息
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">逝者姓名 *</label>
                  <input className={inputCls} value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="例：陈章明" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">去世日期</label>
                  <input type="date" className={inputCls} value={form.deathDate} onChange={(e) => setField("deathDate", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">享年</label>
                  <input className={inputCls} value={form.age} onChange={(e) => setField("age", e.target.value)} placeholder="例：85 岁" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">安葬地</label>
                  <input className={inputCls} value={form.burialPlace} onChange={(e) => setField("burialPlace", e.target.value)} placeholder="例：棕溪镇陈家院" />
                </div>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-xs text-gray-500 mb-1 block">备注</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={2}
            value={form.remark}
            onChange={(e) => setField("remark", e.target.value)}
            placeholder="补充说明（可选）"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
            {loading ? "提交中..." : "提交信息"}
          </button>
          <Link href={`/${clanId}/my-changes`} className="btn-outline flex-1 text-center">
            查看我的记录
          </Link>
        </div>
      </form>
    </div>
  );
}