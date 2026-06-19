import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useLocalState } from "@/hooks/use-local-state";
import { Trash2 } from "lucide-react";

type Point = { date: string; weight: number; bf: number };

export const Route = createFileRoute("/evolucao")({
  head: () => ({ meta: [{ title: "Evolução — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <EvoPage />
    </RequireAuth>
  ),
});

function EvoPage() {
  const [pts, setPts] = useLocalState<Point[]>("vrumfit:evo", [
    { date: "01/01", weight: 88, bf: 22 },
    { date: "01/02", weight: 86, bf: 20 },
    { date: "01/03", weight: 84, bf: 18 },
    { date: "01/04", weight: 82.5, bf: 17 },
    { date: "01/05", weight: 81, bf: 16 },
  ]);
  const [w, setW] = useState("");
  const [bf, setBf] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!w || !bf) return;
    const d = new Date();
    const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    setPts([...pts, { date, weight: +w, bf: +bf }]);
    setW(""); setBf("");
  };

  const last = pts[pts.length - 1];
  const first = pts[0];
  const dW = last && first ? +(last.weight - first.weight).toFixed(1) : 0;
  const dBf = last && first ? +(last.bf - first.bf).toFixed(1) : 0;

  return (
    <AppShell title="Evolução" subtitle="Peso e % gordura ao longo do tempo">
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Δ Peso" value={`${dW > 0 ? "+" : ""}${dW} kg`} positive={dW < 0} />
          <Stat label="Δ Gordura" value={`${dBf > 0 ? "+" : ""}${dBf} pp`} positive={dBf < 0} />
        </div>
      </Card>

      <Card>
        <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-3">Gráfico de peso</h3>
        <Chart pts={pts} />
      </Card>

      <Card>
        <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-3">Novo registro</h3>
        <form onSubmit={add} className="grid grid-cols-2 gap-2">
          <input placeholder="Peso (kg)" value={w} onChange={(e) => setW(e.target.value)} className={inputCls} />
          <input placeholder="% Gordura" value={bf} onChange={(e) => setBf(e.target.value)} className={inputCls} />
          <button className={`${btnPrimary} col-span-2`}>ADICIONAR</button>
        </form>
      </Card>

      <Card>
        <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-3">Histórico</h3>
        <ul className="space-y-1.5">
          {pts.slice().reverse().map((p, i) => (
            <li key={i} className="flex items-center justify-between text-xs glass rounded-lg px-3 py-2">
              <span className="font-mono text-muted-foreground">{p.date}</span>
              <span className="font-semibold">{p.weight} kg · {p.bf}%</span>
              <button onClick={() => setPts(pts.filter((x) => x !== p))} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="glass rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-xl font-extrabold mt-1 ${positive ? "text-success" : "text-primary"}`}>{value}</p>
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
