"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnswerWorkspace } from "@/components/candidate/AnswerWorkspace";
import type { InterviewSession, InterviewSet, Question } from "@/types/db";

type EntryData = {
  status: "not_found" | "expired" | "completed" | "ready";
  set?: InterviewSet;
  questions?: Question[];
  existingSession?: InterviewSession | null;
};

export default function AnswerPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [data, setData] = useState<EntryData | null>(null);

  useEffect(() => {
    fetch(`/api/interview/${params.token}`)
      .then((r) => r.json())
      .then(setData);
  }, [params.token]);

  useEffect(() => {
    if (!data) return;
    if (data.status === "completed") {
      router.replace(`/interview/${params.token}/done`);
    } else if (data.status !== "ready" || !data.existingSession) {
      router.replace(`/interview/${params.token}`);
    }
  }, [data, params.token, router]);

  if (!data || data.status !== "ready" || !data.existingSession || !data.set || !data.questions) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">載入中...</div>;
  }

  return (
    <AnswerWorkspace
      token={params.token}
      set={data.set}
      questions={data.questions}
      session={data.existingSession}
    />
  );
}
