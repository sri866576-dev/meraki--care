import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const addStaffSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
  fullName: z.string().min(1).max(100),
  role: z.enum(["admin", "staff"]),
  callerId: z.string().uuid(),
});

export const addStaffServerFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => addStaffSchema.parse(input))
  .handler(async ({ data }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return { ok: false as const, error: "Server not configured" };
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is admin
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return { ok: false as const, error: "Only admins can add staff" };

    // Create the user (email auto-confirmed so they can log in immediately)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, role: data.role },
    });
    if (createErr || !created.user) {
      return { ok: false as const, error: createErr?.message ?? "Failed to create user" };
    }

    // The handle_new_user trigger inserts a default role; replace it with the requested one.
    await admin.from("user_roles").delete().eq("user_id", created.user.id);
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: data.role });
    if (roleErr) return { ok: false as const, error: roleErr.message };

    return { ok: true as const, userId: created.user.id };
  });
