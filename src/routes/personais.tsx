import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type P = { id: string; full_name: string | null; email: string | null; phone: string | null };

export const Route = createFileRoute("/personais")({
  head: () => ({ meta: [{ title: "Personais — VRUMFIT" }] }),
  component: Personais,
});

function Personais() {
  const [list, setList] = useState<P[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  return (
    <AppShell title="Personais" subtitle={loading ? "Carregando…" : `${list.length} no time`}>
      <Card className="p-3">
        <p className="text-[11px] text-white/60">Novos personais entram via cadastro escolhendo o papel "Personal".</p>
      </Card>
      <ul className="space-y-2">
        {list.map((p) => (
          <li key={p.id} className="glass rounded-2xl p-3 flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/15 border border-primary/30 grid place-items-center text-primary font-bold">
              {(p.full_name ?? "?")[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{p.full_name ?? "Sem nome"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{p.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{counts[p.id] ?? 0}</p>
              <p className="text-[9px] uppercase text-muted-foreground">alunos</p>
            </div>
          </li>
        ))}
        {!loading && list.length === 0 && (
          <p className="text-center text-xs text-white/50 py-6">Nenhum personal cadastrado ainda.</p>
        )}
      </ul>
    </AppShell>
  );
}
