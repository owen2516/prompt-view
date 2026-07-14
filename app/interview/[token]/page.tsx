"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type EntryData = {
  status: "not_found" | "expired" | "completed" | "ready";
  set?: { title: string; target_role: string | null; time_limit_minutes: number | null };
  questions?: { id: string }[];
  existingSession?: { id: string } | null;
};

export default function InterviewEntryPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [data, setData] = useState<EntryData | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/interview/${params.token}`);
    setData(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setStarting(true);
    setError(null);
    const res = await fetch(`/api/interview/${params.token}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateName: name, candidateEmail: email || undefined }),
    });
    setStarting(false);
    if (!res.ok) {
      setError("開始面試失敗，請稍後再試。");
      return;
    }
    router.push(`/interview/${params.token}/answer`);
  }

  if (!data) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">載入中...</div>;
  }

  if (data.status === "not_found") {
    return <CenteredMessage title="連結無效" body="找不到這個面試連結，請確認網址是否正確。" />;
  }
  if (data.status === "expired") {
    return <CenteredMessage title="連結已過期" body="這個面試連結已超過有效期限，請聯繫招募窗口重新取得連結。" />;
  }
  if (data.status === "completed") {
    router.replace(`/interview/${params.token}/done`);
    return null;
  }

  if (data.existingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">歡迎回來</h1>
          <p className="mt-2 text-sm text-gray-500">
            系統偵測到您先前已開始作答，將為您載入先前的進度繼續作答。
          </p>
          <button
            onClick={() => router.push(`/interview/${params.token}/answer`)}
            className="mt-6 w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
          >
            繼續作答
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">{data.set?.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {data.set?.target_role} · 共 {data.questions?.length ?? 0} 題
          {data.set?.time_limit_minutes ? ` · ${data.set.time_limit_minutes} 分鐘` : ""}
        </p>

        <form onSubmit={handleStart} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">姓名</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email（選填）</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={starting}
            className="mt-2 w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {starting ? "準備中..." : "開始面試"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CenteredMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">{body}</p>
      </div>
    </div>
  );
}
