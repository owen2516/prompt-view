"use client";

import { useState } from "react";
import type { InterviewSet } from "@/types/db";

export function SettingsTab({
  set,
  onSaved,
}: {
  set: InterviewSet;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(set.title);
  const [targetRole, setTargetRole] = useState(set.target_role ?? "");
  const [timeLimit, setTimeLimit] = useState(String(set.time_limit_minutes ?? ""));
  const [expiresAt, setExpiresAt] = useState(
    set.expires_at ? set.expires_at.slice(0, 10) : ""
  );
  const [systemPrompt, setSystemPrompt] = useState(set.ai_system_prompt ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/admin/interviews/${set.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        target_role: targetRole || null,
        time_limit_minutes: timeLimit ? Number(timeLimit) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        ai_model: set.ai_model ?? "claude-sonnet-4-6",
        ai_system_prompt: systemPrompt || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 1500);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">基本資訊</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">面試標題</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">應徵職位</label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                總時間限制（分鐘）
              </label>
              <input
                type="number"
                min={1}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">到期日</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">AI 設定</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">AI 模型</label>
            <select
              disabled
              value="claude"
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
            >
              <option value="claude">Claude Sonnet（MVP 階段固定，Phase 5 開放多模型）</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">AI 系統提示詞</label>
            <p className="mb-1 text-xs text-gray-400">定義 AI 在面試過程中的角色與行為準則</p>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
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
  );
}
