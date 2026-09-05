"use client";

import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown, User, Heart, Dot } from "lucide-react";
import type { PersonNode } from "@/lib/types";
import { displayName } from "@/lib/data";

interface TreeNodeProps {
  node: PersonNode;
  depth: number;
  path: string[];
  onSelect: (name: string) => void;
  clanId: string;
}

function TreeNodeComponent({ node, depth, path, onSelect, clanId }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const currentPath = [...path, node.name];

  const toggle = useCallback(() => {
    if (hasChildren) setExpanded((v) => !v);
  }, [hasChildren]);

  return (
    <div className="select-none">
      {/* Node Row */}
      <div
        className={`
          flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer
          transition-all duration-150 group
          ${depth === 0 ? "bg-primary-50 hover:bg-primary-100" : "hover:bg-gray-50"}
        `}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        {/* Expand Toggle */}
        <button
          onClick={toggle}
          className={`
            w-5 h-5 flex items-center justify-center rounded text-gray-400
            transition-all duration-200
            ${hasChildren ? "hover:bg-gray-200 hover:text-gray-600" : "invisible"}
          `}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Gender Icon */}
        {node.gender === "male" ? (
          <User size={14} className="text-blue-500 shrink-0" />
        ) : (
          <Heart size={14} className="text-pink-500 shrink-0" />
        )}

        {/* Name */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node.name);
          }}
          className={`
            text-sm font-medium text-left transition-colors
            ${depth === 0 ? "text-primary-800 font-bold text-base" : "text-gray-800"}
            group-hover:text-primary-600
          `}
        >
          {displayName(clanId, node.name)}
        </button>
        {node.detail && node.detail.startsWith("妻") && (
          <>
            <Dot size={12} className="text-gray-300" />
            <span className="text-xs text-gray-400 truncate max-w-[200px]">
              {extractSpouseBrief(node.detail)}
            </span>
          </>
        )}

        {/* Children Count Badge */}
        {hasChildren && !expanded && (
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {node.children.length}子
          </span>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="border-l-2 border-gray-200 ml-[calc(var(--indent)_+_10px)]">
          {node.children.map((child, i) => (
            <TreeNodeComponent
              key={child.name + i}
              node={child}
              depth={depth + 1}
              path={currentPath}
              onSelect={onSelect}
              clanId={clanId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function extractSpouseBrief(detail: string): string {
  if (!detail) return "";
  const m = detail.match(/妻([^，。,\r\n]+?)(?:，|。|$|[\r\n])/);
  return m ? m[1].trim() : "";
}

interface TreeViewProps {
  data: PersonNode[];
  onSelectPerson: (name: string) => void;
  clanId: string;
}

export default function TreeView({ data, onSelectPerson, clanId }: TreeViewProps) {
  const [collapsedAll, setCollapsedAll] = useState(false);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-100">
        <button
          onClick={() => setCollapsedAll(!collapsedAll)}
          className="text-xs text-gray-500 hover:text-primary-600 transition-colors"
        >
          {collapsedAll ? "全部展开" : "全部折叠"}
        </button>
      </div>

      {/* Tree */}
      <div className="space-y-0">
        {data.map((node, i) => (
          <TreeNodeComponent
            key={node.name + i}
            node={node}
            depth={0}
            path={[]}
            onSelect={onSelectPerson}
            clanId={clanId}
          />
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>暂无数据</p>
        </div>
      )}
    </div>
  );
}
