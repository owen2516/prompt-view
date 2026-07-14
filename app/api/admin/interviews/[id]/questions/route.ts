import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdminId } from "@/lib/auth";
import { addQuestion, reorderQuestions } from "@/lib/data/interviews";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  language: z.string().min(1).default("javascript"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  time_limit_minutes: z.number().int().positive().nullable().optional(),
  starter_code: z.string().nullable().optional(),
  is_ai_generated: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { id } = await params;
  try {
    const question = await addQuestion(adminId, id, parsed.data);
    return NextResponse.json({ question }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}

const reorderSchema = z.object({
  orderedQuestionIds: z.array(z.string()),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = reorderSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { id } = await params;
  try {
    await reorderQuestions(adminId, id, parsed.data.orderedQuestionIds);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
