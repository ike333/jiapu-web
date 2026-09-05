import Link from "next/link";
import { TreePine, Users } from "lucide-react";
import { getClanIds, getClanMeta } from "@/lib/clans";
import { getSummary } from "@/lib/data";

export default function ClanPickerPage() {
  const clanIds = getClanIds();

  return (
    <div className="space-y-8">
      <section className="text-center pt-4 pb-4 md:pt-6 md:pb-6">
        <div className="inline-block mb-1.5 px-4 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
          我们的家谱平台
        </div>
        <h1 className="chinese-heading text-4xl md:text-5xl font-bold text-gray-900 mb-1.5">
          我们的家谱
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          一套程序承载多个家族宗谱，点击进入对应的族谱站点。
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {clanIds.map((clanId) => {
          const stats = getSummary(clanId);
          const meta = getClanMeta(clanId);
          return (
            <Link
              key={clanId}
              href={`/${clanId}`}
              className="card-hover group text-center py-8"
            >
              <TreePine className="mx-auto text-primary-500 group-hover:text-primary-600 mb-3" size={40} />
              <h2 className="chinese-heading text-2xl font-bold text-gray-900 mb-1">
                {meta.name}
              </h2>
              <p className="text-sm text-gray-500 mb-3">
                始迁祖{stats.rootName} · {stats.generations} 代
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {stats.totalPeople} 人
                </span>
                <span>文档 {stats.documents} 篇</span>
                <span>照片 {stats.photos} 张</span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}