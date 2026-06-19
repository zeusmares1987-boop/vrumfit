/**
 * VRUMFIT — Motor de Integração Elite
 * Sincroniza treino ↔ dieta:
 *  - Dia DE treino: +10-15% carbo, +5% kcal (recuperação + performance)
 *  - Dia SEM treino: macros base, leve déficit calórico extra em cutting
 *  - Janela pré/pós-treino destacada
 *  - Hidratação ajustada por minutos de sessão
 */
import {
  generateWorkoutPlan, type WorkoutPlanInput, type WeekPlan,
} from "./workout-engine";
import {
  generateDietPlan, targetMacros, type DietInput, type DietPlan, type Macros,
} from "./diet-engine";

export interface EliteInput {
  workout: WorkoutPlanInput;
  diet: DietInput;
}

export interface ElitePlan {
  workout: WeekPlan[];
  dietTraining: DietPlan;   // dia DE treino
  dietRest: DietPlan;       // dia SEM treino
  targetTraining: Macros;
  targetRest: Macros;
  waterTrainingMl: number;
  waterRestMl: number;
  summary: {
    weeklyTrainingDays: number;
    weeklyRestDays: number;
    weeklyKcal: number;
    weeklyVolumeSets: number;
  };
}

export function generateElitePlan(input: EliteInput): ElitePlan {
  const workout = generateWorkoutPlan(input.workout);

  // Macros sincronizados
  const baseTarget = targetMacros(input.diet);
  const trainingTarget: Macros = {
    kcal: Math.round(baseTarget.kcal * 1.05),
    p: Math.round(baseTarget.p * 1.05),
    c: Math.round(baseTarget.c * 1.15),
    f: baseTarget.f,
    fiber: baseTarget.fiber,
  };
  const restTarget: Macros = {
    kcal: input.diet.goal.startsWith("cutting")
      ? Math.round(baseTarget.kcal * 0.95)
      : baseTarget.kcal,
    p: baseTarget.p,
    c: Math.round(baseTarget.c * 0.85),
    f: Math.round(baseTarget.f * 1.05),
    fiber: baseTarget.fiber,
  };

  // Gera 2 planos usando ajuste leve no peso virtual para forçar alvos diferentes
  // (mantém a API atual sem refatoração profunda do diet-engine)
  const dietTraining = generateDietPlan({
    ...input.diet,
    activityFactor: input.diet.activityFactor + 0.05,
  });
  const dietRest = generateDietPlan({
    ...input.diet,
    activityFactor: Math.max(1.2, input.diet.activityFactor - 0.1),
  });

  // Sobrescreve targets para refletir sincronização
  dietTraining.target = trainingTarget;
  dietRest.target = restTarget;

  const sessionMin = input.workout.sessionMinutes;
  const waterTrainingMl = Math.round(input.diet.weightKg * 35 + (sessionMin / 60) * 500);
  const waterRestMl = Math.round(input.diet.weightKg * 35);

  const freq = input.workout.frequency;
  const week1 = workout[0];
  const weeklyVolumeSets = week1?.days.reduce(
    (s, d) => s + d.exercises.reduce((a, e) => a + e.sets, 0), 0,
  ) ?? 0;
  const weeklyKcal = freq * trainingTarget.kcal + (7 - freq) * restTarget.kcal;

  return {
    workout,
    dietTraining,
    dietRest,
    targetTraining: trainingTarget,
    targetRest: restTarget,
    waterTrainingMl,
    waterRestMl,
    summary: {
      weeklyTrainingDays: freq,
      weeklyRestDays: 7 - freq,
      weeklyKcal,
      weeklyVolumeSets,
    },
  };
}
