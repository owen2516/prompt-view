import { createAdminClient } from "@/lib/supabase/admin";
import type { InterviewSession, ReviewStatus } from "@/types/db";

async function getOwnedSetIdsAndLinks(adminId: string) {
  const supabase = createAdminClient();
  const { data: sets } = await supabase
    .from("interview_sets")
    .select("id, title, target_role")
    .eq("admin_id", adminId);
  const setIds = (sets ?? []).map((s) => s.id);

  const { data: links } = setIds.length
    ? await supabase
        .from("interview_links")
        .select("id, interview_set_id, token")
        .in("interview_set_id", setIds)
    : { data: [] as { id: string; interview_set_id: string; token: string }[] };

  return { sets: sets ?? [], links: links ?? [] };
}

export interface SessionRow extends InterviewSession {
  interview_title: string;
  target_role: string | null;
  candidate_email: string | null;
}

export async function listSessions(
  adminId: string,
  filters: { search?: string; reviewStatus?: ReviewStatus; interviewSetId?: string }
) {
  const supabase = createAdminClient();
  const { sets, links } = await getOwnedSetIdsAndLinks(adminId);
  const setById = new Map(sets.map((s) => [s.id, s]));
  let relevantLinks = links;
  if (filters.interviewSetId) {
    relevantLinks = links.filter((l) => l.interview_set_id === filters.interviewSetId);
  }
  const linkIds = relevantLinks.map((l) => l.id);
  if (linkIds.length === 0) return [] as SessionRow[];

  let query = supabase.from("interview_sessions").select("*").in("link_id", linkIds);
  if (filters.reviewStatus) query = query.eq("review_status", filters.reviewStatus);
  const { data: sessions, error } = await query.order("submitted_at", {
    ascending: false,
    nullsFirst: false,
  });
  if (error) throw error;

  const linkById = new Map(relevantLinks.map((l) => [l.id, l]));
  const { data: candidateEmails } = await supabase
    .from("interview_links")
    .select("id, candidate_email")
    .in("id", linkIds);
  const emailByLinkId = new Map((candidateEmails ?? []).map((l) => [l.id, l.candidate_email]));

  let rows: SessionRow[] = (sessions ?? []).map((s) => {
    const link = linkById.get(s.link_id);
    const set = link ? setById.get(link.interview_set_id) : undefined;
    return {
      ...s,
      interview_title: set?.title ?? "-",
      target_role: set?.target_role ?? null,
      candidate_email: emailByLinkId.get(s.link_id) ?? null,
    };
  });

  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.candidate_name ?? "").toLowerCase().includes(q) ||
        (r.candidate_email ?? "").toLowerCase().includes(q)
    );
  }

  return rows;
}

export async function getDashboardStats(adminId: string) {
  const rows = await listSessions(adminId, {});
  const total = rows.length;
  const pending = rows.filter((r) => r.review_status === "pending").length;

  const durations = rows
    .filter((r) => r.started_at && r.submitted_at)
    .map((r) => (new Date(r.submitted_at!).getTime() - new Date(r.started_at!).getTime()) / 60000);
  const avgDuration = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  const avgInteractions = total
    ? Math.round(rows.reduce((a, r) => a + r.ai_interaction_count, 0) / total)
    : 0;

  const scored = rows.filter((r) => r.ai_score !== null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((a, r) => a + (r.ai_score ?? 0), 0) / scored.length)
    : 0;

  return {
    total,
    pendingReview: pending,
    avgDurationMinutes: avgDuration,
    avgAiInteractions: avgInteractions,
    avgAiScore: avgScore,
  };
}

export async function getPendingReviewCount(adminId: string) {
  const rows = await listSessions(adminId, { reviewStatus: "pending" });
  return rows.length;
}

export async function getSessionDetail(adminId: string, sessionId: string) {
  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return null;

  const { data: link } = await supabase
    .from("interview_links")
    .select("*")
    .eq("id", session.link_id)
    .maybeSingle();
  if (!link) return null;

  const { data: set } = await supabase
    .from("interview_sets")
    .select("*")
    .eq("id", link.interview_set_id)
    .eq("admin_id", adminId)
    .maybeSingle();
  if (!set) return null;

  const { data: questions } = set.question_ids.length
    ? await supabase.from("questions").select("*").in("id", set.question_ids)
    : { data: [] };
  const orderedQuestions = set.question_ids
    .map((id: string) => (questions ?? []).find((q: { id: string }) => q.id === id))
    .filter(Boolean);

  const { data: recordings } = await supabase
    .from("recordings")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return { session, link, set, questions: orderedQuestions, recordings: recordings ?? [] };
}

export async function setReviewStatus(
  adminId: string,
  sessionId: string,
  status: ReviewStatus
) {
  const detail = await getSessionDetail(adminId, sessionId);
  if (!detail) throw new Error("not_found");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interview_sessions")
    .update({ review_status: status })
    .eq("id", sessionId);
  if (error) throw error;
}
