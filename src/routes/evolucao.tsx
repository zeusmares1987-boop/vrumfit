import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { EmptyState, PageHero } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, Trash2, TrendingUp, TrendingDown, LineChart } from "lucide-react";

type Point = { id: string; date: string; weight: number };

export const Route = createFileRoute("/evolucao")({
  head: () => ({ meta: [{ title: "Evolução — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <EvoPage />
    </RequireAuth>
  ),
});

function EvoPage() {
  const { user, role } = useAuth();
  const [pts, setPts] = useState<Point[]>([]);
  const [w, setW] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const query = supabase
      .from("progress_entries")
      .select("id,date,weight_kg")
      .order("date", { ascending: true });
    const { data, error } = role === "aluno" ? await query.eq("student_id", user.id) : await query;
    if (error) {
      toast.error(error.message);
      setPts([]);
    } else {
      setPts(
        (data ?? [])
          .filter((point) => point.weight_kg !== null)
          .map((point) => ({
            id: point.id,
            date: point.date,
            weight: Number(point.weight_kg),
          })),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id, role]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !w) return;
    setSaving(true);
    const d = new Date();
    const date = d.toISOString().slice(0, 10);
    const { error } = await supabase
      .from("progress_entries")
      .insert({ student_id: user.id, date, weight_kg: Number(w), attended: true });
    if (error) toast.error(error.message);
    else {
      toast.success("Registro salvo.");
      setW("");
      await load();
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("progress_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPts((current) => current.filter((point) => point.id !== id));
  };

  const last = pts[pts.length - 1];
  const first = pts[0];
  const dW = last && first ? +(last.weight - first.weight).toFixed(1) : 0;
  const canWrite = role === "aluno";

  return (
    <AppShell title="Evolução">
      <PageHero
        eyebrow="Progresso"
        title="Evolução"
        subtitle="Acompanhe peso e composição corporal"
        icon={LineChart}
        stats={[
          { label: "Registros", value: pts.length },
          { label: "Atual", value: last ? `${last.weight}kg` : "—" },
          { label: "Último", value: last ? new Date(last.date).toLocaleDateString("pt-BR") : "—" },
        ]}
      />

      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Δ Peso" value={`${dW > 0 ? "+" : ""}${dW} kg`} positive={dW < 0} />
        <Stat label="Registros" value={String(pts.length)} positive={pts.length > 0} />
      </div>

      <Card>
        <h3 className="text-[10px] uppercase tracking-[0.28em] text-primary font-bold mb-3">Gráfico de peso</h3>
        {pts.length === 0 ? <EmptyState icon={LineChart} title="Sem evolução registrada" hint="Nenhum dado real foi encontrado." /> : <Chart pts={pts} />}
      </Card>

      {canWrite && (
        <Card>
          <h3 className="text-[10px] uppercase tracking-[0.28em] text-primary font-bold mb-3">Novo registro</h3>
          <form onSubmit={add} className="space-y-2">
            <input placeholder="Peso (kg)" value={w} onChange={(e) => setW(e.target.value)} className={inputCls} />
            <button disabled={saving} className={btnPrimary}>{saving ? "SALVANDO…" : "ADICIONAR"}</button>
          </form>
        </Card>
      )}

      {pts.length > 0 && <Card>
        <h3 className="text-[10px] uppercase tracking-[0.28em] text-primary font-bold mb-3">Histórico</h3>
        <ul className="space-y-1.5">
          {pts.slice().reverse().map((p) => (
            <li key={p.id} className="flex items-center justify-between text-xs glass rounded-xl px-3 py-2.5">
              <span className="font-mono text-muted-foreground">{new Date(p.date).toLocaleDateString("pt-BR")}</span>
              <span className="font-bold">{p.weight} kg</span>
              {canWrite && (
                <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>}
    </AppShell>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  const Icon = positive ? TrendingDown : TrendingUp;
  return (
    <div className={`rounded-2xl border p-3 ${positive ? "border-success/30 bg-success/5" : "border-primary/30 bg-primary/5"}`}>
      <Icon className={`size-4 ${positive ? "text-success" : "text-primary"}`} />
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">{label}</p>
      <p className={`text-2xl font-extrabold mt-0.5 ${positive ? "text-success" : "text-primary"}`}>{value}</p>
    </div>
  );
}

function Chart({ pts }: { pts: Point[] }) {
  if (pts.length < 2) return <p className="text-xs text-muted-foreground">Adicione ao menos 2 registros.</p>;
  const W = 320, H = 140, P = 16;
  const ws = pts.map((p) => p.weight);
  const min = Math.min(...ws) - 1, max = Math.max(...ws) + 1;
  const x = (i: number) => P + (i * (W - 2 * P)) / (pts.length - 1);
  const y = (v: number) => H - P - ((v - min) / (max - min)) * (H - 2 * P);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.weight)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L${x(pts.length - 1)},${H - P} L${x(0)},${H - P} Z`} fill="url(#g)" />
      <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2" />
      {pts.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.weight)} r="3" fill="var(--brand)" />
      ))}
    </svg>
  );
}
