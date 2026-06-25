import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useStudentContext } from "@/lib/student-context";
import { saveDietPlan } from "@/lib/plan-persistence";
import { usePlanGate } from "@/lib/plan-gate";
import { AppShell, Card, Field, inputCls, btnPrimary } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Flame, Beef, Wheat, Droplet, Download, FileDown, ShoppingCart, ChevronDown, ChevronUp, Salad } from "lucide-react";
import type { DietPDFData } from "@/components/pdfs/VrumPDFs";
import { generateDietPDFBlob } from "@/lib/pdf-lazy";
import {
  generateDietPlan,
  type DietInput, type GoalDiet, type DietRestriction, type Sex, type Budget, type DietPlan,
} from "@/lib/diet-engine";

export const Route = createFileRoute("/dieta")({
  head: () => ({ meta: [{ title: "Gerador de Dieta Elite — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <DietaPage />
    </RequireAuth>
  ),
});

function DietaPage() {
  const { user } = useAuth();
  const [sex, setSex] = useState<Sex>("M");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(80);
  const [height, setHeight] = useState(175);
  const [bf, setBf] = useState<number | "">("");
  const [activity, setActivity] = useState(1.55);
  const [goal, setGoal] = useState<GoalDiet>("manutencao");
  const [meals, setMeals] = useState(5);
  const [budget, setBudget] = useState<Budget>("medio");
  const [restrictions, setRestrictions] = useState<DietRestriction[]>([]);
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [openMeal, setOpenMeal] = useState<number | null>(0);
  const [showShop, setShowShop] = useState(false);

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

  // Pré-preenchimento automático a partir do contexto do aluno (Fase 2)
  const { ctx } = useStudentContext();
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current) return;
    if (ctx.age || ctx.weightKg || ctx.heightCm || ctx.goalDiet || ctx.activityFactor || ctx.sex) {
      if (ctx.sex) setSex(ctx.sex);
      if (ctx.age) setAge(ctx.age);
      if (ctx.weightKg) setWeight(ctx.weightKg);
      if (ctx.heightCm) setHeight(ctx.heightCm);
      if (ctx.activityFactor) setActivity(ctx.activityFactor);
      if (ctx.goalDiet) setGoal(ctx.goalDiet);
      prefilled.current = true;
    }
  }, [ctx]);

  const toggleR = (r: DietRestriction) =>
    setRestrictions((arr) => (arr.includes(r) ? arr.filter((x) => x !== r) : [...arr, r]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (age < 12 || age > 90) return toast.error("Idade deve estar entre 12 e 90 anos.");
    if (weight < 30 || weight > 250) return toast.error("Peso deve estar entre 30 e 250 kg.");
    if (height < 120 || height > 230) return toast.error("Altura deve estar entre 120 e 230 cm.");
    if (bf !== "" && (Number(bf) < 3 || Number(bf) > 60)) return toast.error("% gordura deve estar entre 3 e 60.");
    const input: DietInput = {
      sex, age, weightKg: weight, heightCm: height,
      bodyFatPct: bf ? Number(bf) : undefined,
      activityFactor: activity, goal, meals, restrictions, budget,
    };
    setPlan(generateDietPlan(input));
    setOpenMeal(0);
  };

  const { gate } = usePlanGate();
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!plan || !user) return;
    if (!gate.canSaveDiet) {
      toast.error(gate.reason ?? "Seu plano não permite salvar dietas.");
      return;
    }
    setSaving(true);
    try {
      const { data: stu } = await supabase.from("students").select("personal_id").eq("user_id", user.id).maybeSingle();
      await saveDietPlan({
        studentId: user.id,
        personalId: stu?.personal_id ?? null,
        plan,
        goal,
      });
      toast.success("Dieta salva no perfil do aluno");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Gerador Elite de Dieta" subtitle="Mifflin/Katch · Macros científicos · TACO">
      <PageHero
        eyebrow="Nutrição Elite"
        title="Gerador de Dieta"
        subtitle="Macros calculados via Mifflin ou Katch, cardápio com TACO."
        icon={Salad}
        stats={[
          { label: "Refeições", value: meals },
          { label: "Objetivo", value: goal },
          { label: "Orçamento", value: budget },
        ]}
      />

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
            <Field label="% gordura (opcional)">
              <input type="number" value={bf} onChange={(e) => setBf(e.target.value ? +e.target.value : "")} className={inputCls} placeholder="usa Katch-McArdle" />
            </Field>
            <Field label="Refeições/dia">
              <select value={meals} onChange={(e) => setMeals(+e.target.value)} className={inputCls}>
                {[3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
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
            <div className="grid grid-cols-5 gap-1.5">
              {(["cutting_agressivo", "cutting", "manutencao", "bulking_limpo", "bulking"] as GoalDiet[]).map((g) => (
                <button key={g} type="button" onClick={() => setGoal(g)}
                  className={`py-2 rounded-xl text-[10px] font-semibold ${goal === g ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {g.replace("_", " ")}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Orçamento">
            <div className="grid grid-cols-3 gap-2">
              {(["economico", "medio", "premium"] as Budget[]).map((b) => (
                <button key={b} type="button" onClick={() => setBudget(b)}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize ${budget === b ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {b}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Restrições">
            <div className="flex flex-wrap gap-2">
              {(["vegetariano", "vegano", "sem_lactose", "sem_gluten", "low_carb", "cetogenica"] as DietRestriction[]).map((r) => (
                <button key={r} type="button" onClick={() => toggleR(r)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${restrictions.includes(r) ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {r.replace("_", " ")}
                </button>
              ))}
            </div>
          </Field>

          <button type="submit" className={btnPrimary}>GERAR DIETA ELITE</button>
        </form>
      </Card>

      {plan && (
        <>
          <Card>
            <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Resumo metabólico</h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Stat icon={Flame} label="Calorias / dia" value={`${plan.target.kcal} kcal`} />
              <Stat icon={Beef} label="Proteína" value={`${plan.target.p} g`} />
              <Stat icon={Wheat} label="Carboidrato" value={`${plan.target.c} g`} />
              <Stat icon={Droplet} label="Gordura" value={`${plan.target.f} g`} />
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              TMB <span className="font-mono text-foreground">{plan.bmr} kcal</span> · GET <span className="font-mono text-foreground">{plan.tdee} kcal</span> · Água <span className="font-mono text-primary">{plan.waterMl} ml</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Cardápio entrega: <span className="font-mono text-foreground">{plan.totals.kcal} kcal · P{plan.totals.p} C{plan.totals.c} G{plan.totals.f}</span>
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Cardápio ({plan.meals.length} refeições)</h3>
              <div className="flex gap-2">
                <button onClick={() => exportTxt(plan)} className="glass rounded-lg px-2.5 py-1.5 text-[10px] flex items-center gap-1">
                  <Download className="size-3" /> TXT
                </button>
                <button onClick={() => exportPdf(plan, goal, studentName)} className="bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5 text-[10px] font-bold flex items-center gap-1">
                  <FileDown className="size-3" /> PDF VrumFit
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !gate.canSaveDiet}
                  title={!gate.canSaveDiet ? (gate.reason ?? "Plano não inclui salvar") : "Salvar no perfil"}
                  className="glass rounded-lg px-2.5 py-1.5 text-[10px] font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  {saving ? "Salvando…" : gate.canSaveDiet ? "Salvar no perfil" : "🔒 Salvar"}
                </button>
              </div>
            </div>

            <ol className="space-y-2">
              {plan.meals.map((m, i) => {
                const open = openMeal === i;
                return (
                  <li key={i} className="border border-white/5 rounded-xl overflow-hidden">
                    <button onClick={() => setOpenMeal(open ? null : i)} className="w-full flex items-center justify-between p-3 text-left">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-primary font-bold">{m.time} · {m.totals.kcal} kcal</p>
                        <p className="text-sm font-bold mt-0.5">{m.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">P{m.totals.p} · C{m.totals.c} · G{m.totals.f}</p>
                      </div>
                      {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    </button>
                    {open && (
                      <div className="px-3 pb-3 space-y-2">
                        {m.items.map((it, j) => {
                          const subs = m.substitutionsByItem[j] ?? [];
                          return (
                            <div key={j} className="glass rounded-lg p-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[12px] font-semibold flex-1 truncate">{it.food.name}</p>
                                <p className="text-[10px] font-mono text-primary shrink-0">{it.grams} g</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {it.kcal} kcal · P{it.p} C{it.c} G{it.f} · medida: {it.food.measure}
                              </p>
                              {subs.length > 0 && (
                                <details className="mt-1 group">
                                  <summary className="cursor-pointer list-none text-[10px] text-primary font-semibold inline-flex items-center gap-1">
                                    🔁 Trocar ({subs.length})
                                  </summary>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {subs.map((s, k) => (
                                      <button
                                        key={k}
                                        type="button"
                                        onClick={() => {
                                          if (!plan) return;
                                          const next = structuredClone(plan) as DietPlan;
                                          next.meals[i].items[j] = { ...next.meals[i].items[j], food: { ...next.meals[i].items[j].food, name: s } };
                                          next.meals[i].substitutionsByItem[j] = [it.food.name, ...subs.filter((x) => x !== s)];
                                          setPlan(next);
                                        }}
                                        className="px-2 py-1 rounded-full text-[10px] glass hover:bg-primary/15 hover:text-primary transition"
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                  <p className="mt-1 text-[9px] text-muted-foreground">Macros equivalentes (mesmo grupo).</p>
                                </details>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card>
            <button onClick={() => setShowShop((s) => !s)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-4 text-primary" />
                <p className="text-sm font-bold">Lista de compras semanal</p>
              </div>
              {showShop ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
            </button>
            {showShop && (
              <ul className="mt-3 space-y-1.5">
                {plan.shoppingList.map((s, i) => (
                  <li key={i} className="flex justify-between text-[12px] glass rounded-lg px-3 py-1.5">
                    <span>{s.name}</span>
                    <span className="font-mono text-primary">{(s.gramsWeek / 1000).toFixed(2)} kg</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Notas do nutricionista</p>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              {plan.notes.map((n, i) => <li key={i}>• {n}</li>)}
            </ul>
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

function exportTxt(plan: DietPlan) {
  const txt = [
    `VRUMFIT — Plano Alimentar Elite`,
    `Alvo: ${plan.target.kcal} kcal | P:${plan.target.p}g C:${plan.target.c}g G:${plan.target.f}g | Água: ${plan.waterMl} ml`,
    ``,
    ...plan.meals.map((m) =>
      `${m.time} ${m.title} (${m.totals.kcal} kcal · P${m.totals.p} C${m.totals.c} G${m.totals.f})\n` +
      m.items.map((i) => `  - ${i.food.name}  ${i.grams}g  (${i.kcal} kcal)`).join("\n")
    ),
    ``,
    `LISTA DE COMPRAS SEMANAL`,
    ...plan.shoppingList.map((s) => `  - ${s.name}  ${(s.gramsWeek / 1000).toFixed(2)} kg`),
  ].join("\n");
  const blob = new Blob([txt], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "dieta-elite-vrumfit.txt"; a.click();
  URL.revokeObjectURL(url);
}

async function exportPdf(plan: DietPlan, goal: string, studentName: string) {
  const data: DietPDFData = {
    studentName,
    dayLabel: "Plano diário",
    water: `${plan.waterMl} ml`,
    goldenTip: `Objetivo: ${goal.replace("_", " ")}. Mastigue bem, prefira alimentos naturais e siga os horários.`,
    meals: plan.meals.map((m, i) => ({
      number: i + 1,
      title: m.title,
      timeRange: m.time,
      foods: m.items.map((it) => `${it.food.name} (${it.grams}g)`).join(" + "),
      amount: `${m.totals.kcal} kcal · P${m.totals.p} C${m.totals.c} G${m.totals.f}`,
      substitutions: m.substitutionsByItem.flat().slice(0, 6).join(" · ") || "—",
      observation: "Hidrate-se ao longo da refeição.",
    })),
  };
  const blob = await generateDietPDFBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dieta-elite-vrumfit.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
