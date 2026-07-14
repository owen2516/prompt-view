"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { QuestionsTab } from "@/components/admin/interviews/QuestionsTab";
import { LinkTab } from "@/components/admin/interviews/LinkTab";
import { SettingsTab } from "@/components/admin/interviews/SettingsTab";
import type { InterviewSet, Question } from "@/types/db";

type Tab = "questions" | "link" | "settings";

export function InterviewDetailPanel({ setId }: { setId: string }) {
  const [tab, setTab] = useState<Tab>("questions");
  const [detail, setDetail] = useState<{ set: InterviewSet; questions: Question[] } | null>(
    null
  );
  const [showAiToast, setShowAiToast] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/interviews/${setId}`);
    if (res.ok) setDetail(await res.json());
  }

  useEffect(() => {
    setDetail(null);
    setTab("questions");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  function handleAiGenerateClick() {
    setShowAiToast(true);
    setTimeout(() => setShowAiToast(false), 2500);
  }

  if (!detail) {
    return <div className="flex-1 p-8 text-sm text-gray-400">載入中...</div>;
  }

  const { set, questions } = detail;
  const totalMinutes = questions.reduce((sum, q) => sum + (q.time_limit_minutes ?? 0), 0);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-gray-100 bg-white px-6 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{set.title}</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {set.target_role || "未設定職位"} · {set.time_limit_minutes ?? totalMinutes} 分鐘 ·
              Claude Sonnet
            </p>
          </div>
          <div className="relative">
            <button
              onClick={handleAiGenerateClick}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              ✨ AI 產生題目
            </button>
            {showAiToast && (
              <div className="absolute right-0 top-11 z-10 w-56 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-lg">
                AI 產生題目功能將於 Phase 2 開放，本階段請手動新增題目。
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-6">
          {(
            [
              ["questions", "題目列表"],
              ["link", "面試連結"],
              ["settings", "設定"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                "border-b-2 pb-2 text-sm font-medium",
                tab === key
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === "questions" && (
          <QuestionsTab setId={set.id} questions={questions} onChanged={load} />
        )}
        {tab === "link" && <LinkTab setId={set.id} timeLimitMinutes={set.time_limit_minutes} />}
        {tab === "settings" && <SettingsTab set={set} onSaved={load} />}
      </div>
    </div>
  );
}
