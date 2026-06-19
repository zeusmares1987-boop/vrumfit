import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Field, inputCls, btnPrimary } from "@/components/AppShell";
import { Download, BookOpen, FileDown } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { WorkoutPDF, type WorkoutPDFData } from "@/components/pdfs/VrumPDFs";

type Split = "fullbody" | "ab" | "abc" | "abcd" | "abcde";
type Goal = "hipertrofia" | "forca" | "resistencia";

export const Route = createFileRoute("/treinos")({
  head: () => ({ meta: [{ title: "Gerador de Treinos — VRUMFIT" }] }),
  component: TreinosPage,
});

function TreinosPage() {
  const [days, setDays] = useState(4);
  const [split, setSplit] = useState<Split>("abcd");
  const [goal, setGoal] = useState<Goal>("hipertrofia");
  const [level, setLevel] = useState<"iniciante" | "intermediario" | "avancado">("intermediario");
  const [plan, setPlan] = useState<{ name: string; exercises: { name: string; sets: number; reps: string; rest: string }[] }[] | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPlan(generate(split, goal, level));
  };

  return (
    <AppShell title="Gerador de Treinos" subtitle="Periodização inteligente">
      <Link to="/biblioteca" className="mb-3 flex items-center gap-2 h-11 px-4 rounded-2xl border border-primary/40 bg-primary/10 text-primary text-[13px] font-semibold hover:bg-primary/15 transition">
        <BookOpen className="size-4" /> Abrir biblioteca VrumFit
      </Link>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Frequência semanal">
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <button key={n} type="button" onClick={() => setDays(n)}
                  className={`py-2 rounded-xl text-sm font-bold ${days === n ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {n}x
                </button>
              ))}
            </div>
          </Field>
          <Field label="Divisão">
            <select value={split} onChange={(e) => setSplit(e.target.value as Split)} className={inputCls}>
              <option value="fullbody">Full Body</option>
              <option value="ab">A/B (peito-costas / pernas-ombro)</option>
              <option value="abc">A/B/C (push / pull / legs)</option>
              <option value="abcd">A/B/C/D (peito / costas / perna / ombro+braço)</option>
              <option value="abcde">A/B/C/D/E (peito / costas / perna / ombro / braço)</option>
            </select>
          </Field>
          <Field label="Objetivo">
            <div className="grid grid-cols-3 gap-2">
              {(["hipertrofia", "forca", "resistencia"] as Goal[]).map((g) => (
                <button key={g} type="button" onClick={() => setGoal(g)}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize ${goal === g ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {g}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Nível">
            <div className="grid grid-cols-3 gap-2">
              {(["iniciante", "intermediario", "avancado"] as const).map((l) => (
                <button key={l} type="button" onClick={() => setLevel(l)}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize ${level === l ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <button type="submit" className={btnPrimary}>GERAR PLANILHA</button>
        </form>
      </Card>

      {plan && (
        <Card>
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Plano {plan.length} dias · {goal}
            </h3>
            <div className="flex gap-2">
              <button onClick={() => exportTxt(plan)} className="glass rounded-lg px-2.5 py-1.5 text-[10px] flex items-center gap-1">
                <Download className="size-3" /> TXT
              </button>
              <button onClick={() => exportPdf(plan, goal)} className="bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5 text-[10px] font-bold flex items-center gap-1">
                <FileDown className="size-3" /> PDF VrumFit
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {plan.map((d, i) => (
              <div key={i}>
                <p className="text-sm font-bold text-primary">Treino {String.fromCharCode(65 + i)} — {d.name}</p>
                <ul className="mt-2 space-y-1.5">
                  {d.exercises.map((ex, j) => (
                    <li key={j} className="flex items-center justify-between text-xs glass rounded-lg px-3 py-2">
                      <span className="font-semibold">{ex.name}</span>
                      <span className="font-mono text-muted-foreground">{ex.sets}×{ex.reps} · {ex.rest}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}

const POOLS: Record<string, string[]> = {
  peito: ["Supino reto barra", "Supino inclinado halter", "Crucifixo polia", "Crossover", "Flexão"],
  costas: ["Barra fixa", "Remada curvada", "Puxada frente", "Remada baixa", "Pull-down"],
  perna: ["Agachamento livre", "Leg press 45°", "Cadeira extensora", "Mesa flexora", "Stiff", "Panturrilha em pé"],
  ombro: ["Desenvolvimento halter", "Elevação lateral", "Elevação frontal", "Face pull"],
  biceps: ["Rosca direta", "Rosca alternada", "Rosca scott"],
  triceps: ["Tríceps corda", "Tríceps testa", "Mergulho banco"],
  gluteo: ["Hip thrust", "Búlgaro", "Cadeira abdutora"],
  core: ["Prancha", "Abdominal infra", "Russian twist"],
};

function pick(group: string, n: number) {
  return POOLS[group].slice(0, n);
}

function ex(names: string[], sets: number, reps: string, rest: string) {
  return names.map((n) => ({ name: n, sets, reps, rest }));
}

function generate(split: Split, goal: Goal, level: "iniciante" | "intermediario" | "avancado") {
  const reps = goal === "forca" ? "4-6" : goal === "resistencia" ? "15-20" : "8-12";
  const rest = goal === "forca" ? "2-3min" : goal === "resistencia" ? "30-45s" : "60-90s";
  const sets = level === "iniciante" ? 3 : level === "avancado" ? 5 : 4;
  const e = (g: string, n: number) => ex(pick(g, n), sets, reps, rest);

  const map: Record<Split, { name: string; exercises: ReturnType<typeof e> }[]> = {
    fullbody: [
      { name: "Full Body", exercises: [...e("perna", 2), ...e("peito", 2), ...e("costas", 2), ...e("ombro", 1)] },
    ],
    ab: [
      { name: "Peito + Costas + Bíceps", exercises: [...e("peito", 3), ...e("costas", 3), ...e("biceps", 2)] },
      { name: "Perna + Ombro + Tríceps", exercises: [...e("perna", 4), ...e("ombro", 2), ...e("triceps", 2)] },
    ],
    abc: [
      { name: "Push (peito/ombro/tríceps)", exercises: [...e("peito", 3), ...e("ombro", 2), ...e("triceps", 2)] },
      { name: "Pull (costas/bíceps)", exercises: [...e("costas", 4), ...e("biceps", 3)] },
      { name: "Legs", exercises: [...e("perna", 5), ...e("gluteo", 1)] },
    ],
    abcd: [
      { name: "Peito + Tríceps", exercises: [...e("peito", 4), ...e("triceps", 3)] },
      { name: "Costas + Bíceps", exercises: [...e("costas", 4), ...e("biceps", 3)] },
      { name: "Perna completa", exercises: [...e("perna", 5), ...e("gluteo", 1)] },
      { name: "Ombro + Core", exercises: [...e("ombro", 4), ...e("core", 2)] },
    ],
    abcde: [
      { name: "Peito", exercises: [...e("peito", 5)] },
      { name: "Costas", exercises: [...e("costas", 5)] },
      { name: "Perna", exercises: [...e("perna", 6)] },
      { name: "Ombro", exercises: [...e("ombro", 4)] },
      { name: "Braço (Bi+Tri)", exercises: [...e("biceps", 3), ...e("triceps", 3)] },
    ],
  };
  return map[split];
}

function exportTxt(plan: { name: string; exercises: { name: string; sets: number; reps: string; rest: string }[] }[]) {
  const txt = plan.map((d, i) =>
    `Treino ${String.fromCharCode(65 + i)} — ${d.name}\n` +
    d.exercises.map((e) => `  ${e.name}  ${e.sets}x${e.reps}  ${e.rest}`).join("\n")
  ).join("\n\n");
  const blob = new Blob([`VRUMFIT — Plano de Treino\n\n${txt}`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "treino-vrumfit.txt"; a.click();
  URL.revokeObjectURL(url);
}

async function exportPdf(
  plan: { name: string; exercises: { name: string; sets: number; reps: string; rest: string }[] }[],
  goal: string,
) {
  for (let i = 0; i < plan.length; i++) {
    const d = plan[i];
    const data: WorkoutPDFData = {
      studentName: "Aluno VrumFit",
      dayLabel: `DIA ${i + 1}`,
      tip: `Objetivo: ${goal}. Mantenha alimentação balanceada, hidratação adequada e sono regulado.`,
      exercises: d.exercises.map((ex) => ({
        name: ex.name,
        sets: String(ex.sets),
        reps: ex.reps,
        rest: ex.rest,
        tips: [
          "Mantenha controle total na fase excêntrica (descida).",
          "Contraia o músculo alvo no topo do movimento.",
          "Respire de forma controlada: solte na fase de esforço.",
        ],
      })),
    };
    const blob = await pdf(<WorkoutPDF data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `treino-${d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
