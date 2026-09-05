"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchPeople, getAllPeople, displayName } from "@/lib/data";
import type { SearchResult } from "@/lib/types";
import { useClanId } from "@/lib/use-clan";
import { Search, User, Heart, ChevronRight, Clock } from "lucide-react";

export default function SearchPage() {
  const router = useRouter();
  const clanId = useClanId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.trim().length >= 1) {
      setResults(searchPeople(clanId, q));
    } else {
      setResults([]);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="chinese-heading text-2xl font-bold text-gray-900">族人搜索</h1>
        <p className="text-sm text-gray-500 mt-1">按姓名搜索族人，支持模糊匹配</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="输入族人姓名（支持模糊搜索）..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg
                     focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none
                     transition-all duration-200"
          autoFocus
        />
      </div>

      {/* Results */}
      {!query.trim() ? (
        <div className="text-center py-16">
          <Search className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-400">输入姓名开始搜索</p>
          <p className="text-xs text-gray-300 mt-1">
            共收录 {getAllPeople(clanId).length} 位族人
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            找到 <span className="font-medium text-primary-600">{results.length}</span> 条结果
          </p>
          {results.map((person) => (
            <button
              key={person.id}
              onClick={() => router.push(`/${clanId}/person?id=${person.id}`)}
              className="card-hover w-full text-left"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shrink-0
                    ${person.gender === "male" ? "bg-blue-500" : "bg-pink-500"}`}
                >
                  {person.name.slice(-1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{displayName(clanId, person.name)}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        person.gender === "male"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-pink-50 text-pink-600"
                      }`}
                    >
                      {person.gender === "male" ? "男" : "女"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    第{person.generation}代 · {person.branch ? `${person.branch}房` : "始祖"}
                    {person.spouseName && ` · ${person.gender === "male" ? "妻" : "夫"}${person.spouseName}`}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                    {person.path.join(" → ")}
                  </div>
                </div>
                <ChevronRight className="text-gray-300 shrink-0 mt-2" size={16} />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400">未找到匹配的族人</p>
          <p className="text-sm text-gray-300 mt-1">尝试输入更简短的姓名</p>
        </div>
      )}
    </div>
  );
}