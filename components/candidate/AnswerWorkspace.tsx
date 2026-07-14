"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import type { InterviewSession, InterviewSet, Question } from "@/types/db";

export function AnswerWorkspace({
  token,
  set,
  questions,
  session,
}: {
  token: string;
  set: InterviewSet;
  questions: Question[];
  session: InterviewSession;
}) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const q of questions) {
      initial[q.id] = session.final_answers?.[q.id] ?? q.starter_code ?? "";
    }
    return initial;
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [submitting, setSubmitting] = useState(false);
  const dirtyRef = useRef(false);

  const activeQuestion = questions[activeIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) {
        void doSave();
      }
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  async function doSave() {
    setSaveState("saving");
    dirtyRef.current = false;
    const res = await fetch(`/api/interview/${token}/save-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, answers }),
    });
    if (res.ok) {
      setSaveState("saved");
    } else {
      dirtyRef.current = true;
      setSaveState("idle");
    }
  }

  function handleCodeChange(value: string) {
    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: value }));
    dirtyRef.current = true;
  }

  async function handleSubmit() {
    if (!confirm("確定要提交面試嗎？提交後將無法再修改作答內容。")) return;
    setSubmitting(true);
    await doSave();
    const res = await fetch(`/api/interview/${token}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push(`/interview/${token}/done`);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-2 text-sm text-gray-300">
        <div className="font-medium text-white">{set.title}</div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">
            {saveState === "saving" ? "儲存中..." : saveState === "saved" ? "已自動儲存" : ""}
          </span>
          {set.time_limit_minutes && (
            <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs">
              限時 {set.time_limit_minutes} 分鐘
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {submitting ? "提交中..." : "提交"}
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-5 overflow-hidden">
        <div className="col-span-3 flex flex-col overflow-hidden border-r border-gray-800">
          <div className="flex gap-1 bg-gray-950 px-2 pt-2">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setActiveIndex(i)}
                className={`rounded-t-lg px-3 py-2 text-xs font-medium ${
                  i === activeIndex ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                第{i + 1}題
              </button>
            ))}
          </div>
          <div className="flex-1">
            {activeQuestion && (
              <MonacoEditor
                language={activeQuestion.language}
                value={answers[activeQuestion.id] ?? ""}
                onChange={handleCodeChange}
              />
            )}
          </div>
        </div>

        <div className="col-span-2 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-white p-4">
            {activeQuestion && (
              <>
                <h2 className="text-sm font-semibold text-gray-900">{activeQuestion.title}</h2>
                <div className="prose prose-sm mt-2 max-w-none text-gray-700">
                  <ReactMarkdown>{activeQuestion.description}</ReactMarkdown>
                </div>
              </>
            )}
          </div>
          <div className="flex h-56 flex-col border-t border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 text-xs font-medium text-gray-500">AI 助手</div>
            <div className="flex-1 overflow-y-auto rounded-lg bg-white p-2 text-sm text-gray-400">
              AI 助手將於下個階段開放，目前請專注於程式作答。
            </div>
            <input
              disabled
              placeholder="AI 助手尚未啟用"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
