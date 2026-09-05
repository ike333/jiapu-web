"use client";

import { getAllDocuments } from "@/lib/data";
import { useClanId } from "@/lib/use-clan";
import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

export default function DocumentsPage() {
  const clanId = useClanId();
  const docs = getAllDocuments(clanId);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const docKeys = Object.keys(docs);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="chinese-heading text-2xl font-bold text-gray-900">家族文献</h1>
        <p className="text-sm text-gray-500 mt-1">珍贵文献，包含谱序、规条、家训、派行等</p>
      </div>

      <div className="space-y-3">
        {docKeys.map((key) => {
          const doc = docs[key];
          const isExpanded = expandedDoc === key;

          return (
            <div key={key} className="card">
              <button
                onClick={() => setExpandedDoc(isExpanded ? null : key)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                    <BookOpen size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 chinese-heading">{doc.title}</h3>
                    <p className="text-xs text-gray-500">
                      {doc.content.length} 字 · {doc.content.split("\n").length} 行
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                    {doc.content.split("\n").map((line, i) => (
                      <p key={i} className="mb-2">
                        {line || "\u00A0"}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {docKeys.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p>暂无文献</p>
        </div>
      )}
    </div>
  );
}