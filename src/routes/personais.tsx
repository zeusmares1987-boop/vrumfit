import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppShell, Card, Field, inputCls, btnPrimary } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { createPersonalForOwner } from "@/lib/students.functions";
import { CredentialsModal, type CredentialsInfo } from "@/components/Credentials";
import { toast } from "sonner";
import { UserCog, Search, Mail, Users as UsersIcon, UserPlus } from "lucide-react";

type P = { id: string; full_name: string | null; email: string | null; phone: string | null };

export const Route = createFileRoute("/personais")({
  head: () => ({ meta: [{ title: "Personais — VRUMFIT" }] }),
  component: () => (
    <RequireAuth allow={["dono"]}>
      <Personais />
    </RequireAuth>
  ),
});

function Personais() {
  const createPersonal = useServerFn(createPersonalForOwner);
  const [list, setList] = useState<P[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creds, setCreds] = useState<CredentialsInfo | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });

  const load = async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "personal");
      if (error) { toast.error(error.message); setLoading(false); return; }
      const ids = (roles ?? []).map((r) => r.user_id);
      if (!ids.length) { setLoading(false); return; }

      const [{ data: profs }, { data: studs }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,email,phone").in("id", ids),
        supabase.from("students").select("personal_id").in("personal_id", ids),
      ]);
      setList((profs ?? []) as P[]);
      const c: Record<string, number> = {};
      (studs ?? []).forEach((s) => { if (s.personal_id) c[s.personal_id] = (c[s.personal_id] ?? 0) + 1; });
      setCounts(c);
      setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await createPersonal({ data: form });
      toast.success("Personal cadastrado.");
      setCreds({ name: form.fullName, email: result.email, password: result.password });
      setForm({ fullName: "", email: "", password: "", phone: "" });
      setShowCreate(false);
      load();
    } catch (error: any) {
      toast.error(error.message ?? "Falha ao cadastrar personal.");
    } finally {
      setCreating(false);
    }
  };

  const totalAlunos = Object.values(counts).reduce((a, b) => a + b, 0);
  const filtered = list.filter((p) =>
    (p.full_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (p.email ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppShell title="Personais">
      <PageHero
        eyebrow="Equipe"
        title="Personais"
        subtitle={loading ? "Carregando…" : `${list.length} profissionais ativos`}
        icon={UserCog}
        stats={[
          { label: "Personais", value: list.length },
          { label: "Alunos", value: totalAlunos },
          { label: "Média/PT", value: list.length ? (totalAlunos / list.length).toFixed(1) : "0" },
        ]}
      />

      <div className="flex items-center justify-between gap-2 rounded-2xl border border-primary/25 bg-primary/5 p-3">
        <UserPlus className="size-4 text-primary shrink-0" />
        <p className="text-[11px] text-muted-foreground">Dono cadastra o personal e define a senha inicial.</p>
        <button onClick={() => setShowCreate((s) => !s)} className="shrink-0 rounded-xl bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground">
          {showCreate ? "FECHAR" : "NOVO"}
        </button>
      </div>

      {showCreate && (
        <Card className="p-4">
          <form onSubmit={addPersonal} className="space-y-3">
            <Field label="Nome"><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} required /></Field>
            <Field label="E-mail"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} required /></Field>
            <Field label="Senha inicial"><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} minLength={6} required /></Field>
            <Field label="Telefone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>
            <button disabled={creating} className={btnPrimary}>{creating ? "CADASTRANDO…" : "CADASTRAR PERSONAL"}</button>
          </form>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar personal…"
          className="w-full glass rounded-2xl pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <ul className="space-y-2">
        {filtered.map((p) => {
          const name = p.full_name ?? "Sem nome";
          const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
          const n = counts[p.id] ?? 0;
          return (
            <li key={p.id} className="glass rounded-2xl p-3 flex items-center gap-3 hover:border-primary/40 transition">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 grid place-items-center text-primary font-black text-sm shrink-0">
                {initials || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{name}</p>
                {p.email && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="size-2.5 shrink-0" />{p.email}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-extrabold text-primary leading-none">{n}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1 flex items-center gap-1">
                  <UsersIcon className="size-2.5" /> alunos
                </p>
              </div>
            </li>
          );
        })}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={UserCog}
            title={q ? "Nenhum personal encontrado" : "Sem personais ainda"}
            hint={q ? "Ajuste a busca." : "Personais entram pelo cadastro como 'Personal'."}
          />
        )}
      </ul>
    </AppShell>
  );
}
