import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_PROMPT =
  "你是一位資深工程師，協助評估應試者的技術能力。請用繁體中文回應，並根據應試者的作答給予適當的提示或追問。";

export async function getAiSettings(adminId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("admin_id", adminId)
    .maybeSingle();

  if (data) return data;
  return {
    admin_id: adminId,
    default_model: DEFAULT_MODEL,
    default_system_prompt: DEFAULT_PROMPT,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertAiSettings(
  adminId: string,
  input: { default_model?: string; default_system_prompt?: string | null }
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_settings")
    .upsert({
      admin_id: adminId,
      default_model: input.default_model ?? DEFAULT_MODEL,
      default_system_prompt: input.default_system_prompt ?? null,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
