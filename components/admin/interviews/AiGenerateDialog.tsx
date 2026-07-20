"use client";

import { useState } from "react";
import type { Difficulty } from "@/types/db";

export function AiGenerateDialog({
  setId,
  onClose,
  onGenerated,
}: {
  setId: string;
  onClose: () => void;
  onGenerated: (question: {
    title: string;
    description: string;
    starter_code: string;
    difficulty: Difficulty;
    language: string;
  }) => void;
}) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [language, setLanguage] = useState("javascript");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("請輸入職缺或主題");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/interviews/${setId}/questions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          language,
          additionalRequirements: additionalRequirements || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          setError("API 配額已用盡，請稍候再試");
        } else {
          setError(data.message || "產題失敗，請重試");
        }
        return;
      }

      const data = await res.json();
      onGenerated({
        title: data.question.title,
        description: data.question.description,
        starter_code: data.question.starter_code,
        difficulty: data.question.difficulty,
        language,
      });
      onClose();
    } catch (err) {
      setError("網路錯誤，請重試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">AI 產生題目</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              職缺或主題 *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：前端工程師、React hooks、資料結構"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                難度
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="easy">簡單</option>
                <option value="medium">中等</option>
                <option value="hard">困難</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                程式語言
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              額外要求 (可選)
            </label>
            <textarea
              value={additionalRequirements}
              onChange={(e) => setAdditionalRequirements(e.target.value)}
              placeholder="例如：需要考察演算法複雜度、需要考察 async/await 用法等"
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            取消
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {loading ? "產題中..." : "產生題目"}
          </button>
        </div>
      </div>
    </div>
  );
}
