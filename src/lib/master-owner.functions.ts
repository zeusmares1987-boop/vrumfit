import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MASTER_EMAIL = "zeusmares1987@gmail.com";

export const bootstrapMasterOwner = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (email !== MASTER_EMAIL) {
      throw new Error("Este primeiro acesso é apenas para o e-mail mestre.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existingOwner, error: ownerError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "dono")
      .maybeSingle();
    if (ownerError) throw ownerError;

    const { data: found, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    const existingUser = found.users.find((user) => user.email?.toLowerCase() === email);

    if (existingOwner && existingUser?.id !== existingOwner.user_id) {
      throw new Error("Já existe um dono cadastrado.");
    }

    let userId = existingUser?.id;
    if (!userId) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: "Dono", role: "aluno" },
      });
      if (createError) throw createError;
      userId = created.user.id;
    }

    if (!userId) throw new Error("Não foi possível criar o e-mail mestre.");

    const { error: deleteError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    if (deleteError) throw deleteError;

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "dono" });
    if (roleError) throw roleError;

    return { ok: true };
  });