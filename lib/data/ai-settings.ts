import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_MODEL = "gemini-flash-latest";
const DEFAULT_PROMPT =
  "你是一位友善的技術面試助手，幫助應試者解決程式題。你的角色是：\n1. 幫助應試者理解題目\n2. 提供有建設性的提示\n3. 根據應試者要求，可以直接提供完整解答\n4. 討論不同的解題方法\n5. 鼓勵應試者思考和學習\n\n請用繁體中文回應。";

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
