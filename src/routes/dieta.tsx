import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Field, inputCls, btnPrimary } from "@/components/AppShell";
import { Flame, Beef, Wheat, Droplet, Download, FileDown } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { DietPDF, type DietPDFData } from "@/components/pdfs/VrumPDFs";

export const Route = createFileRoute("/dieta")({
  head: () => ({ meta: [{ title: "Gerador de Dieta — VRUMFIT" }] }),
  component: DietaPage,
});

type Goal = "cutting" | "manutencao" | "bulking";

function DietaPage() {
  const [sex, setSex] = useState<"M" | "F">("M");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(80);
  const [height, setHeight] = useState(175);
  const [activity, setActivity] = useState(1.55);
  const [goal, setGoal] = useState<Goal>("manutencao");
  const [plan, setPlan] = useState<ReturnType<typeof generate> | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPlan(generate({ sex, age, weight, height, activity, goal }));
  };

  return (
    <AppShell title="Gerador de Dieta" subtitle="Cálculo metabólico + cardápio">
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sexo">
              <div className="flex gap-2">
                {(["M", "F"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setSex(s)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold ${sex === s ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                    {s === "M" ? "Masc." : "Fem."}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Idade">
              <input type="number" value={age} onChange={(e) => setAge(+e.target.value)} className={inputCls} />
            </Field>
            <Field label="Peso (kg)">
              <input type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} className={inputCls} />
            </Field>
            <Field label="Altura (cm)">
              <input type="number" value={height} onChange={(e) => setHeight(+e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Nível de atividade">
            <select value={activity} onChange={(e) => setActivity(+e.target.value)} className={inputCls}>
              <option value={1.2}>Sedentário</option>
              <option value={1.375}>Leve (1-3x/sem)</option>
              <option value={1.55}>Moderado (3-5x/sem)</option>
              <option value={1.725}>Intenso (6-7x/sem)</option>
              <option value={1.9}>Atleta</option>
            </select>
          </Field>
          <Field label="Objetivo">
            <div className="grid grid-cols-3 gap-2">
              {(["cutting", "manutencao", "bulking"] as Goal[]).map((g) => (
                <button key={g} type="button" onClick={() => setGoal(g)}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize ${goal === g ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {g === "cutting" ? "Cutting" : g === "bulking" ? "Bulking" : "Manter"}
                </button>
              ))}
            </div>
          </Field>
          <button type="submit" className={btnPrimary}>GERAR DIETA</button>
        </form>
      </Card>

      {plan && (
        <>
          <Card>
            <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Resumo metabólico</h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Stat icon={Flame} label="Calorias / dia" value={`${plan.calories} kcal`} />
              <Stat icon={Beef} label="Proteína" value={`${plan.protein} g`} />
              <Stat icon={Wheat} label="Carboidrato" value={`${plan.carbs} g`} />
              <Stat icon={Droplet} label="Gordura" value={`${plan.fat} g`} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              TMB Mifflin-St Jeor: <span className="font-mono text-foreground">{plan.bmr} kcal</span> · GET: <span className="font-mono text-foreground">{plan.tdee} kcal</span>
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Cardápio sugerido (6 refeições)</h3>
              <div className="flex gap-2">
                <button onClick={() => exportTxt(plan)} className="glass rounded-lg px-2.5 py-1.5 text-[10px] flex items-center gap-1">
                  <Download className="size-3" /> TXT
                </button>
                <button onClick={() => exportPdf(plan, goal)} className="bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5 text-[10px] font-bold flex items-center gap-1">
                  <FileDown className="size-3" /> PDF VrumFit
                </button>
              </div>
            </div>
            <ol className="space-y-3">
              {plan.meals.map((m, i) => (
                <li key={i} className="border-l-2 border-primary/40 pl-3">
                  <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">{m.time} · {m.kcal} kcal</p>
                  <p className="text-sm font-semibold mt-0.5">{m.name}</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {m.items.map((it, j) => <li key={j}>• {it}</li>)}
                  </ul>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <Icon className="size-4 text-primary" />
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">{label}</p>
      <p className="text-base font-bold mt-0.5">{value}</p>
    </div>
  );
}

function generate({ sex, age, weight, height, activity, goal }: {
  sex: "M" | "F"; age: number; weight: number; height: number; activity: number; goal: Goal;
}) {
  const bmr = Math.round(sex === "M"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161);
  const tdee = Math.round(bmr * activity);
  const calories = goal === "cutting" ? Math.round(tdee * 0.8) : goal === "bulking" ? Math.round(tdee * 1.15) : tdee;
  const protein = Math.round(weight * (goal === "cutting" ? 2.2 : 2));
  const fat = Math.round(weight * 0.9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const split = [0.22, 0.13, 0.27, 0.13, 0.20, 0.05].map((p) => Math.round(calories * p));
  const meals = [
    { time: "07:00", name: "Café da manhã", kcal: split[0], items: ["3 ovos mexidos", "2 fatias pão integral", "1 banana", "café preto"] },
    { time: "10:00", name: "Lanche da manhã", kcal: split[1], items: ["Iogurte natural 170g", "1 scoop whey", "30g aveia"] },
    { time: "13:00", name: "Almoço", kcal: split[2], items: ["180g frango grelhado", "150g arroz", "100g feijão", "salada verde + azeite"] },
    { time: "16:00", name: "Pré-treino", kcal: split[3], items: ["1 batata doce 200g", "100g frango ou atum"] },
    { time: "20:00", name: "Jantar", kcal: split[4], items: ["180g patinho", "200g batata", "legumes refogados"] },
    { time: "22:30", name: "Ceia", kcal: split[5], items: ["1 scoop caseína ou cottage", "1 col. pasta de amendoim"] },
  ];
  return { bmr, tdee, calories, protein, carbs, fat, meals };
}

function exportTxt(plan: ReturnType<typeof generate>) {
  const txt = [
    `VRUMFIT — Plano Alimentar`,
    `Calorias: ${plan.calories} kcal | P:${plan.protein}g C:${plan.carbs}g G:${plan.fat}g`,
    ``,
    ...plan.meals.map((m) => `${m.time} ${m.name} (${m.kcal} kcal)\n  - ${m.items.join("\n  - ")}`),
  ].join("\n");
  const blob = new Blob([txt], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "dieta-vrumfit.txt"; a.click();
  URL.revokeObjectURL(url);
}
