import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppShell, Card, Field, inputCls, btnPrimary } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { createStudentForPersonal } from "@/lib/students.functions";
import { CredentialsModal, type CredentialsInfo } from "@/components/Credentials";
import { Search, Trash2, Users, UserPlus, Mail, Phone, ChevronRight, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Row = {
  user_id: string;
  objective: string | null;
  status: string;
  personal_id: string | null;
  profiles: { full_name: string | null; email: string | null; phone: string | null; avatar_url: string | null } | null;
};
type StudentObjective = "hipertrofia" | "emagrecimento" | "forca" | "condicionamento" | "saude" | "manutencao";

export const Route = createFileRoute("/alunos")({
  head: () => ({ meta: [{ title: "Alunos — VRUMFIT" }] }),
  component: () => (
    <RequireAuth allow={["personal", "dono"]}>
      <AlunosPage />
    </RequireAuth>
  ),
});

function AlunosPage() {
  const { role, user } = useAuth();
  const createStudent = useServerFn(createStudentForPersonal);
  const [list, setList] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | "ativo" | "pausado">("todos");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creds, setCreds] = useState<CredentialsInfo | null>(null);
  const [form, setForm] = useState<{ fullName: string; email: string; password: string; phone: string; objective: StudentObjective }>({ fullName: "", email: "", password: "", phone: "", objective: "manutencao" });

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("students")
      .select("user_id, objective, status, personal_id")
      .order("created_at", { ascending: false });
    if (role === "personal" && user) query = query.eq("personal_id", user.id);
    try {
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as Omit<Row, "profiles">[];
      const ids = rows.map((r) => r.user_id);
      const { data: profiles, error: profileError } = ids.length
        ? await supabase.from("profiles").select("id,full_name,email,phone,avatar_url").in("id", ids)
        : { data: [], error: null };
      if (profileError) throw profileError;
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      setList(rows.map((r) => ({ ...r, profiles: byId.get(r.user_id) ?? null })) as Row[]);
    } catch (error: any) {
      toast.error(error.message ?? "Falha ao carregar alunos.");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [role, user?.id]);

  const remove = async (id: string) => {
    if (!confirm("Remover aluno?")) return;
    const { error } = await supabase.from("students").delete().eq("user_id", id);
    if (error) return toast.error(error.message);
    setList(list.filter((x) => x.user_id !== id));
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await createStudent({ data: form });
      toast.success("Aluno cadastrado.");
      setCreds({ name: form.fullName, email: result.email, password: result.password });
      setForm({ fullName: "", email: "", password: "", phone: "", objective: "manutencao" });
      setShowCreate(false);
      load();
    } catch (error: any) {
      toast.error(error.message ?? "Falha ao cadastrar aluno.");
    } finally {
      setCreating(false);
    }
  };

  const active = list.filter((x) => x.status === "ativo").length;
  const paused = list.length - active;

  const filtered = list.filter((p) => {
    const matchQ = (p.profiles?.full_name ?? "").toLowerCase().includes(q.toLowerCase())
      || (p.profiles?.email ?? "").toLowerCase().includes(q.toLowerCase());
    const matchF = filter === "todos" || p.status === filter;
    return matchQ && matchF;
  });

  return (
    <AppShell title="Alunos" hideBottomNav={false}>
      {creds && <CredentialsModal info={creds} onClose={() => setCreds(null)} />}
      <PageHero
        eyebrow="Sua carteira"
        title="Alunos"
        subtitle={loading ? "Carregando…" : `${list.length} cadastrados · ${active} ativos`}
        icon={Users}
        stats={[
          { label: "Total", value: list.length },
          { label: "Ativos", value: active },
          { label: "Pausados", value: paused },
        ]}
      />

      <div className="flex items-center justify-between gap-2 rounded-2xl border border-primary/25 bg-primary/5 p-3">
        <UserPlus className="size-4 text-primary shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          Cadastre por e-mail. Se deixar a senha em branco, o sistema gera uma e mostra pra você copiar.
        </p>
        <button onClick={() => setShowCreate((s) => !s)} className="shrink-0 rounded-xl bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground">
          {showCreate ? "FECHAR" : "NOVO"}
        </button>
      </div>

      {showCreate && (
        <Card className="p-4">
          <form onSubmit={addStudent} className="space-y-3">
            <Field label="Nome"><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} required /></Field>
            <Field label="E-mail"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} required /></Field>
            <Field label="Senha inicial (opcional — gerada se vazia)"><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} minLength={6} placeholder="deixe vazio para gerar" /></Field>
            <Field label="Telefone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>
            <Field label="Objetivo">
              <select value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value as StudentObjective })} className={inputCls}>
                <option value="manutencao">Manutenção</option>
                <option value="hipertrofia">Hipertrofia</option>
                <option value="emagrecimento">Emagrecimento</option>
                <option value="forca">Força</option>
                <option value="condicionamento">Condicionamento</option>
                <option value="saude">Saúde</option>
              </select>
            </Field>
            <button disabled={creating} className={btnPrimary}>{creating ? "CADASTRANDO…" : "CADASTRAR ALUNO"}</button>
          </form>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou e-mail…"
          className="w-full glass rounded-2xl pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(["todos", "ativo", "pausado"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.map((p) => {
          const name = p.profiles?.full_name ?? "Sem nome";
          const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
          const avatar = p.profiles?.avatar_url;
          return (
            <li key={p.user_id}>
              <Link to="/alunos/$id" params={{ id: p.user_id }} className="glass rounded-2xl p-3 flex items-center gap-3 hover:border-primary/40 transition block">
                <div className="size-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 grid place-items-center text-primary font-black text-sm shrink-0 overflow-hidden">
                  {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : (initials || "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">{name}</p>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      p.status === "ativo" ? "bg-success/20 text-success" : "bg-muted/30 text-muted-foreground"
                    }`}>{p.status}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-[10px] text-muted-foreground">
                    {p.profiles?.email && <span className="flex items-center gap-1 truncate"><Mail className="size-2.5" />{p.profiles.email}</span>}
                    {p.profiles?.phone && <span className="flex items-center gap-1"><Phone className="size-2.5" />{p.profiles.phone}</span>}
                  </div>
                  {p.objective && (
                    <p className="text-[10px] text-primary/80 font-semibold mt-0.5">→ {p.objective}</p>
                  )}
                </div>
                {p.profiles?.phone && (
                  <a
                    href={`https://wa.me/${p.profiles.phone.replace(/\D/g, "")}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(`https://wa.me/${p.profiles!.phone!.replace(/\D/g, "")}`, "_blank"); }}
                    className="shrink-0 size-9 rounded-xl bg-success/15 border border-success/40 grid place-items-center text-success"
                    aria-label={`WhatsApp de ${name}`}
                  >
                    <MessageCircle className="size-4" />
                  </a>
                )}
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                {role === "dono" && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(p.user_id); }} className="text-muted-foreground hover:text-destructive shrink-0 p-1.5">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </Link>
            </li>
          );
        })}
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={Users}
            title={q || filter !== "todos" ? "Nenhum aluno encontrado" : "Sem alunos ainda"}
            hint={q ? "Ajuste a busca ou os filtros." : "Toque em NOVO para cadastrar o primeiro."}
          />
        )}
      </ul>
    </AppShell>
  );
}
