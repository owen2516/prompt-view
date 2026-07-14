"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { SetStatusBadge } from "@/components/admin/badges";
import type { InterviewSetCard } from "@/lib/data/interviews";
import type { InterviewSetStatus } from "@/types/db";

const filters: { key: "all" | InterviewSetStatus; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "active", label: "進行中" },
  { key: "published", label: "已發布" },
  { key: "draft", label: "草稿" },
  { key: "expired", label: "已過期" },
];

export function InterviewListPanel({
  sets,
  selectedId,
  onSelect,
  onCreateClick,
}: {
  sets: InterviewSetCard[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | InterviewSetStatus>("all");

  const filtered = useMemo(() => {
    return sets.filter((s) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sets, search, filter]);

  return (
    <div className="flex w-80 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 pt-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">面試管理</h1>
          <p className="text-xs text-gray-500">{sets.length} 個面試模板</p>
        </div>
        <button
          onClick={onCreateClick}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 新增
        </button>
      </div>

      <div className="px-4 pt-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋面試..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <div className="flex flex-wrap gap-2 px-4 pt-3">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-medium",
              filter === f.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex-1 overflow-y-auto px-3 pb-4">
        {filtered.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-400">沒有符合的面試模板</p>
        )}
        <div className="flex flex-col gap-2">
          {filtered.map((set) => (
            <button
              key={set.id}
              onClick={() => onSelect(set.id)}
              className={clsx(
                "w-full rounded-lg border p-3 text-left",
                selectedId === set.id
                  ? "border-violet-300 bg-violet-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-blue-700">{set.title}</span>
                <SetStatusBadge status={set.status} />
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{set.target_role || "未設定職位"}</p>
              <p className="mt-2 text-xs text-gray-400">
                {set.question_count} 題 · {set.completed_count}/{set.total_opens} 完成 ·{" "}
                {set.time_limit_minutes ?? set.total_question_minutes} 分鐘
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
