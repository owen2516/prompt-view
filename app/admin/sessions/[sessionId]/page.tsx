"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { ReviewStatusBadge, DifficultyBadge } from "@/components/admin/badges";
import type { InterviewLink, InterviewSession, InterviewSet, Question, Recording } from "@/types/db";

type Detail = {
  session: InterviewSession;
  link: InterviewLink;
  set: InterviewSet;
  questions: Question[];
  recordings: Recording[];
};

export default function SessionDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/admin/sessions/${params.sessionId}`);
    if (!res.ok) return;
    const data: Detail = await res.json();
    setDetail(data);
    if (!activeQuestionId && data.questions.length > 0) {
      setActiveQuestionId(data.questions[0].id);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.sessionId]);

  async function toggleReview() {
    if (!detail) return;
    const next = detail.session.review_status === "pending" ? "reviewed" : "pending";
    await fetch(`/api/admin/sessions/${params.sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_status: next }),
    });
    load();
  }

  if (!detail) {
    return <div className="p-8 text-sm text-gray-400">載入中...</div>;
  }

  const { session, set, questions, recordings } = detail;
  const activeQuestion = questions.find((q) => q.id === activeQuestionId) ?? questions[0];
  const code = activeQuestion
    ? session.final_answers?.[activeQuestion.id] ?? activeQuestion.starter_code ?? ""
    : "";

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <button
          onClick={() => router.push("/admin/sessions")}
          className="mb-2 text-xs text-gray-400 hover:text-gray-600"
        >
          ‹ 返回面試紀錄
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {session.candidate_name} <span className="text-gray-400">·</span> {set.title}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {set.target_role} ·{" "}
              {session.submitted_at
                ? `提交於 ${new Date(session.submitted_at).toLocaleString()}`
                : "作答中"}
            </p>
          </div>
          <button onClick={toggleReview} className="flex items-center gap-2">
            <ReviewStatusBadge status={session.review_status} />
            <span className="text-xs text-gray-400 underline">
              {session.review_status === "pending" ? "標記為已審閱" : "標記為待審閱"}
            </span>
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-5 overflow-hidden">
        <div className="col-span-3 flex flex-col overflow-hidden border-r border-gray-200">
          <div className="flex gap-1 border-b border-gray-200 bg-white px-3 pt-2">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setActiveQuestionId(q.id)}
                className={`rounded-t-lg px-3 py-2 text-xs font-medium ${
                  activeQuestion?.id === q.id
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                第{i + 1}題
              </button>
            ))}
          </div>
          <div className="flex-1">
            {activeQuestion && (
              <MonacoEditor language={activeQuestion.language} value={code} readOnly />
            )}
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-4 overflow-y-auto bg-gray-50 p-4">
          {activeQuestion && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{activeQuestion.title}</h3>
                <DifficultyBadge difficulty={activeQuestion.difficulty} />
              </div>
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown>{activeQuestion.description}</ReactMarkdown>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">AI 自動評分</h3>
            {session.ai_score !== null ? (
              <>
                <div className="text-2xl font-semibold text-violet-700">{session.ai_score}</div>
                <p className="mt-1 text-sm text-gray-600">{session.ai_score_summary}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">尚未評分（AI 自動評分將於 Phase 4 開放）</p>
            )}
          </div>

          <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              AI 對話紀錄 · {session.ai_interaction_count} 次互動
            </h3>
            <p className="text-sm text-gray-400">
              此面試尚未啟用 AI 對話（將於 Phase 2 開放候選人端 AI 助手）。
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">螢幕錄影</h3>
            {recordings.length > 0 ? (
              <div className="flex flex-col gap-2">
                {recordings.map((r) => (
                  <div key={r.id} className="text-xs text-gray-500">
                    {new Date(r.created_at).toLocaleString()} · {r.duration_seconds ?? 0}s
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">尚未啟用螢幕錄影（將於 Phase 3 開放）。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
