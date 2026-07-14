import { createAdminClient } from "@/lib/supabase/admin";

export async function listCandidates(adminId: string, search?: string) {
  const supabase = createAdminClient();
  const query = supabase
    .from("candidates")
    .select("*")
    .eq("admin_id", adminId)
    .order("created_at", { ascending: false });
  const { data: candidates, error } = await query;
  if (error) throw error;

  const candidateIds = (candidates ?? []).map((c) => c.id);
  const { data: sessions } = candidateIds.length
    ? await supabase
        .from("interview_sessions")
        .select("id, candidate_id, status, review_status, ai_score, submitted_at, link_id")
        .in("candidate_id", candidateIds)
    : { data: [] };

  const linkIds = [...new Set((sessions ?? []).map((s) => s.link_id))];
  const { data: links } = linkIds.length
    ? await supabase.from("interview_links").select("id, interview_set_id").in("id", linkIds)
    : { data: [] };
  const setIds = [...new Set((links ?? []).map((l) => l.interview_set_id))];
  const { data: sets } = setIds.length
    ? await supabase.from("interview_sets").select("id, title").in("id", setIds)
    : { data: [] };

  const setIdByLinkId = new Map((links ?? []).map((l) => [l.id, l.interview_set_id]));
  const titleBySetId = new Map((sets ?? []).map((s) => [s.id, s.title]));

  let rows = (candidates ?? []).map((c) => {
    const candidateSessions = (sessions ?? [])
      .filter((s) => s.candidate_id === c.id)
      .map((s) => ({
        ...s,
        interview_title: titleBySetId.get(setIdByLinkId.get(s.link_id) ?? "") ?? "-",
      }));
    return { ...c, sessions: candidateSessions };
  });

  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q)
    );
  }

  return rows;
}
