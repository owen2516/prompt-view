"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { InterviewLink } from "@/types/db";

type LinkData = {
  currentLink: InterviewLink | null;
  stats: { totalOpens: number; completedCount: number; completionRate: number };
};

const expiryOptions = [7, 14, 30, 60] as const;

export function LinkTab({
  setId,
  timeLimitMinutes,
}: {
  setId: string;
  timeLimitMinutes: number | null;
}) {
  const [data, setData] = useState<LinkData | null>(null);
  const [expiryDays, setExpiryDays] = useState<7 | 14 | 30 | 60>(30);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/interviews/${setId}/links`);
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  async function handleRegenerate() {
    setRegenerating(true);
    const res = await fetch(`/api/admin/interviews/${setId}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInDays: expiryDays }),
    });
    setRegenerating(false);
    if (res.ok) load();
  }

  function fullUrl(token: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/interview/${token}`;
  }

  async function handleCopy(token: string) {
    await navigator.clipboard.writeText(fullUrl(token));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!data) return <p className="text-sm text-gray-400">載入中...</p>;

  const { currentLink, stats } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <div className="text-sm font-medium text-gray-900">連結狀態</div>
          <p className="text-xs text-gray-500">
            {stats.totalOpens} 次開啟 · {stats.completedCount} 次完成 · 完成率{" "}
            {stats.completionRate}%
          </p>
        </div>
        <span
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium",
            currentLink?.status === "expired"
              ? "bg-red-100 text-red-700"
              : currentLink?.status === "completed"
                ? "bg-gray-100 text-gray-600"
                : "bg-green-100 text-green-700"
          )}
        >
          {currentLink
            ? { pending: "待開始", in_progress: "進行中", completed: "已完成", expired: "已過期" }[
                currentLink.status
              ]
            : "尚未產生"}
        </span>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 text-sm font-medium text-gray-900">面試連結</div>
        {currentLink ? (
          <>
            <div className="flex gap-2">
              <input
                readOnly
                value={fullUrl(currentLink.token)}
                className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600"
              />
              <button
                onClick={() => handleCopy(currentLink.token)}
                className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {copied ? "已複製" : "複製"}
              </button>
              <a
                href={fullUrl(currentLink.token)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                開啟
              </a>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              到期日：{currentLink.expires_at ? new Date(currentLink.expires_at).toLocaleDateString() : "-"}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400">尚未產生連結，請先設定有效期限並產生連結。</p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 text-sm font-medium text-gray-900">連結設定</div>
        <p className="mb-2 text-xs text-gray-500">有效期限（連結生成後，應試者必須在此期限內完成）</p>
        <div className="mb-4 grid grid-cols-4 gap-2">
          {expiryOptions.map((d) => (
            <button
              key={d}
              onClick={() => setExpiryDays(d)}
              className={clsx(
                "rounded-lg border py-2 text-sm font-medium",
                expiryDays === d
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {d} 天
            </button>
          ))}
        </div>
        <div className="mb-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
          面試時間限制：{timeLimitMinutes ?? "依題目設定"} 分鐘
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {regenerating ? "產生中..." : "重新生成連結"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="text-xl font-semibold text-gray-900">{stats.totalOpens}</div>
          <div className="text-xs text-gray-500">連結開啟</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="text-xl font-semibold text-gray-900">{stats.completedCount}</div>
          <div className="text-xs text-gray-500">已完成</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <div className="text-xl font-semibold text-gray-900">{stats.completionRate}%</div>
          <div className="text-xs text-gray-500">完成率</div>
        </div>
      </div>
    </div>
  );
}
