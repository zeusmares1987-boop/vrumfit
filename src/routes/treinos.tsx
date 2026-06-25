import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { useLocalState } from "@/hooks/use-local-state";
import { toast } from "sonner";
import { useStudentContext } from "@/lib/student-context";
import { saveWorkoutWeek } from "@/lib/plan-persistence";
import { usePlanGate } from "@/lib/plan-gate";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card, Field, inputCls, btnPrimary } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { AnamneseNudge } from "@/components/AnamneseNudge";
import { LastSavedBadge } from "@/components/LastSavedBadge";
import { RequireAuth } from "@/components/RequireAuth";
import { StoredImage } from "@/components/StoredImage";
import { useAuth } from "@/lib/auth";
import { Download, BookOpen, FileDown, Zap, Clock, Flame, ChevronDown, ChevronUp, Play, Dumbbell } from "lucide-react";
import type { WorkoutPDFData } from "@/components/pdfs/VrumPDFs";
import { generateWorkoutPDFBlob } from "@/lib/pdf-lazy";
import {
  generateWorkoutPlan,
  type Goal, type Level, type Equip, type Sex, type WeekPlan, type WorkoutPlanInput,
} from "@/lib/workout-engine";

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}


export const Route = createFileRoute("/treinos")({
  head: () => ({ meta: [{ title: "Gerador de Treinos Elite — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <TreinosPage />
    </RequireAuth>
  ),
});

function TreinosPage() {
  const { user } = useAuth();
  const { data: exLib } = useQuery({
    queryKey: ["exercise-library"],
    queryFn: async () => {
      const { data } = await supabase.from("exercises").select("id,name,image_start");
      return data ?? [];
    },
  });
  const { data: profile } = useQuery({
    queryKey: ["my-profile-name", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const studentName = profile?.full_name ?? profile?.email ?? user?.email ?? "Aluno";
  const repeatedExerciseImages = useMemo(() => {
    const counts = new Map<string, number>();
    (exLib ?? []).forEach((e) => e.image_start && counts.set(e.image_start, (counts.get(e.image_start) ?? 0) + 1));
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([url]) => url));
  }, [exLib]);
  const exMap = useMemo(() => {
    const m = new Map<string, { id: string; image_start: string | null }>();
    (exLib ?? []).forEach((e) => m.set(normalize(e.name), { id: e.id, image_start: e.image_start }));
    return m;
  }, [exLib]);
  const lookup = (name: string) => {
    const key = normalize(name);
    if (exMap.has(key)) return exMap.get(key);
    for (const [k, v] of exMap) if (k.includes(key) || key.includes(k)) return v;
    return undefined;
  };

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
  const [plan, setPlan] = useLocalState<WeekPlan[] | null>("vrumfit:last-workout", null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [openDay, setOpenDay] = useState<number | null>(0);

  // Aderência: contagem de treinos concluídos nos últimos 7 dias
  const { data: completedCount = 0, refetch: refetchSessions } = useQuery({
    queryKey: ["sessions-7d", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      if (!user) return 0;
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const { count } = await supabase.from("workout_sessions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", user.id)
        .gte("session_date", since);
      return count ?? 0;
    },
  });

  // Pré-preenchimento automático a partir do contexto do aluno (Fase 2)
  const { ctx } = useStudentContext();
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current) return;
    if (ctx.age || ctx.weightKg || ctx.heightCm || ctx.goalWorkout || ctx.level) {
      if (ctx.age) setAge(ctx.age);
      if (ctx.weightKg) setWeight(ctx.weightKg);
      if (ctx.heightCm) setHeight(ctx.heightCm);
      if (ctx.goalWorkout && ctx.goalWorkout !== "saude" && ctx.goalWorkout !== "manutencao") {
        setGoal(ctx.goalWorkout as Goal);
      }
      if (ctx.level) setLevel(ctx.level);
      prefilled.current = true;
    }
  }, [ctx]);

  const toggleInjury = (k: string) =>
    setInjuries((arr) => (arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (age < 12 || age > 90) return toast.error("Idade deve estar entre 12 e 90 anos.");
    if (weight < 30 || weight > 250) return toast.error("Peso deve estar entre 30 e 250 kg.");
    if (height < 120 || height > 230) return toast.error("Altura deve estar entre 120 e 230 cm.");
    if (oneRM !== "" && (Number(oneRM) < 10 || Number(oneRM) > 500)) return toast.error("1RM deve estar entre 10 e 500 kg.");
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

  const { gate } = usePlanGate();
  const [saving, setSaving] = useState(false);
  const handleSaveWeek = async () => {
    if (!week || !user) return;
    if (!gate.canSaveWorkout) {
      toast.error(gate.reason ?? "Seu plano não permite salvar treinos.");
      return;
    }
    setSaving(true);
    try {
      const { data: stu } = await supabase.from("students").select("personal_id").eq("user_id", user.id).maybeSingle();
      const exMapById = new Map<string, string>();
      (exLib ?? []).forEach((e) => exMapById.set(normalize(e.name), e.id));
      await saveWorkoutWeek({
        studentId: user.id,
        personalId: stu?.personal_id ?? null,
        week,
        level,
        goal,
        exerciseIdByName: exMapById,
      });
      toast.success(`Semana ${week.week} salva no perfil`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Gerador Elite" subtitle="Periodização científica · RIR · MEV/MAV/MRV">
      <PageHero
        eyebrow="Treino Elite"
        title="Gerador de Treinos"
        subtitle="Plano periodizado com RIR, deload e substitutos por equipamento."
        icon={Dumbbell}
        stats={[
          { label: "Semanas", value: weeks },
          { label: "Frequência", value: `${frequency}x` },
          { label: "Objetivo", value: goal },
        ]}
      />

      <AnamneseNudge />

      <Link to="/biblioteca" className="flex items-center gap-2 h-11 px-4 rounded-2xl border border-primary/40 bg-primary/10 text-primary text-[13px] font-semibold hover:bg-primary/15 transition">
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
              <div className="flex gap-2 flex-wrap">
                <Link to="/historico" className="glass rounded-lg px-2.5 py-1.5 text-[10px] text-primary font-semibold hover:bg-primary/15 transition">
                  Histórico →
                </Link>
                <button
                  onClick={() => { if (confirm("Limpar plano gerado?")) setPlan(null); }}
                  className="glass rounded-lg px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition"
                >
                  Limpar
                </button>
                <button onClick={() => exportTxt(plan)} className="glass rounded-lg px-2.5 py-1.5 text-[10px] flex items-center gap-1">
                  <Download className="size-3" /> TXT
                </button>
                <button onClick={() => exportPdf(week, goal, studentName)} className="bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5 text-[10px] font-bold flex items-center gap-1">
                  <FileDown className="size-3" /> PDF semana {week.week}
                </button>
                <button
                  onClick={handleSaveWeek}
                  disabled={saving || !gate.canSaveWorkout}
                  title={!gate.canSaveWorkout ? (gate.reason ?? "Plano não inclui salvar") : "Salvar semana"}
                  className="glass rounded-lg px-2.5 py-1.5 text-[10px] font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  {saving ? "Salvando…" : gate.canSaveWorkout ? "Salvar semana" : "🔒 Salvar"}
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

            <div className="mt-3 grid grid-cols-4 gap-2">
              <Mini icon={Zap} label="RIR alvo" value={String(week.rirTarget)} />
              <Mini icon={Clock} label="Sessão" value={`${sessionMinutes}m`} />
              <Mini icon={Flame} label="Status" value={week.isDeload ? "Deload" : "Carga"} />
              <Mini icon={Dumbbell} label="Feitos/7d" value={String(completedCount)} />
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
                        {d.exercises.map((ex, j) => {
                          const hit = lookup(ex.name);
                          const hasUniquePhoto = Boolean(hit?.image_start && !repeatedExerciseImages.has(hit.image_start));
                          const exercisePhoto = hasUniquePhoto ? hit?.image_start ?? undefined : undefined;
                          const content = (
                            <>
                              <div className="relative size-16 shrink-0 rounded-lg overflow-hidden border border-primary/30 bg-black">
                                {exercisePhoto ? (
                                  <StoredImage src={exercisePhoto} alt={`Execução do exercício ${ex.name}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                  <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_35%_25%,color-mix(in_oklab,var(--primary)_30%,transparent),transparent_36%),linear-gradient(135deg,color-mix(in_oklab,var(--surface)_92%,black),black)]">
                                    <span className="text-[13px] font-black text-primary">{ex.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase()}</span>
                                  </div>
                                )}
                                {hit && (
                                  <div className="absolute inset-0 bg-black/30 grid place-items-center opacity-0 group-hover:opacity-100 transition">
                                    <Play className="size-5 text-primary" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[13px] font-bold truncate">{ex.name}</p>
                                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">{ex.sets}×{ex.reps}</span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                                  <span>descanso <span className="text-foreground font-mono">{ex.rest}</span></span>
                                  <span>RIR <span className="text-foreground font-mono">{ex.rir}</span></span>
                                  {ex.loadHint && <span>carga <span className="text-primary font-mono">{ex.loadHint}</span></span>}
                                </div>
                                {hit && (
                                  <p className="mt-1 text-[10px] text-primary font-semibold">Toque para ver execução{!hasUniquePhoto ? " · foto pendente" : ""} →</p>
                                )}
                                {ex.substitutes.length > 0 && (
                                  <details className="mt-1.5 group" onClick={(e) => e.stopPropagation()}>
                                    <summary className="cursor-pointer list-none text-[10px] text-primary font-semibold inline-flex items-center gap-1">
                                      🔁 Trocar ({ex.substitutes.length})
                                    </summary>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                      {ex.substitutes.map((s, k) => (
                                        <button
                                          key={k}
                                          type="button"
                                          onClick={(evt) => {
                                            evt.preventDefault();
                                            evt.stopPropagation();
                                            if (!plan) return;
                                            const next = structuredClone(plan);
                                            const w = next.find((x) => x.week === week!.week);
                                            if (!w) return;
                                            const target = w.days[i].exercises[j];
                                            const oldName = target.name;
                                            target.name = s;
                                            target.substitutes = [oldName, ...ex.substitutes.filter((x) => x !== s)];
                                            setPlan(next);
                                          }}
                                          className="px-2 py-1 rounded-full text-[10px] glass hover:bg-primary/15 hover:text-primary transition"
                                        >
                                          {s}
                                        </button>
                                      ))}
                                    </div>
                                  </details>
                                )}
                              </div>
                            </>
                          );
                          return (
                            <li key={j}>
                              {hit ? (
                                <Link to="/biblioteca/$id" params={{ id: hit.id }} className="group glass rounded-xl p-3 flex items-start gap-3 hover:border-primary/50 transition">
                                  {content}
                                </Link>
                              ) : (
                                <div className="glass rounded-xl p-3 flex items-start gap-3">{content}</div>
                              )}
                            </li>
                          );
                        })}
                      </ul>


                      {d.cardio && (
                        <div className="glass rounded-xl p-3 border border-primary/30">
                          <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Finalizador</p>
                          <p className="text-[12px] mt-1">{d.cardio}</p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          if (!user) return;
                          const { error } = await supabase.from("workout_sessions").insert({
                            student_id: user.id,
                            session_date: new Date().toISOString().slice(0, 10),
                            duration_min: sessionMinutes,
                            notes: `${d.name} · S${week.week} · ${d.exercises.length} ex`,
                          });
                          if (error) toast.error("Não foi possível registrar: " + error.message);
                          else { toast.success(`Treino "${d.name}" registrado ✓`); refetchSessions(); }
                        }}
                        className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-[12px] font-bold hover:opacity-90 transition"
                      >
                        ✓ Concluir treino
                      </button>
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

async function exportPdf(week: WeekPlan, goal: string, studentName: string) {
  for (let i = 0; i < week.days.length; i++) {
    const d = week.days[i];
    const data: WorkoutPDFData = {
      studentName,
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
    const blob = await generateWorkoutPDFBlob(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `treino-s${week.week}-${d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
