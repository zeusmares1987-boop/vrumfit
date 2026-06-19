import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Field, inputCls, btnPrimary } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Download, BookOpen, FileDown, Dumbbell, Zap, Clock, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { WorkoutPDF, type WorkoutPDFData } from "@/components/pdfs/VrumPDFs";
import {
  generateWorkoutPlan,
  type Goal, type Level, type Equip, type Sex, type WeekPlan, type WorkoutPlanInput,
} from "@/lib/workout-engine";

export const Route = createFileRoute("/treinos")({
  head: () => ({ meta: [{ title: "Gerador de Treinos Elite — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <TreinosPage />
    </RequireAuth>
  ),
});

function TreinosPage() {
  const [sex, setSex] = useState<Sex>("M");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(80);
  const [height, setHeight] = useState(175);
  const [goal, setGoal] = useState<Goal>("hipertrofia");
  const [level, setLevel] = useState<Level>("intermediario");
  const [frequency, setFrequency] = useState(4);
  const [sessionMinutes, setSessionMinutes] = useState(60);
  const [equip, setEquip] = useState<Equip>("completo");
  const [weeks, setWeeks] = useState(6);
  const [oneRM, setOneRM] = useState<number | "">("");
  const [injuries, setInjuries] = useState<string[]>([]);
  const [plan, setPlan] = useState<WeekPlan[] | null>(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [openDay, setOpenDay] = useState<number | null>(0);

  const toggleInjury = (k: string) =>
    setInjuries((arr) => (arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: WorkoutPlanInput = {
      sex, age, weightKg: weight, heightCm: height,
      goal, level, frequency, sessionMinutes,
      location: equip === "peso_corporal" ? "casa" : "academia",
      equip,
      injuries: injuries as WorkoutPlanInput["injuries"],
      weeks,
      oneRM: oneRM ? { kg: Number(oneRM) } : undefined,
    };
    const p = generateWorkoutPlan(input);
    setPlan(p);
    setActiveWeek(1);
    setOpenDay(0);
  };

  const week = plan?.find((w) => w.week === activeWeek);

  return (
    <AppShell title="Gerador Elite" subtitle="Periodização científica · RIR · MEV/MAV/MRV">
      <Link to="/biblioteca" className="mb-3 flex items-center gap-2 h-11 px-4 rounded-2xl border border-primary/40 bg-primary/10 text-primary text-[13px] font-semibold hover:bg-primary/15 transition">
        <BookOpen className="size-4" /> Abrir biblioteca VrumFit
      </Link>

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
            <Field label="Idade"><input type="number" value={age} onChange={(e) => setAge(+e.target.value)} className={inputCls} /></Field>
            <Field label="Peso (kg)"><input type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} className={inputCls} /></Field>
            <Field label="Altura (cm)"><input type="number" value={height} onChange={(e) => setHeight(+e.target.value)} className={inputCls} /></Field>
          </div>

          <Field label="Objetivo">
            <div className="grid grid-cols-3 gap-2">
              {(["hipertrofia", "forca", "resistencia", "emagrecimento", "condicionamento"] as Goal[]).map((g) => (
                <button key={g} type="button" onClick={() => setGoal(g)}
                  className={`py-2 rounded-xl text-[11px] font-semibold capitalize ${goal === g ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {g}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Nível">
            <div className="grid grid-cols-3 gap-2">
              {(["iniciante", "intermediario", "avancado"] as Level[]).map((l) => (
                <button key={l} type="button" onClick={() => setLevel(l)}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize ${level === l ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {l}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Frequência semanal">
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <button key={n} type="button" onClick={() => setFrequency(n)}
                  className={`py-2 rounded-xl text-sm font-bold ${frequency === n ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {n}x
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tempo por sessão">
              <select value={sessionMinutes} onChange={(e) => setSessionMinutes(+e.target.value)} className={inputCls}>
                {[30, 45, 60, 75, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            </Field>
            <Field label="Semanas do bloco">
              <select value={weeks} onChange={(e) => setWeeks(+e.target.value)} className={inputCls}>
                {[4, 5, 6, 8].map((w) => <option key={w} value={w}>{w} sem (deload na última)</option>)}
              </select>
            </Field>
          </div>

          <Field label="Equipamento disponível">
            <select value={equip} onChange={(e) => setEquip(e.target.value as Equip)} className={inputCls}>
              <option value="completo">Academia completa</option>
              <option value="halteres">Só halteres / barra</option>
              <option value="elasticos">Elásticos</option>
              <option value="peso_corporal">Apenas peso corporal</option>
            </select>
          </Field>

          <Field label="1RM no agachamento ou supino (opcional, kg)">
            <input type="number" value={oneRM} onChange={(e) => setOneRM(e.target.value ? +e.target.value : "")} className={inputCls} placeholder="ex: 120" />
          </Field>

          <Field label="Restrições / lesões">
            <div className="flex flex-wrap gap-2">
              {["lombar", "ombro", "joelho", "cotovelo", "punho"].map((k) => (
                <button key={k} type="button" onClick={() => toggleInjury(k)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize ${injuries.includes(k) ? "bg-red-500/80 text-white" : "glass text-muted-foreground"}`}>
                  {k}
                </button>
              ))}
            </div>
          </Field>

          <button type="submit" className={btnPrimary}>GERAR PLANO ELITE</button>
        </form>
      </Card>

      {plan && week && (
        <>
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Plano de {plan.length} semanas</h3>
                <p className="text-sm font-bold mt-0.5">{goal} · {level} · {frequency}x/sem</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => exportTxt(plan)} className="glass rounded-lg px-2.5 py-1.5 text-[10px] flex items-center gap-1">
                  <Download className="size-3" /> TXT
                </button>
                <button onClick={() => exportPdf(week, goal)} className="bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5 text-[10px] font-bold flex items-center gap-1">
                  <FileDown className="size-3" /> PDF semana {week.week}
                </button>
              </div>
            </div>

            <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
              {plan.map((w) => (
                <button key={w.week} onClick={() => { setActiveWeek(w.week); setOpenDay(0); }}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold ${activeWeek === w.week ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  S{w.week}{w.isDeload ? " · deload" : ""}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Mini icon={Zap} label="RIR alvo" value={String(week.rirTarget)} />
              <Mini icon={Clock} label="Sessão" value={`${sessionMinutes}m`} />
              <Mini icon={Flame} label="Status" value={week.isDeload ? "Deload" : "Carga"} />
            </div>
          </Card>

          <div className="space-y-3">
            {week.days.map((d, i) => {
              const open = openDay === i;
              return (
                <Card key={i}>
                  <button onClick={() => setOpenDay(open ? null : i)} className="w-full flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Treino {String.fromCharCode(65 + i)}</p>
                      <p className="text-sm font-extrabold mt-0.5">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{d.exercises.length} exercícios · foco: {d.focus.join(", ")}</p>
                    </div>
                    {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                  </button>

                  {open && (
                    <div className="mt-3 space-y-3">
                      <div className="glass rounded-xl p-3">
                        <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Aquecimento</p>
                        <ul className="text-[11px] text-muted-foreground space-y-0.5">
                          {d.warmup.map((w, j) => <li key={j}>• {w}</li>)}
                        </ul>
                      </div>

                      <ul className="space-y-2">
                        {d.exercises.map((ex, j) => (
                          <li key={j} className="glass rounded-xl p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Dumbbell className="size-3.5 text-primary shrink-0" />
                                <p className="text-[13px] font-bold truncate">{ex.name}</p>
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                {ex.sets}×{ex.reps}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                              <span>descanso <span className="text-foreground font-mono">{ex.rest}</span></span>
                              <span>RIR <span className="text-foreground font-mono">{ex.rir}</span></span>
                              <span className="capitalize">{ex.tier.replace("_", " ")}</span>
                              {ex.loadHint && <span>carga <span className="text-primary font-mono">{ex.loadHint}</span></span>}
                            </div>
                            {ex.substitutes.length > 0 && (
                              <p className="mt-1.5 text-[10px] text-muted-foreground">
                                <span className="text-primary font-semibold">Substituir por:</span> {ex.substitutes.slice(0, 3).join(" · ")}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>

                      {d.cardio && (
                        <div className="glass rounded-xl p-3 border border-primary/30">
                          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Finalizador</p>
                          <p className="text-[12px] mt-1">{d.cardio}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}

function Mini({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-2.5">
      <Icon className="size-3.5 text-primary" />
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}

function exportTxt(plan: WeekPlan[]) {
  const txt = plan.map((w) =>
    `===== SEMANA ${w.week}${w.isDeload ? " (DELOAD)" : ""} · RIR ${w.rirTarget} =====\n` +
    w.days.map((d, i) =>
      `\nTreino ${String.fromCharCode(65 + i)} — ${d.name}\n` +
      d.exercises.map((e) => `  ${e.name}  ${e.sets}x${e.reps}  ${e.rest}  RIR${e.rir}${e.loadHint ? "  " + e.loadHint : ""}`).join("\n")
    ).join("\n")
  ).join("\n\n");
  const blob = new Blob([`VRUMFIT — Plano Elite\n\n${txt}`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "plano-elite-vrumfit.txt"; a.click();
  URL.revokeObjectURL(url);
}

async function exportPdf(week: WeekPlan, goal: string) {
  for (let i = 0; i < week.days.length; i++) {
    const d = week.days[i];
    const data: WorkoutPDFData = {
      studentName: "Aluno VrumFit",
      dayLabel: `S${week.week} · DIA ${i + 1} — ${d.name}`,
      tip: `Objetivo: ${goal}. RIR alvo ${week.rirTarget}. ${week.isDeload ? "Semana de deload: foco em recuperação." : "Mantenha técnica antes de carga."}`,
      exercises: d.exercises.map((ex) => ({
        name: ex.name,
        sets: String(ex.sets),
        reps: ex.reps,
        rest: ex.rest,
        tips: [
          `RIR ${ex.rir} — pare com ${ex.rir} reps de reserva.`,
          ex.loadHint ? `Carga sugerida: ${ex.loadHint}.` : "Ajuste a carga pelo RIR.",
          ex.substitutes[0] ? `Substituto: ${ex.substitutes[0]}.` : "Mantenha controle excêntrico.",
        ],
      })),
    };
    const blob = await pdf(<WorkoutPDF data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `treino-s${week.week}-${d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
