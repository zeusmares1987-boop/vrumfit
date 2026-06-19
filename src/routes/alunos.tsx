import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Row = {
  user_id: string;
  objective: string | null;
  status: string;
  personal_id: string | null;
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
};

export const Route = createFileRoute("/alunos")({
  head: () => ({ meta: [{ title: "Alunos — VRUMFIT" }] }),
  component: AlunosPage,
});

function AlunosPage() {
  const { role, user } = useAuth();
  const [list, setList] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("students")
      .select("user_id, objective, status, personal_id, profiles!students_user_id_fkey(full_name,email,phone)")
      .order("created_at", { ascending: false });
    if (role === "personal" && user) query = query.eq("personal_id", user.id);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setList((data as unknown as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [role, user?.id]);

  const remove = async (id: string) => {
    if (!confirm("Remover aluno?")) return;
    const { error } = await supabase.from("students").delete().eq("user_id", id);
    if (error) return toast.error(error.message);
    setList(list.filter((x) => x.user_id !== id));
  };

  const filtered = list.filter((p) =>
    (p.profiles?.full_name ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppShell title="Alunos" subtitle={loading ? "Carregando…" : `${list.length} no total`}>
      <Card className="p-3">
        <p className="text-[11px] text-white/60">
          Novos alunos entram via <Link to="/auth" className="text-primary">tela de cadastro</Link> escolhendo o papel "Aluno".
        </p>
      </Card>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar aluno…"
          className="w-full glass rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <ul className="space-y-2">
        {filtered.map((p) => (
          <li key={p.user_id} className="glass rounded-2xl p-3 flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/15 border border-primary/30 grid place-items-center text-primary font-bold">
              {(p.profiles?.full_name ?? "?")[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{p.profiles?.full_name ?? "Sem nome"}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {p.profiles?.email} · {p.objective ?? "—"}
              </p>
            </div>
            <span className={`size-2 rounded-full ${p.status === "ativo" ? "bg-success" : "bg-muted-foreground"}`} />
            {role === "dono" && (
              <button onClick={() => remove(p.user_id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            )}
          </li>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-xs text-white/50 py-6">Nenhum aluno encontrado.</p>
        )}
      </ul>
    </AppShell>
  );
}
