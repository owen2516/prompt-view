"use client";

import { useState } from "react";
import { DifficultyBadge, AiGeneratedBadge } from "@/components/admin/badges";
import { QuestionFormDialog } from "@/components/admin/interviews/QuestionFormDialog";
import { AiGenerateDialog } from "@/components/admin/interviews/AiGenerateDialog";
import type { Difficulty, Question, TestCase } from "@/types/db";

export function QuestionsTab({
  setId,
  questions,
  onChanged,
}: {
  setId: string;
  questions: Question[];
  onChanged: () => void;
}) {
  const [dialogMode, setDialogMode] = useState<"none" | "add" | Question>("none");
  const [showAiGenerate, setShowAiGenerate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const totalMinutes = questions.reduce((sum, q) => sum + (q.time_limit_minutes ?? 0), 0);
  const codeCount = questions.length;

  async function handleAdd(input: {
    title: string;
    description: string;
    language: string;
    difficulty: Difficulty;
    time_limit_minutes: number | null;
    starter_code: string | null;
    is_ai_generated?: boolean;
    test_cases?: TestCase[] | null;
  }) {
    const res = await fetch(`/api/admin/interviews/${setId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("failed");
    setDialogMode("none");
    onChanged();
  }

  async function handleEdit(
    questionId: string,
    input: {
      title: string;
      description: string;
      language: string;
      difficulty: Difficulty;
      time_limit_minutes: number | null;
      starter_code: string | null;
      test_cases?: TestCase[] | null;
    }
  ) {
    const res = await fetch(`/api/admin/interviews/${setId}/questions/${questionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("failed");
    setDialogMode("none");
    onChanged();
  }

  async function handleDelete(questionId: string) {
    if (!confirm("確定要刪除這個題目嗎？")) return;
    setBusyId(questionId);
    await fetch(`/api/admin/interviews/${setId}/questions/${questionId}`, {
      method: "DELETE",
    });
    setBusyId(null);
    onChanged();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const ids = questions.map((q) => q.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    await fetch(`/api/admin/interviews/${setId}/questions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedQuestionIds: ids }),
    });
    onChanged();
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
          <div className="text-xl font-semibold text-gray-900">{questions.length}</div>
          <div className="text-xs text-gray-500">題目數量</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
          <div className="text-xl font-semibold text-gray-900">{totalMinutes} 分</div>
          <div className="text-xs text-gray-500">總時間</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
          <div className="text-xl font-semibold text-gray-900">{codeCount}</div>
          <div className="text-xs text-gray-500">程式題</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
          <div className="text-xl font-semibold text-gray-900">0</div>
          <div className="text-xs text-gray-500">問答題／選擇題</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">序號</th>
              <th className="px-3 py-2 font-medium">標題</th>
              <th className="px-3 py-2 font-medium">難度</th>
              <th className="px-3 py-2 font-medium">時間</th>
              <th className="px-3 py-2 font-medium"></th>
              <th className="px-3 py-2 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => (
              <tr key={q.id} className="border-t border-gray-100">
                <td className="px-3 py-2 text-gray-500">{String(i + 1).padStart(2, "0")}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{q.title}</td>
                <td className="px-3 py-2">
                  <DifficultyBadge difficulty={q.difficulty} />
                </td>
                <td className="px-3 py-2 text-gray-500">{q.time_limit_minutes ?? "-"}m</td>
                <td className="px-3 py-2">{q.is_ai_generated && <AiGeneratedBadge />}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1 text-gray-400">
                    <button
                      disabled={i === 0}
                      onClick={() => handleMove(i, -1)}
                      className="rounded px-1.5 py-0.5 hover:bg-gray-100 disabled:opacity-30"
                      title="上移"
                    >
                      ↑
                    </button>
                    <button
                      disabled={i === questions.length - 1}
                      onClick={() => handleMove(i, 1)}
                      className="rounded px-1.5 py-0.5 hover:bg-gray-100 disabled:opacity-30"
                      title="下移"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => setDialogMode(q)}
                      className="rounded px-1.5 py-0.5 hover:bg-gray-100"
                      title="編輯"
                    >
                      ✎
                    </button>
                    <button
                      disabled={busyId === q.id}
                      onClick={() => handleDelete(q.id)}
                      className="rounded px-1.5 py-0.5 text-red-500 hover:bg-red-50"
                      title="刪除"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-gray-100 flex">
          <button
            onClick={() => setDialogMode("add")}
            className="flex flex-1 items-center justify-center gap-1 py-3 text-sm text-gray-500 hover:bg-gray-50"
          >
            + 新增題目
          </button>
          <button
            onClick={() => setShowAiGenerate(true)}
            className="flex flex-1 items-center justify-center gap-1 border-l border-gray-100 py-3 text-sm text-violet-600 hover:bg-violet-50"
          >
            ✨ AI 產題
          </button>
        </div>
      </div>

      {showAiGenerate && (
        <AiGenerateDialog
          setId={setId}
          onClose={() => setShowAiGenerate(false)}
          onGenerated={async (generated) => {
            await handleAdd({
              title: generated.title,
              description: generated.description,
              starter_code: generated.starter_code,
              difficulty: generated.difficulty,
              language: generated.language,
              time_limit_minutes: null,
              is_ai_generated: true,
            });
          }}
        />
      )}

      {dialogMode !== "none" && (
        <QuestionFormDialog
          initial={dialogMode === "add" ? undefined : dialogMode}
          onClose={() => setDialogMode("none")}
          onSubmit={(input) =>
            dialogMode === "add" ? handleAdd(input) : handleEdit(dialogMode.id, input)
          }
        />
      )}
    </div>
  );
}
