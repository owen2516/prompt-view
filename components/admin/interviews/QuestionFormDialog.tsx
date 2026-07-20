"use client";

import { useState } from "react";
import { isRunnableLanguage } from "@/lib/judge0";
import type { Difficulty, Question, TestCase } from "@/types/db";

const languages = [
  "javascript",
  "typescript",
  "python",
  "java",
  "go",
  "sql",
];

export function QuestionFormDialog({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: Question;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    description: string;
    language: string;
    difficulty: Difficulty;
    time_limit_minutes: number | null;
    starter_code: string | null;
    test_cases: TestCase[] | null;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [language, setLanguage] = useState(initial?.language ?? "javascript");
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? "medium");
  const [timeLimit, setTimeLimit] = useState(String(initial?.time_limit_minutes ?? 20));
  const [starterCode, setStarterCode] = useState(initial?.starter_code ?? "");
  const [testCases, setTestCases] = useState<TestCase[]>(initial?.test_cases ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTestCase(index: number, field: keyof TestCase, value: string) {
    setTestCases((prev) =>
      prev.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc))
    );
  }

  function addTestCase() {
    setTestCases((prev) => [...prev, { input: "", expected_output: "", label: "" }]);
  }

  function removeTestCase(index: number) {
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title,
        description,
        language,
        difficulty,
        time_limit_minutes: timeLimit ? Number(timeLimit) : null,
        starter_code: starterCode || null,
        test_cases: testCases.length > 0 ? testCases : null,
      });
    } catch {
      setError("儲存失敗，請再試一次");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {initial ? "編輯題目" : "新增題目"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">題目標題</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              題目描述（Markdown）
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">程式語言</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">難度</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="easy">簡單</option>
                <option value="medium">中等</option>
                <option value="hard">困難</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">單題時間（分）</label>
              <input
                type="number"
                min={1}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">起始程式碼（選填）</label>
            <textarea
              rows={4}
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                測試案例（選填，用於候選人端「測試」功能自動批改）
              </label>
              <button
                type="button"
                onClick={addTestCase}
                className="text-xs font-medium text-violet-600 hover:text-violet-700"
              >
                + 新增測試案例
              </button>
            </div>
            {!isRunnableLanguage(language) && testCases.length > 0 && (
              <p className="mb-2 text-xs text-amber-600">
                目前選擇的語言（{language}）不支援線上執行，測試案例將不會生效。
              </p>
            )}
            <p className="mb-2 text-xs text-gray-400">
              執行方式為標準輸入/輸出：候選人的程式需從 stdin 讀取「輸入」，並將結果 print 到
              stdout，系統會逐行比對輸出是否與「預期輸出」完全相符（前後空白會自動忽略）。
            </p>
            {testCases.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400">
                尚未新增測試案例
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {testCases.map((tc, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <input
                        value={tc.label ?? ""}
                        onChange={(e) => updateTestCase(i, "label", e.target.value)}
                        placeholder={`測試案例 ${i + 1} 名稱（選填）`}
                        className="w-2/3 rounded border border-gray-200 px-2 py-1 text-xs focus:border-violet-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeTestCase(i)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        刪除
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">輸入（stdin）</label>
                        <textarea
                          rows={2}
                          value={tc.input}
                          onChange={(e) => updateTestCase(i, "input", e.target.value)}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs font-mono focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">預期輸出</label>
                        <textarea
                          rows={2}
                          value={tc.expected_output}
                          onChange={(e) => updateTestCase(i, "expected_output", e.target.value)}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs font-mono focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {saving ? "儲存中..." : "儲存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
