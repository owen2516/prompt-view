import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdminId } from "@/lib/auth";
import { listSessions, getDashboardStats } from "@/lib/data/sessions";
import type { ReviewStatus } from "@/types/db";

export async function GET(req: NextRequest) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const reviewStatusParam = searchParams.get("reviewStatus");
  const reviewStatus =
    reviewStatusParam === "pending" || reviewStatusParam === "reviewed"
      ? (reviewStatusParam as ReviewStatus)
      : undefined;
  const interviewSetId = searchParams.get("interviewSetId") ?? undefined;

  const [sessions, stats] = await Promise.all([
    listSessions(adminId, { search, reviewStatus, interviewSetId }),
    getDashboardStats(adminId),
  ]);

  return NextResponse.json({ sessions, stats });
}
