"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/admin/StatCard";
import { ReviewStatusBadge } from "@/components/admin/badges";
import type { SessionRow } from "@/lib/data/sessions";
import type { ReviewStatus } from "@/types/db";

type Stats = {
  total: number;
  pendingReview: number;
  avgDurationMinutes: number;
  avgAiInteractions: number;
  avgAiScore: number;
};

export default function SessionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SessionRow[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState<"all" | ReviewStatus>("pending");
  const [interviewSets, setInterviewSets] = useState<{ id: string; title: string }[]>([]);
  const [setFilter, setSetFilter] = useState<string>("all");

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (reviewFilter !== "all") params.set("reviewStatus", reviewFilter);
    if (setFilter !== "all") params.set("interviewSetId", setFilter);

    const res = await fetch(`/api/admin/sessions?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.sessions);
    setStats(data.stats);
  }

  useEffect(() => {
    fetch("/api/admin/interviews")
      .then((r) => r.json())
      .then((d) => setInterviewSets(d.sets.map((s: { id: string; title: string }) => ({ id: s.id, title: s.title }))));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, reviewFilter, setFilter]);

  async function toggleReview(row: SessionRow, e: React.MouseEvent) {
    e.stopPropagation();
    const next = row.review_status === "pending" ? "reviewed" : "pending";
    await fetch(`/api/admin/sessions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_status: next }),
    });
    load();
  }

  function formatDuration(row: SessionRow) {
    if (!row.started_at || !row.submitted_at) return "-";
    const minutes = Math.round(
      (new Date(row.submitted_at).getTime() - new Date(row.started_at).getTime()) / 60000
    );
    return `${minutes}m`;
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900">面試紀錄</h1>
      <p className="mt-0.5 text-sm text-gray-500">
        共 {stats?.total ?? 0} 筆紀錄 · {stats?.pendingReview ?? 0} 筆待審閱
      </p>

      <div className="mt-4 grid grid-cols-5 gap-3">
        <StatCard value={stats?.total ?? 0} label="總面試場次" />
        <StatCard value={stats?.pendingReview ?? 0} label="待審閱" highlight />
        <StatCard value={`${stats?.avgDurationMinutes ?? 0} 分鐘`} label="平均作答時間" />
        <StatCard value={stats?.avgAiInteractions ?? 0} label="平均 AI 互動" />
        <StatCard value={stats?.avgAiScore ?? 0} label="平均 AI 評分" />
      </div>

      <div className="mt-4 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋應試者姓名、Email..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <select
          value={reviewFilter}
          onChange={(e) => setReviewFilter(e.target.value as "all" | ReviewStatus)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">全部狀態</option>
          <option value="pending">待審閱</option>
          <option value="reviewed">已審閱</option>
        </select>
        <select
          value={setFilter}
          onChange={(e) => setSetFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="all">全部面試</option>
          {interviewSets.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">應試者</th>
              <th className="px-4 py-2 font-medium">面試題組</th>
              <th className="px-4 py-2 font-medium">職位</th>
              <th className="px-4 py-2 font-medium">提交時間</th>
              <th className="px-4 py-2 font-medium">作答時長</th>
              <th className="px-4 py-2 font-medium">AI 互動</th>
              <th className="px-4 py-2 font-medium">AI 評分</th>
              <th className="px-4 py-2 font-medium">審閱狀態</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <tr
                key={row.id}
                onClick={() => router.push(`/admin/sessions/${row.id}`)}
                className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{row.candidate_name ?? "-"}</div>
                  <div className="text-xs text-gray-400">{row.candidate_email ?? "-"}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.interview_title}</td>
                <td className="px-4 py-3 text-gray-600">{row.target_role ?? "-"}</td>
                <td className="px-4 py-3 text-gray-600">
                  {row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "作答中"}
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDuration(row)}</td>
                <td className="px-4 py-3 text-gray-600">{row.ai_interaction_count}</td>
                <td className="px-4 py-3 text-gray-600">{row.ai_score ?? "-"}</td>
                <td className="px-4 py-3">
                  <button onClick={(e) => toggleReview(row, e)}>
                    <ReviewStatusBadge status={row.review_status} />
                  </button>
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                  尚無面試紀錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
