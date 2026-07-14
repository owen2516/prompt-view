// Creates the first (or another) admin account: a Supabase Auth user + a row in `admins`.
// Usage:
//   node scripts/create-admin.mjs --email you@example.com --password "secret123" --name "陳怡君"
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";
import { createClient } from "@supabase/supabase-js";

// supabase-js always spins up a Realtime client, which needs a global WebSocket.
// Node 20 doesn't expose one outside the Next.js runtime, so polyfill it here.
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocket;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1];
      args[key] = value;
      i++;
    }
  }
  return args;
}

async function main() {
  loadEnvLocal();

  const { email, password, name } = parseArgs(process.argv.slice(2));
  if (!email || !password) {
    console.error(
      'Usage: node scripts/create-admin.mjs --email you@example.com --password "secret123" --name "陳怡君"'
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError) {
    console.error("Failed to create auth user:", createError.message);
    process.exit(1);
  }

  const userId = created.user.id;

  const { error: insertError } = await supabase.from("admins").upsert({
    id: userId,
    name: name || email,
    email,
    role: "manager",
  });

  if (insertError) {
    console.error("Auth user created but failed to insert into admins:", insertError.message);
    process.exit(1);
  }

  console.log(`Admin created: ${email} (id: ${userId})`);
}

main();
