"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getClanGenealogy } from "@/lib/clans";
import { getAllPeople, searchPeople, displayName } from "@/lib/data";
import type { PersonNode, PersonFlat } from "@/lib/types";
import { useClanId } from "@/lib/use-clan";
import TreeView from "@/components/TreeView";
import { Search, ListTree, Network } from "lucide-react";

type ViewMode = "tree" | "list";

export default function FamilyTreePage() {
  const router = useRouter();
  const clanId = useClanId();
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [searchQuery, setSearchQuery] = useState("");

  const genealogyData = getClanGenealogy(clanId) as PersonNode[];

  const handleSelectPerson = (name: string) => {
    const all = getAllPeople(clanId);
    const person = all.find((p) => p.name === name);
    if (person) {
      router.push(`/${clanId}/person?id=${person.id}`);
    }
  };

  const searchResults = searchQuery.trim() ? searchPeople(clanId, searchQuery) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="chinese-heading text-2xl font-bold text-gray-900">家谱树</h1>
        <p className="text-sm text-gray-500 mt-1">浏览家族世代传承，点击人名查看详细信息</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("tree")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${viewMode === "tree"
                ? "bg-white text-primary-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <ListTree size={16} />
            树形
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${viewMode === "list"
                ? "bg-white text-primary-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Network size={16} />
            列表
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="搜索族人姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm
                       focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
          />
        </div>
      </div>

      {/* Content */}
      {searchQuery.trim() ? (
        /* Search Results */
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            找到 {searchResults.length} 条结果
          </p>
          {searchResults.map((person) => (
            <button
              key={person.id}
              onClick={() => router.push(`/${clanId}/person?id=${person.id}`)}
              className="card-hover w-full text-left flex items-center gap-3"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium
                  ${person.gender === "male" ? "bg-blue-500" : "bg-pink-500"}`}
              >
                {person.name.slice(-1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{displayName(clanId, person.name)}</div>
                <div className="text-xs text-gray-500">
                  第{person.generation}代 · {person.branch ? `${person.branch}房` : "始祖"}
                  {person.spouseName && ` · ${person.gender === "male" ? "妻" : "夫"}${person.spouseName}`}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {person.path.join(" → ")}
              </div>
            </button>
          ))}
        </div>
      ) : viewMode === "tree" ? (
        /* Tree View */
        <div className="card max-h-[70vh] overflow-y-auto">
          <TreeView
            data={genealogyData}
            onSelectPerson={handleSelectPerson}
            clanId={clanId}
          />
        </div>
      ) : (
        /* List View - all people sorted by generation */
        <ListView clanId={clanId} onSelect={handleSelectPerson} />
      )}
    </div>
  );
}

function ListView({ clanId, onSelect }: { clanId: string; onSelect: (name: string) => void }) {
  const all = getAllPeople(clanId);
  const grouped = new Map<number, PersonFlat[]>();
  for (const p of all) {
    const arr = grouped.get(p.generation) || [];
    arr.push(p);
    grouped.set(p.generation, arr);
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries())
        .sort(([a], [b]) => a - b)
        .map(([gen, people]) => (
          <div key={gen}>
            <h3 className="chinese-heading text-lg font-bold text-primary-700 mb-2 sticky top-16 bg-[#FDF8F3] py-1 z-10">
              第{gen}代 ({people.length}人)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {people.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.name)}
                  className="card-hover text-center py-3 px-2"
                >
                  <div
                    className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-white font-medium mb-1
                      ${p.gender === "male" ? "bg-blue-500" : "bg-pink-500"}`}
                  >
                    {displayName(clanId, p.name).slice(-1)}
                  </div>
                  <div className="text-sm font-medium text-gray-800 truncate">{displayName(clanId, p.name)}</div>
                  <div className="text-xs text-gray-400">
                    {p.branch ? `${p.branch}房` : "始祖"}
                    {p.spouseName && `·${p.gender === "male" ? "妻" : "夫"}${p.spouseName}`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}