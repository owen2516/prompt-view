import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdminId } from "@/lib/auth";
import { getInterviewSetDetail, updateInterviewSetSettings } from "@/lib/data/interviews";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const detail = await getInterviewSetDetail(adminId, id);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(detail);
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  target_role: z.string().nullable().optional(),
  time_limit_minutes: z.number().int().positive().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  ai_model: z.string().optional(),
  ai_system_prompt: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { id } = await params;
  try {
    const set = await updateInterviewSetSettings(adminId, id, parsed.data);
    return NextResponse.json({ set });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
