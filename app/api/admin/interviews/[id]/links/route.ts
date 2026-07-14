import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdminId } from "@/lib/auth";
import { getLinkTabData, regenerateLink } from "@/lib/data/interviews";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await getLinkTabData(adminId, id);
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(data);
}

const regenerateSchema = z.object({
  expiresInDays: z.union([z.literal(7), z.literal(14), z.literal(30), z.literal(60)]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = regenerateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { id } = await params;
  try {
    const link = await regenerateLink(adminId, id, parsed.data.expiresInDays);
    return NextResponse.json({ link });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
