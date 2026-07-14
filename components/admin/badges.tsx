import clsx from "clsx";
import type { Difficulty, InterviewSetStatus, ReviewStatus } from "@/types/db";

const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

const setStatusMap: Record<InterviewSetStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-gray-100 text-gray-600" },
  published: { label: "已發布", className: "bg-blue-100 text-blue-700" },
  active: { label: "進行中", className: "bg-green-100 text-green-700" },
  expired: { label: "已過期", className: "bg-red-100 text-red-700" },
};

export function SetStatusBadge({ status }: { status: InterviewSetStatus }) {
  const s = setStatusMap[status];
  return <span className={clsx(base, s.className)}>{s.label}</span>;
}

const difficultyMap: Record<Difficulty, { label: string; className: string }> = {
  easy: { label: "簡單", className: "bg-green-100 text-green-700" },
  medium: { label: "中等", className: "bg-amber-100 text-amber-700" },
  hard: { label: "困難", className: "bg-red-100 text-red-700" },
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const d = difficultyMap[difficulty];
  return <span className={clsx(base, d.className)}>{d.label}</span>;
}

const reviewStatusMap: Record<ReviewStatus, { label: string; className: string }> = {
  pending: { label: "待審閱", className: "bg-amber-100 text-amber-700" },
  reviewed: { label: "已審閱", className: "bg-indigo-100 text-indigo-700" },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const s = reviewStatusMap[status];
  return <span className={clsx(base, s.className)}>{s.label}</span>;
}

export function AiGeneratedBadge() {
  return <span className={clsx(base, "bg-purple-100 text-purple-700")}>AI</span>;
}
