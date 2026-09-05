import { getSummary } from "@/lib/data";
import { getClanMeta } from "@/lib/clans";
import { getImageBase } from "@/lib/router";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { Trees, Search, BarChart3, BookOpen, Users, User, Heart, PlusCircle, HelpCircle, MessageSquare, Smartphone } from "lucide-react";
import AdSlot from "@/components/AdSlot";

export default function ClanHomePage({ params }: { params: { clanId: string } }) {
  const clanId = params.clanId;
  const meta = getClanMeta(clanId);
  const stats = getSummary(clanId);
  const prefix = `/${clanId}`;
  const imageBase = getImageBase(clanId);

  // 是否有微信小程序码（有则作为功能导航最后一张卡片，无则隐藏）
  const miniprogramPath = path.join(process.cwd(), "public", "images", clanId, "miniprogram-code.png");
  const hasMiniprogram = fs.existsSync(miniprogramPath);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center pt-4 pb-4 md:pt-6 md:pb-6">
        <div className="inline-block mb-1.5 px-4 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
          {meta.region}
        </div>
        <h1 className="chinese-heading text-4xl md:text-5xl font-bold text-gray-900 mb-1.5">
          {meta.name}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {meta.rootIntro}
          历经 <span className="font-medium text-primary-700">{stats.generations}</span> 代。
        </p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center space-y-1">
          <Users className="mx-auto text-primary-600" size={28} />
          <div className="text-2xl font-bold text-gray-900">{stats.totalPeople}</div>
          <div className="text-xs text-gray-500">总计族人</div>
        </div>
        <div className="card text-center space-y-1">
          <User className="mx-auto text-blue-600" size={28} />
          <div className="text-2xl font-bold text-blue-700">{stats.males}</div>
          <div className="text-xs text-gray-500">男</div>
        </div>
        <div className="card text-center space-y-1">
          <Heart className="mx-auto text-pink-600" size={28} />
          <div className="text-2xl font-bold text-pink-700">{stats.females}</div>
          <div className="text-xs text-gray-500">女</div>
        </div>
        <div className="card text-center space-y-1">
          <div className="text-2xl font-bold text-primary-700">{stats.generations}</div>
          <div className="text-xs text-gray-500">世代传承</div>
        </div>
      </section>

      {/* Navigation Cards */}
      <section>
        <h2 className="chinese-heading text-xl font-bold text-gray-900 mb-4">功能导航</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href={`${prefix}/family-tree`} className="card-hover group">
            <Trees className="text-primary-500 group-hover:text-primary-600 mb-2" size={32} />
            <h3 className="font-bold text-gray-900 mb-1">家谱树</h3>
            <p className="text-sm text-gray-500">以树状图浏览家族世代传承，点击展开查看详情</p>
          </Link>

          <Link href={`${prefix}/search`} className="card-hover group">
            <Search className="text-primary-500 group-hover:text-primary-600 mb-2" size={32} />
            <h3 className="font-bold text-gray-900 mb-1">族人搜索</h3>
            <p className="text-sm text-gray-500">按姓名搜索族人，快速定位到任意一个人的详细信息</p>
          </Link>

          <Link href={`${prefix}/stats`} className="card-hover group">
            <BarChart3 className="text-primary-500 group-hover:text-primary-600 mb-2" size={32} />
            <h3 className="font-bold text-gray-900 mb-1">统计分析</h3>
            <p className="text-sm text-gray-500">世代分布、男女比例、各房支人口统计</p>
          </Link>

          <Link href={`${prefix}/documents`} className="card-hover group">
            <BookOpen className="text-primary-500 group-hover:text-primary-600 mb-2" size={32} />
            <h3 className="font-bold text-gray-900 mb-1">家族文献</h3>
            <p className="text-sm text-gray-500">谱序、规条、家训、派行等珍贵家族文献</p>
          </Link>

          <Link href={`${prefix}/about`} className="card-hover group">
            <img
              src={`${imageBase}/logo.png`}
              alt={meta.surname}
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-contain bg-white mb-2"
            />
            <h3 className="font-bold text-gray-900 mb-1">关于本谱</h3>
            <p className="text-sm text-gray-500">{meta.name}编修历程、编委会成员、续修说明</p>
          </Link>

          <Link href={`${prefix}/submit`} className="card-hover group">
            <PlusCircle className="text-primary-500 group-hover:text-primary-600 mb-2" size={32} />
            <h3 className="font-bold text-gray-900 mb-1">提交信息变更</h3>
            <p className="text-sm text-gray-500">登录后记录族人新生、结婚、去世等信息变化</p>
          </Link>

          <Link href={`${prefix}/help`} className="card-hover group">
            <HelpCircle className="text-primary-500 group-hover:text-primary-600 mb-2" size={32} />
            <h3 className="font-bold text-gray-900 mb-1">使用手册</h3>
            <p className="text-sm text-gray-500">注册、登录、提交信息与常见问题说明</p>
          </Link>

          <Link href={`${prefix}/feedback`} className="card-hover group">
            <MessageSquare className="text-primary-500 group-hover:text-primary-600 mb-2" size={32} />
            <h3 className="font-bold text-gray-900 mb-1">意见反馈</h3>
            <p className="text-sm text-gray-500">对族谱信息或网站功能提出建议</p>
          </Link>

          {hasMiniprogram && (
            <div className="card-hover group flex flex-col items-center text-center py-2">
              <img
                src={`${imageBase}/miniprogram-code.png`}
                alt={`${meta.name} 微信小程序码`}
                width={80}
                height={80}
                className="w-20 h-20 object-contain mb-2"
              />
              <h3 className="font-bold text-gray-900 mb-1">微信小程序</h3>
              <p className="text-sm text-gray-500">微信扫一扫，打开 {meta.name} 小程序</p>
            </div>
          )}
        </div>
      </section>

      {/* Branch Cards */}
      <section>
        <h2 className="chinese-heading text-xl font-bold text-gray-900 mb-4">各房支</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.branches.map((b, i) => (
            <div
              key={b}
              className="card border-l-4 border-l-primary text-center py-4 space-y-1"
            >
              <div className="text-lg font-bold text-primary-700 chinese-heading">{meta.surname}{b}</div>
              <div className="text-xs text-gray-500">
                第{i + 1}房支
              </div>
            </div>
          ))}
        </div>
      </section>

      <AdSlot title="家族好礼" keyword="家族好礼 实用好物" />
    </div>
  );
}