import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdminId } from "@/lib/auth";
import { listCandidates } from "@/lib/data/candidates";

export async function GET(req: NextRequest) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;

  const candidates = await listCandidates(adminId, search);
  return NextResponse.json({ candidates });
}
