import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { AppShell, Card, Field, inputCls, btnPrimary } from "@/components/AppShell";
import { Flame, Dumbbell, Apple, Droplet, FileDown, Zap } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import { WorkoutPDF, DietPDF, type WorkoutPDFData, type DietPDFData } from "@/components/pdfs/VrumPDFs";
import { generateElitePlan, type ElitePlan } from "@/lib/integration-engine";
import type { Goal, Level, Equip, Sex } from "@/lib/workout-engine";
import type { GoalDiet, DietRestriction, Budget } from "@/lib/diet-engine";

export const Route = createFileRoute("/elite")({
  head: () => ({ meta: [{ title: "Plano Elite Integrado — VRUMFIT" }] }),
  component: ElitePage,
});

function ElitePage() {
  // dados compartilhados
  const [sex, setSex] = useState<Sex>("M");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(80);
  const [height, setHeight] = useState(175);
  // treino
  const [goal, setGoal] = useState<Goal>("hipertrofia");
  const [level, setLevel] = useState<Level>("intermediario");
  const [frequency, setFrequency] = useState(4);
  const [sessionMin, setSessionMin] = useState(60);
  const [equip, setEquip] = useState<Equip>("completo");
  const [weeks, setWeeks] = useState(6);
  // dieta
  const [dietGoal, setDietGoal] = useState<GoalDiet>("manutencao");
  const [bf, setBf] = useState<number | "">("");
  const [activity, setActivity] = useState(1.55);
  const [meals, setMeals] = useState(5);
  const [budget, setBudget] = useState<Budget>("medio");
  const [restrictions, setRestrictions] = useState<DietRestriction[]>([]);
  const [plan, setPlan] = useState<ElitePlan | null>(null);
  const [busy, setBusy] = useState(false);

  const toggleR = (r: DietRestriction) =>
    setRestrictions((arr) => (arr.includes(r) ? arr.filter((x) => x !== r) : [...arr, r]));

  // ===== Persistência local (zero custo, sem banco) =====
  const STORAGE_KEY = "vrumfit:elite:v1";
  const hydrated = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.sex) setSex(s.sex);
        if (typeof s.age === "number") setAge(s.age);
        if (typeof s.weight === "number") setWeight(s.weight);
        if (typeof s.height === "number") setHeight(s.height);
        if (s.goal) setGoal(s.goal);
        if (s.level) setLevel(s.level);
        if (typeof s.frequency === "number") setFrequency(s.frequency);
        if (typeof s.sessionMin === "number") setSessionMin(s.sessionMin);
        if (s.equip) setEquip(s.equip);
        if (typeof s.weeks === "number") setWeeks(s.weeks);
        if (s.dietGoal) setDietGoal(s.dietGoal);
        if (s.bf === "" || typeof s.bf === "number") setBf(s.bf);
        if (typeof s.activity === "number") setActivity(s.activity);
        if (typeof s.meals === "number") setMeals(s.meals);
        if (s.budget) setBudget(s.budget);
        if (Array.isArray(s.restrictions)) setRestrictions(s.restrictions);
        if (s.plan) setPlan(s.plan);
      }
    } catch {}
    hydrated.current = true;
  }, []);
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sex, age, weight, height, goal, level, frequency, sessionMin, equip, weeks,
          dietGoal, bf, activity, meals, budget, restrictions, plan,
        }),
      );
    } catch {}
  }, [sex, age, weight, height, goal, level, frequency, sessionMin, equip, weeks, dietGoal, bf, activity, meals, budget, restrictions, plan]);

  const resetPlan = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setPlan(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = generateElitePlan({
      workout: {
        sex, age, weightKg: weight, heightCm: height,
        goal, level, frequency, sessionMinutes: sessionMin,
        location: equip === "peso_corporal" ? "casa" : "academia",
        equip, weeks,
      },
      diet: {
        sex, age, weightKg: weight, heightCm: height,
        bodyFatPct: bf ? Number(bf) : undefined,
        activityFactor: activity, goal: dietGoal, meals, restrictions, budget,
      },
    });
    setPlan(p);
  };

  const exportCombined = async () => {
    if (!plan) return;
    setBusy(true);
    try {
      const merged = await PDFDocument.create();
      const week = plan.workout[0];
      // 1 PDF por dia de treino da semana 1
      for (let i = 0; i < week.days.length; i++) {
        const d = week.days[i];
        const data: WorkoutPDFData = {
          studentName: "Aluno VrumFit",
          dayLabel: `S1 · DIA ${i + 1} — ${d.name}`,
          tip: `RIR ${week.rirTarget}. Foco em técnica antes de carga.`,
          exercises: d.exercises.map((ex) => ({
            name: ex.name, sets: String(ex.sets), reps: ex.reps, rest: ex.rest,
            tips: [
              `RIR ${ex.rir}.`,
              ex.loadHint ? `Carga: ${ex.loadHint}.` : "Ajuste pela RIR.",
              ex.substitutes[0] ? `Substituto: ${ex.substitutes[0]}.` : "Mantenha excêntrico controlado.",
            ],
          })),
        };
        const blob = await pdf(<WorkoutPDF data={data} />).toBlob();
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      // Dieta dia de treino + dieta dia descanso
      for (const [label, d] of [["DIA DE TREINO", plan.dietTraining], ["DIA DE DESCANSO", plan.dietRest]] as const) {
        const data: DietPDFData = {
          studentName: "Aluno VrumFit",
          dayLabel: label,
          water: `${label.includes("TREINO") ? plan.waterTrainingMl : plan.waterRestMl} ml`,
          goldenTip: `Alvo: ${(label.includes("TREINO") ? plan.targetTraining : plan.targetRest).kcal} kcal. Sincronizado com seu plano de treino.`,
          meals: d.meals.map((m, i) => ({
            number: i + 1,
            title: m.title,
            timeRange: m.time,
            foods: m.items.map((it) => `${it.food.name} (${it.grams}g)`).join(" + "),
            amount: `${m.totals.kcal} kcal · P${m.totals.p} C${m.totals.c} G${m.totals.f}`,
            substitutions: m.substitutionsByItem.flat().slice(0, 6).join(" · ") || "—",
            observation: label.includes("TREINO") ? "Carbo extra para performance." : "Recuperação ativa — priorize proteína e gordura boa.",
          })),
        };
        const blob = await pdf(<DietPDF data={data} />).toBlob();
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const out = await merged.save();
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "plano-elite-combinado-vrumfit.pdf"; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Plano Elite Integrado" subtitle="Treino ↔ dieta sincronizados">
      <div className="mb-3 flex gap-2">
        <Link to="/treinos" className="flex-1 h-10 px-3 rounded-xl glass text-[12px] font-semibold flex items-center justify-center gap-1.5">
          <Dumbbell className="size-3.5" /> Só treino
        </Link>
        <Link to="/dieta" className="flex-1 h-10 px-3 rounded-xl glass text-[12px] font-semibold flex items-center justify-center gap-1.5">
          <Apple className="size-3.5" /> Só dieta
        </Link>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Você</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sexo">
              <div className="flex gap-2">
                {(["M", "F"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setSex(s)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold ${sex === s ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                    {s === "M" ? "M" : "F"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Idade"><input type="number" value={age} onChange={(e) => setAge(+e.target.value)} className={inputCls} /></Field>
            <Field label="Peso (kg)"><input type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} className={inputCls} /></Field>
            <Field label="Altura (cm)"><input type="number" value={height} onChange={(e) => setHeight(+e.target.value)} className={inputCls} /></Field>
            <Field label="% gordura (opc.)">
              <input type="number" value={bf} onChange={(e) => setBf(e.target.value ? +e.target.value : "")} className={inputCls} placeholder="Katch-McArdle" />
            </Field>
            <Field label="Atividade">
              <select value={activity} onChange={(e) => setActivity(+e.target.value)} className={inputCls}>
                <option value={1.2}>Sedentário</option>
                <option value={1.375}>Leve</option>
                <option value={1.55}>Moderado</option>
                <option value={1.725}>Intenso</option>
                <option value={1.9}>Atleta</option>
              </select>
            </Field>
          </div>

          <p className="text-[10px] uppercase tracking-widest text-primary font-bold pt-2">Treino</p>
          <div className="grid grid-cols-3 gap-2">
            {(["hipertrofia", "forca", "resistencia", "emagrecimento", "condicionamento"] as Goal[]).map((g) => (
              <button key={g} type="button" onClick={() => setGoal(g)}
                className={`py-2 rounded-xl text-[11px] font-semibold capitalize ${goal === g ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                {g}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["iniciante", "intermediario", "avancado"] as Level[]).map((l) => (
              <button key={l} type="button" onClick={() => setLevel(l)}
                className={`py-2 rounded-xl text-xs font-semibold capitalize ${level === l ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[2, 3, 4, 5, 6].map((n) => (
              <button key={n} type="button" onClick={() => setFrequency(n)}
                className={`py-2 rounded-xl text-sm font-bold ${frequency === n ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                {n}x
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Sessão">
              <select value={sessionMin} onChange={(e) => setSessionMin(+e.target.value)} className={inputCls}>
                {[30, 45, 60, 75, 90, 120].map((m) => <option key={m} value={m}>{m}m</option>)}
              </select>
            </Field>
            <Field label="Semanas">
              <select value={weeks} onChange={(e) => setWeeks(+e.target.value)} className={inputCls}>
                {[4, 5, 6, 8].map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
            <Field label="Equip.">
              <select value={equip} onChange={(e) => setEquip(e.target.value as Equip)} className={inputCls}>
                <option value="completo">Academia</option>
                <option value="halteres">Halteres</option>
                <option value="elasticos">Elásticos</option>
                <option value="peso_corporal">Peso corp.</option>
              </select>
            </Field>
          </div>

          <p className="text-[10px] uppercase tracking-widest text-primary font-bold pt-2">Dieta</p>
          <div className="grid grid-cols-3 gap-2">
            {(["cutting_agressivo", "cutting", "manutencao", "bulking_limpo", "bulking"] as GoalDiet[]).map((g) => (
              <button key={g} type="button" onClick={() => setDietGoal(g)}
                className={`py-2 rounded-xl text-[10px] font-semibold capitalize ${dietGoal === g ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                {g.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Refeições/dia">
              <select value={meals} onChange={(e) => setMeals(+e.target.value)} className={inputCls}>
                {[3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Orçamento">
              <select value={budget} onChange={(e) => setBudget(e.target.value as Budget)} className={inputCls}>
                <option value="economico">Econômico</option>
                <option value="medio">Médio</option>
                <option value="premium">Premium</option>
              </select>
            </Field>
          </div>
          <Field label="Restrições">
            <div className="flex flex-wrap gap-2">
              {(["vegetariano", "vegano", "sem_lactose", "sem_gluten", "low_carb", "cetogenica"] as DietRestriction[]).map((r) => (
                <button key={r} type="button" onClick={() => toggleR(r)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize ${restrictions.includes(r) ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {r.replace("_", " ")}
                </button>
              ))}
            </div>
          </Field>

          <button type="submit" className={btnPrimary}>GERAR PLANO ELITE INTEGRADO</button>
        </form>
      </Card>

      {plan && (
        <>
          <Card>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Resumo semanal</p>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <Mini icon={Dumbbell} label="Treinos" value={`${plan.summary.weeklyTrainingDays}x`} />
              <Mini icon={Zap} label="Séries" value={String(plan.summary.weeklyVolumeSets)} />
              <Mini icon={Flame} label="Kcal/sem" value={plan.summary.weeklyKcal.toLocaleString("pt-BR")} />
              <Mini icon={Droplet} label="Água T" value={`${(plan.waterTrainingMl / 1000).toFixed(1)}L`} />
            </div>
            <button onClick={exportCombined} disabled={busy} className="mt-3 w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              <FileDown className="size-4" /> {busy ? "Montando PDF..." : "PDF combinado (treino + dieta)"}
            </button>
            <button onClick={resetPlan} className="mt-2 w-full glass rounded-xl py-2 text-[11px] font-semibold text-muted-foreground">
              Limpar plano salvo
            </button>
          </Card>

          <Card>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Dia DE treino</p>
            <MacrosRow t={plan.targetTraining} />
            <p className="text-[10px] text-muted-foreground mt-2">+15% carbo · +5% kcal · {plan.waterTrainingMl} ml água</p>
          </Card>

          <Card>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Dia de descanso</p>
            <MacrosRow t={plan.targetRest} />
            <p className="text-[10px] text-muted-foreground mt-2">−15% carbo · +5% gordura · {plan.waterRestMl} ml água</p>
          </Card>

          <Card>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
              Semana 1 · RIR {plan.workout[0].rirTarget}
            </p>
            <ul className="space-y-1.5">
              {plan.workout[0].days.map((d, i) => (
                <li key={i} className="glass rounded-lg px-3 py-2 text-[12px]">
                  <span className="font-bold">Dia {i + 1}:</span> {d.name}
                  <span className="text-muted-foreground"> · {d.exercises.length} ex · {d.focus.join(", ")}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </AppShell>
  );
}

function Mini({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-2">
      <Icon className="size-3.5 text-primary" />
      <p className="text-[8px] uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
      <p className="text-[12px] font-bold mt-0.5">{value}</p>
    </div>
  );
}

function MacrosRow({ t }: { t: { kcal: number; p: number; c: number; f: number } }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <Stat label="Kcal" value={String(t.kcal)} />
      <Stat label="Prot" value={`${t.p}g`} />
      <Stat label="Carbo" value={`${t.c}g`} />
      <Stat label="Gord" value={`${t.f}g`} />
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-lg p-2 text-center">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}
