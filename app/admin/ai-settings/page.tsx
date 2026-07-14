"use client";

import { useEffect, useState } from "react";

export default function AiSettingsPage() {
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/ai-settings")
      .then((r) => r.json())
      .then((d) => {
        setModel(d.settings.default_model);
        setPrompt(d.settings.default_system_prompt ?? "");
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/ai-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ default_model: model, default_system_prompt: prompt || null }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900">AI 設定</h1>
      <p className="mt-0.5 text-sm text-gray-500">
        設定全域預設 AI 模型與 System Prompt，新建面試模板時會自動帶入此設定，可於個別面試中覆蓋。
      </p>

      <div className="mt-4 max-w-2xl rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">預設 AI 模型</label>
          <select
            disabled
            value={model}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
          >
            <option value="claude-sonnet-4-6">Claude Sonnet（MVP 階段固定，Phase 5 開放多模型）</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">預設 System Prompt</label>
          <textarea
            rows={6}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "儲存中..." : saved ? "已儲存" : "儲存設定"}
          </button>
        </div>
      </div>
    </div>
  );
}
