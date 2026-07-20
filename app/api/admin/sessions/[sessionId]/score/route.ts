import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdminId } from "@/lib/auth";
import { rescoreSession } from "@/lib/data/sessions";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  try {
    const result = await rescoreSession(adminId, sessionId);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    if (message === "not_found") return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (message === "no_questions") {
      return NextResponse.json({ error: "no_questions", message: "此面試沒有題目可供評分" }, { status: 400 });
    }
    console.error("Rescore error:", e);
    return NextResponse.json({ error: "score_failed", message }, { status: 500 });
  }
}
