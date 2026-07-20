"use client";

import { useState } from "react";

type TestCaseResult = {
  label?: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error: string | null;
};

type RunResult =
  | { mode: "manual"; stdout: string; stderr: string | null; compileOutput: string | null }
  | { mode: "tests"; results: TestCaseResult[] };

export function RunPanel({
  token,
  sessionId,
  questionId,
  code,
  hasTestCases,
  runnable,
}: {
  token: string;
  sessionId: string;
  questionId: string;
  code: string;
  hasTestCases: boolean;
  runnable: boolean;
}) {
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState<"tests" | "manual" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runTests() {
    setRunning("tests");
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/interview/${token}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "執行失敗，請稍後再試");
        return;
      }
      setResult(data);
    } catch {
      setError("網路錯誤，請重試");
    } finally {
      setRunning(null);
    }
  }

  async function runManual() {
    setRunning("manual");
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/interview/${token}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId, code, stdin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "執行失敗，請稍後再試");
        return;
      }
      setResult(data);
    } catch {
      setError("網路錯誤，請重試");
    } finally {
      setRunning(null);
    }
  }

  if (!runnable) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-900 p-4 text-center text-xs text-gray-500">
        此程式語言暫不支援線上執行
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-900 text-gray-200">
      <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">
        <button
          onClick={runTests}
          disabled={!hasTestCases || running !== null}
          title={hasTestCases ? undefined : "此題目尚未設定測試案例"}
          className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          {running === "tests" ? "執行中..." : "▶ 執行測試案例"}
        </button>
        <span className="text-xs text-gray-500">或自訂輸入手動測試 ↓</span>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">
        <input
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="自訂輸入（stdin）"
          className="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-200 placeholder-gray-500 focus:border-violet-500 focus:outline-none"
        />
        <button
          onClick={runManual}
          disabled={running !== null}
          className="rounded bg-gray-700 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-40"
        >
          {running === "manual" ? "執行中..." : "▶ 執行"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs">
        {error && <div className="rounded bg-red-950 p-2 text-red-300">{error}</div>}

        {!error && !result && (
          <p className="text-gray-500">尚未執行。點上方按鈕執行測試案例，或輸入自訂內容手動測試。</p>
        )}

        {result?.mode === "manual" && (
          <div className="flex flex-col gap-2">
            {result.compileOutput && (
              <div>
                <div className="mb-1 text-gray-500">編譯錯誤</div>
                <pre className="whitespace-pre-wrap rounded bg-gray-800 p-2 text-amber-300">
                  {result.compileOutput}
                </pre>
              </div>
            )}
            <div>
              <div className="mb-1 text-gray-500">stdout</div>
              <pre className="whitespace-pre-wrap rounded bg-gray-800 p-2 text-gray-200">
                {result.stdout || "(無輸出)"}
              </pre>
            </div>
            {result.stderr && (
              <div>
                <div className="mb-1 text-gray-500">stderr</div>
                <pre className="whitespace-pre-wrap rounded bg-gray-800 p-2 text-red-300">
                  {result.stderr}
                </pre>
              </div>
            )}
          </div>
        )}

        {result?.mode === "tests" && (
          <div className="flex flex-col gap-2">
            <div className="text-gray-400">
              通過 {result.results.filter((r) => r.passed).length} / {result.results.length}
            </div>
            {result.results.map((r, i) => (
              <div
                key={i}
                className={`rounded border p-2 ${
                  r.passed ? "border-emerald-800 bg-emerald-950/40" : "border-red-900 bg-red-950/40"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className={r.passed ? "text-emerald-400" : "text-red-400"}>
                    {r.passed ? "✓ 通過" : "✗ 未通過"} {r.label ? `— ${r.label}` : `— 測試 ${i + 1}`}
                  </span>
                </div>
                {!r.passed && (
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <div className="text-gray-500">輸入</div>
                      <pre className="whitespace-pre-wrap text-gray-300">{r.input || "(空)"}</pre>
                    </div>
                    <div>
                      <div className="text-gray-500">預期輸出</div>
                      <pre className="whitespace-pre-wrap text-gray-300">{r.expectedOutput}</pre>
                    </div>
                    <div>
                      <div className="text-gray-500">實際輸出</div>
                      <pre className="whitespace-pre-wrap text-red-300">{r.error || r.actualOutput || "(無輸出)"}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
