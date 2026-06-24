/**
 * plan-persistence — salva planos gerados no banco do aluno.
 * Diet: diets + diet_meals + diet_meal_items.
 * Workout: workouts + workout_days + workout_exercises (semana ativa).
 */
import { supabase } from "@/integrations/supabase/client";
import type { DietPlan, GoalDiet } from "@/lib/diet-engine";
import type { WeekPlan, Goal, Level } from "@/lib/workout-engine";

type MealKind = "cafe_manha" | "lanche_manha" | "almoco" | "lanche_tarde" | "jantar" | "ceia";

function mealKindFor(index: number, total: number): MealKind {
  if (total <= 3) return (["cafe_manha", "almoco", "jantar"][index] ?? "almoco") as MealKind;
  if (total === 4) return (["cafe_manha", "almoco", "lanche_tarde", "jantar"][index] ?? "almoco") as MealKind;
  if (total === 5) return (["cafe_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar"][index] ?? "almoco") as MealKind;
  return (["cafe_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar", "ceia"][Math.min(index, 5)]) as MealKind;
}

function mapDietObjective(g: GoalDiet): "emagrecimento" | "ganho_massa" | "manutencao" {
  if (g.startsWith("cutting")) return "emagrecimento";
  if (g.startsWith("bulking")) return "ganho_massa";
  return "manutencao";
}

export async function saveDietPlan(opts: {
  studentId: string;
  personalId?: string | null;
  plan: DietPlan;
  goal: GoalDiet;
  name?: string;
}): Promise<string> {
  const { studentId, personalId, plan, goal } = opts;
  const objective = mapDietObjective(goal);
  const { data: diet, error } = await supabase
    .from("diets")
    .insert({
      student_id: studentId,
      personal_id: personalId ?? studentId,
      name: opts.name ?? `Dieta ${objective} ${plan.target.kcal} kcal`,
      objective,
      water_liters: plan.waterMl ? plan.waterMl / 1000 : null,
      golden_tip: `TMB ${plan.bmr} kcal · GET ${plan.tdee} kcal · Meta ${plan.target.kcal} kcal`,
      notes: `Macros: P ${plan.target.p}g · C ${plan.target.c}g · G ${plan.target.f}g`,
      status: "ativo",
    })
    .select("id")
    .single();
  if (error || !diet) throw error ?? new Error("Falha ao salvar dieta");

  const total = plan.meals.length;
  for (let i = 0; i < total; i++) {
    const meal = plan.meals[i];
    const { data: m, error: me } = await supabase
      .from("diet_meals")
      .insert({
        diet_id: diet.id,
        kind: mealKindFor(i, total),
        title: meal.title,
        time_range: meal.time ?? null,
        sort_order: i,
      })
      .select("id")
      .single();
    if (me || !m) throw me ?? new Error("Falha ao salvar refeição");
    const items = meal.items.map((it, j) => ({
      meal_id: m.id,
      custom_food: it.food.name,
      amount: `${Math.round(it.grams)} g`,
      measure: it.food.measure ?? null,
      sort_order: j,
    }));
    if (items.length) {
      const { error: ie } = await supabase.from("diet_meal_items").insert(items);
      if (ie) throw ie;
    }
  }
  return diet.id;
}

function mapWorkoutSplit(freq: number): "fullbody" | "ab" | "abc" | "abcd" | "abcde" {
  if (freq <= 2) return "fullbody";
  if (freq === 3) return "abc";
  if (freq === 4) return "abcd";
  return "abcde";
}

function mapWorkoutObjective(g: Goal): "hipertrofia" | "emagrecimento" | "forca" | "condicionamento" | "saude" | "manutencao" {
  if (g === "resistencia") return "condicionamento";
  return g;
}

export async function saveWorkoutWeek(opts: {
  studentId: string;
  personalId?: string | null;
  week: WeekPlan;
  level: Level;
  goal: Goal;
  name?: string;
  exerciseIdByName?: Map<string, string>;
}): Promise<string> {
  const { studentId, personalId, week, level, goal } = opts;
  const objective = mapWorkoutObjective(goal);
  const freq = week.days.length;
  const warmupTxt = week.days.flatMap((d) => d.warmup).filter(Boolean).slice(0, 6).join(" · ");
  const aerobicTxt = week.days.map((d) => d.cardio).filter(Boolean).join(" · ");
  const { data: w, error } = await supabase
    .from("workouts")
    .insert({
      student_id: studentId,
      personal_id: personalId ?? studentId,
      name: opts.name ?? `Treino Semana ${week.week} · ${objective}`,
      objective,
      level,
      frequency_per_week: freq,
      split: mapWorkoutSplit(freq),
      warmup: warmupTxt || null,
      aerobic: aerobicTxt || null,
      stretching: null,
      status: "ativo",
    })
    .select("id")
    .single();
  if (error || !w) throw error ?? new Error("Falha ao salvar treino");

  for (let i = 0; i < week.days.length; i++) {
    const d = week.days[i];
    const { data: day, error: de } = await supabase
      .from("workout_days")
      .insert({ workout_id: w.id, label: d.name, sort_order: i })
      .select("id")
      .single();
    if (de || !day) throw de ?? new Error("Falha ao salvar dia");
    const rows = d.exercises.map((ex, j) => ({
      day_id: day.id,
      exercise_id: opts.exerciseIdByName?.get(ex.name.toLowerCase()) ?? null,
      custom_name: opts.exerciseIdByName?.has(ex.name.toLowerCase()) ? null : ex.name,
      sets: String(ex.sets),
      reps: ex.reps,
      load: ex.loadHint ?? null,
      rest: ex.rest ?? null,
      notes: `RIR ${ex.rir}${ex.substitutes.length ? ` · Subs: ${ex.substitutes.slice(0, 3).join(", ")}` : ""}`,
      sort_order: j,
    }));
    if (rows.length) {
      const { error: ee } = await supabase.from("workout_exercises").insert(rows);
      if (ee) throw ee;
    }
  }
  return w.id;
}
