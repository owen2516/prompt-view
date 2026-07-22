"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Panel, Group, Separator } from "react-resizable-panels";
import { MonacoEditor } from "@/components/editor/MonacoEditor";
import { AIChatPanel } from "@/components/candidate/AIChatPanel";
import { RunPanel } from "@/components/candidate/RunPanel";
import { isRunnableLanguage } from "@/lib/judge0";
import { useScreenRecorder } from "@/lib/hooks/useScreenRecorder";
import type { InterviewSession, InterviewSet, Question } from "@/types/db";

function VerticalResizeHandle() {
  return <Separator className="relative w-1.5 shrink-0 cursor-col-resize bg-gray-800 transition-colors hover:bg-violet-600 active:bg-violet-600" />;
}

function HorizontalResizeHandle() {
  return <Separator className="relative h-1.5 shrink-0 cursor-row-resize bg-gray-800 transition-colors hover:bg-violet-600 active:bg-violet-600" />;
}

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

  const activeQuestion: Question | undefined = questions[activeIndex];

  const uploadSegment = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      const formData = new FormData();
      formData.append("sessionId", session.id);
      formData.append("durationSeconds", String(durationSeconds));
      formData.append("file", blob, "recording.webm");
      const res = await fetch(`/api/interview/${token}/upload-recording`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`upload_failed_${res.status}`);
    },
    [token, session.id]
  );
  const recorder = useScreenRecorder(uploadSegment);

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
    if (!activeQuestion) return;
    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: value }));
    dirtyRef.current = true;
  }

  async function handleSubmit() {
    if (!confirm("確定要提交面試嗎？提交後將無法再修改作答內容。")) return;
    setSubmitting(true);
    await doSave();
    await recorder.stopAndUpload();
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

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-gray-900">此面試尚未設定題目</h1>
          <p className="mt-2 text-sm text-gray-500">請聯繫招募窗口確認面試連結是否正確。</p>
        </div>
      </div>
    );
  }

  if (recorder.status !== "recording") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-950 p-8 text-center">
          {recorder.status === "denied" ? (
            <>
              <h1 className="text-lg font-semibold text-white">需要螢幕分享授權才能繼續</h1>
              <p className="mt-2 text-sm text-gray-400">
                本面試需要全程錄影，請重新授權螢幕分享後才能作答。
              </p>
            </>
          ) : recorder.status === "interrupted" ? (
            <>
              <h1 className="text-lg font-semibold text-white">螢幕分享已中斷</h1>
              <p className="mt-2 text-sm text-gray-400">
                偵測到螢幕分享已停止，請重新授權以繼續作答（先前的錄影片段已保存）。
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-white">開始作答前，請授權螢幕錄影</h1>
              <p className="mt-2 text-sm text-gray-400">
                本面試會全程錄製您的螢幕畫面，供主管事後檢視。點擊下方按鈕後，請在瀏覽器彈出視窗中選擇分享畫面。
              </p>
            </>
          )}
          <button
            onClick={() => recorder.start()}
            disabled={recorder.status === "requesting"}
            className="mt-6 w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {recorder.status === "requesting" ? "等待授權中..." : "同意並開始錄影"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-2 text-sm text-gray-300">
        <div className="font-medium text-white">{set.title}</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            錄影中
          </span>
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

      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal">
          <Panel defaultSize={60} minSize={30} className="flex flex-col overflow-hidden">
            <div className="flex gap-1 border-r border-gray-800 bg-gray-950 px-2 pt-2">
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
            <div className="flex-1 overflow-hidden border-r border-gray-800">
              <Group orientation="vertical">
                <Panel defaultSize={65} minSize={20}>
                  {activeQuestion && (
                    <MonacoEditor
                      language={activeQuestion.language}
                      value={answers[activeQuestion.id] ?? ""}
                      onChange={handleCodeChange}
                    />
                  )}
                </Panel>
                <HorizontalResizeHandle />
                <Panel defaultSize={35} minSize={15}>
                  {activeQuestion && (
                    <RunPanel
                      key={activeQuestion.id}
                      token={token}
                      sessionId={session.id}
                      questionId={activeQuestion.id}
                      code={answers[activeQuestion.id] ?? ""}
                      hasTestCases={!!activeQuestion.test_cases && activeQuestion.test_cases.length > 0}
                      runnable={isRunnableLanguage(activeQuestion.language)}
                    />
                  )}
                </Panel>
              </Group>
            </div>
          </Panel>

          <VerticalResizeHandle />

          <Panel defaultSize={40} minSize={25} className="flex flex-col overflow-hidden">
            <Group orientation="vertical">
              <Panel defaultSize={55} minSize={20}>
                <div className="h-full overflow-y-auto bg-white p-4">
                  {activeQuestion && (
                    <>
                      <h2 className="text-sm font-semibold text-gray-900">{activeQuestion.title}</h2>
                      <div className="prose prose-sm mt-2 max-w-none text-gray-700">
                        <ReactMarkdown>{activeQuestion.description}</ReactMarkdown>
                      </div>
                    </>
                  )}
                </div>
              </Panel>
              <HorizontalResizeHandle />
              <Panel defaultSize={45} minSize={20}>
                {activeQuestion && (
                  <AIChatPanel
                    token={token}
                    sessionId={session.id}
                    questionId={activeQuestion.id}
                    currentCode={answers[activeQuestion.id] ?? ""}
                  />
                )}
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
