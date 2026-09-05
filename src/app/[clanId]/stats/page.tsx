"use client";

import { getGenerationStats, getBranchStats, getSummary } from "@/lib/data";
import { useClanId } from "@/lib/use-clan";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#1565C0", "#42A5F5", "#90CAF9", "#64B5F6", "#1E88E5"];
const GENDER_COLORS = ["#1565C0", "#EC407A"];

export default function StatsPage() {
  const clanId = useClanId();
  const genStats = getGenerationStats(clanId);
  const branchStats = getBranchStats(clanId);
  const summary = getSummary(clanId);

  // 世代分布柱状图数据
  const genChartData = genStats.map((g) => ({
    name: `第${g.generation}代`,
    男: g.male,
    女: g.female,
    总计: g.total,
  }));

  // 男女比例饼图数据
  const genderData = [
    { name: "男", value: summary.males },
    { name: "女", value: summary.females },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="chinese-heading text-2xl font-bold text-gray-900">统计分析</h1>
        <p className="text-sm text-gray-500 mt-1">宗谱数据统计与分析</p>
      </div>

      {/* 总览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-700">{summary.totalPeople}</div>
          <div className="text-xs text-gray-500 mt-1">总人数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{summary.males}</div>
          <div className="text-xs text-gray-500 mt-1">男性</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-pink-500">{summary.females}</div>
          <div className="text-xs text-gray-500 mt-1">女性</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-700">{summary.generations}</div>
          <div className="text-xs text-gray-500 mt-1">传承代数</div>
        </div>
      </div>

      {/* 世代分布图 */}
      <div className="card">
        <h2 className="chinese-heading text-lg font-bold text-gray-900 mb-4">世代人口分布</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={genChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="男" fill="#1565C0" radius={[4, 4, 0, 0]} />
            <Bar dataKey="女" fill="#EC407A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 房支统计图 + 性别比例图 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="chinese-heading text-lg font-bold text-gray-900 mb-4">房支人口分布</h2>
          <div className="space-y-3">
            {branchStats.map((b, i) => {
              const pct = summary.totalPeople > 0
                ? ((b.count / summary.totalPeople) * 100).toFixed(1)
                : 0;
              return (
                <div key={b.branch}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{b.branch}房</span>
                    <span className="text-gray-500">
                      {b.count}人 ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(b.count / summary.totalPeople) * 100}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="chinese-heading text-lg font-bold text-gray-900 mb-4">男女比例</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}人`}
              >
                {genderData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={GENDER_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 详细数据表 */}
      <div className="card">
        <h2 className="chinese-heading text-lg font-bold text-gray-900 mb-4">各代详表</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-600">世代</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600">男</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600">女</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600">合计</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600">男女比</th>
              </tr>
            </thead>
            <tbody>
              {genStats.map((g) => (
                <tr key={g.generation} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium text-gray-800">第{g.generation}代</td>
                  <td className="py-2 px-3 text-right text-blue-600">{g.male}</td>
                  <td className="py-2 px-3 text-right text-pink-500">{g.female}</td>
                  <td className="py-2 px-3 text-right font-medium text-gray-800">{g.total}</td>
                  <td className="py-2 px-3 text-right text-gray-500">
                    {g.female === 0 ? "-" : (g.male / g.female).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}