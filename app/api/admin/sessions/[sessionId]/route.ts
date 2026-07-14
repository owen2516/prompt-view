import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdminId } from "@/lib/auth";
import { getSessionDetail, setReviewStatus } from "@/lib/data/sessions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  const detail = await getSessionDetail(adminId, sessionId);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(detail);
}

const patchSchema = z.object({
  review_status: z.enum(["pending", "reviewed"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { sessionId } = await params;
  try {
    await setReviewStatus(adminId, sessionId, parsed.data.review_status);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
