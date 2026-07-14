"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewStatusBadge } from "@/components/admin/badges";

type CandidateSession = {
  id: string;
  status: string;
  review_status: "pending" | "reviewed";
  ai_score: number | null;
  submitted_at: string | null;
  interview_title: string;
};

type CandidateRow = {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
  sessions: CandidateSession[];
};

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/candidates?${params.toString()}`);
    if (!res.ok) return;
    const { candidates } = await res.json();
    setCandidates(candidates);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900">應試者</h1>
      <p className="mt-0.5 text-sm text-gray-500">{candidates?.length ?? 0} 位應試者</p>

      <div className="mt-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋姓名、Email..."
          className="w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {(candidates ?? []).map((c) => (
          <div key={c.id} className="rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">{c.name}</div>
                <div className="text-xs text-gray-400">{c.email ?? "-"}</div>
              </div>
              <div className="text-xs text-gray-400">{c.sessions.length} 場面試</div>
            </button>
            {expandedId === c.id && (
              <div className="border-t border-gray-100">
                {c.sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => router.push(`/admin/sessions/${s.id}`)}
                    className="flex cursor-pointer items-center justify-between px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    <span className="text-gray-700">{s.interview_title}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : "作答中"}</span>
                      <span>AI {s.ai_score ?? "-"}</span>
                      <ReviewStatusBadge status={s.review_status} />
                    </div>
                  </div>
                ))}
                {c.sessions.length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-400">尚無面試紀錄</p>
                )}
              </div>
            )}
          </div>
        ))}
        {(candidates ?? []).length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-400">尚無應試者</p>
        )}
      </div>
    </div>
  );
}
