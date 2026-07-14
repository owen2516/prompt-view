import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdminId } from "@/lib/auth";
import { updateQuestion, deleteQuestion } from "@/lib/data/interviews";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  language: z.string().min(1).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  time_limit_minutes: z.number().int().positive().nullable().optional(),
  starter_code: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { id, questionId } = await params;
  try {
    const question = await updateQuestion(adminId, id, questionId, parsed.data);
    return NextResponse.json({ question });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, questionId } = await params;
  try {
    await deleteQuestion(adminId, id, questionId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
