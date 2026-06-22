import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const objectiveSchema = z.enum(["hipertrofia", "emagrecimento", "forca", "condicionamento", "saude", "manutencao"]);

export const createStudentForPersonal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      fullName: z.string().trim().min(2),
      email: z.string().trim().email(),
      password: z.string().min(6),
      phone: z.string().trim().optional(),
      objective: objectiveSchema.optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const callerId = context.userId;

    const { data: roles, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    if (roleError) throw roleError;
    const isPersonal = roles?.some((role) => role.role === "personal");
    const isOwner = roles?.some((role) => role.role === "dono");
    if (!isPersonal && !isOwner) throw new Error("Apenas personal ou dono pode cadastrar aluno.");

    if (isPersonal) {
      const { data: allowed, error: limitError } = await context.supabase.rpc("can_add_student", { _personal_id: callerId });
      if (limitError) throw limitError;
      if (!allowed) throw new Error("Limite de alunos do plano atingido ou plano vencido.");
    }

    const email = data.email.toLowerCase();
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        phone: data.phone ?? "",
        role: "aluno",
      },
    });
    if (createError) throw createError;
    const studentId = created.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: studentId,
      full_name: data.fullName,
      email,
      phone: data.phone || null,
    });
    if (profileError) throw profileError;

    const { error: roleWriteError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: studentId, role: "aluno" }, { onConflict: "user_id,role" });
    if (roleWriteError) throw roleWriteError;

    const { error: studentError } = await supabaseAdmin.from("students").upsert({
      user_id: studentId,
      personal_id: callerId,
      objective: data.objective ?? null,
      status: "ativo",
    });
    if (studentError) throw studentError;

    return { id: studentId, email };
  });

export const createPersonalForOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({
      fullName: z.string().trim().min(2),
      email: z.string().trim().email(),
      password: z.string().min(6),
      phone: z.string().trim().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: owner, error: ownerError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "dono",
    });
    if (ownerError) throw ownerError;
    if (!owner) throw new Error("Apenas o dono pode cadastrar personal.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        phone: data.phone ?? "",
        role: "personal",
      },
    });
    if (createError) throw createError;
    const personalId = created.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: personalId,
      full_name: data.fullName,
      email,
      phone: data.phone || null,
    });
    if (profileError) throw profileError;

    const { error: cleanupError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", personalId).eq("role", "aluno");
    if (cleanupError) throw cleanupError;

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: personalId, role: "personal" }, { onConflict: "user_id,role" });
    if (roleError) throw roleError;

    return { id: personalId, email };
  });