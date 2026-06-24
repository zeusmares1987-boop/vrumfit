/**
 * VRUMFIT — Library Loader
 * Carrega alimentos (1471) e exercícios (1014) do banco e registra como
 * pool extra nos engines. Aumenta variedade de substituições sem alterar
 * a lógica de prescrição (que continua na LIBRARY/FOODS curada).
 *
 * Idempotente. Roda 1x na inicialização do app.
 */
import { supabase } from "@/integrations/supabase/client";
import { registerExtraFoods } from "./diet-engine";
import { registerExtraExercises } from "./workout-engine";
import type { FoodItem } from "./diet-engine";
import type { MuscleGroup } from "./workout-engine";

let loaded = false;

function mapFoodCategory(category: string | null): FoodItem["group"] | null {
  if (!category) return null;
  const c = category.toLowerCase();
  if (c.includes("proteína") || c.includes("proteina")) return "proteina";
  if (c.includes("carbo")) return "carbo";
  if (c.includes("fruta")) return "fruta";
  if (c.includes("verdura") || c.includes("legume")) return "vegetal";
  if (c.includes("laticí") || c.includes("latici")) return "leite";
  if (c.includes("gordura")) return "gordura";
  return null; // Bebidas / Refeição → ignora (não casa com slot blueprint)
}

function mapExerciseCategory(slug: string | null): MuscleGroup | null {
  if (!slug) return null;
  const map: Record<string, MuscleGroup> = {
    peito: "peito",
    costas: "costas",
    biceps: "biceps",
    triceps: "triceps",
    ombros: "ombro",
    pernas: "quadriceps",
    abdomen: "core",
    cardio: "core",
    funcional: "core",
    mobilidade: "core",
  };
  return map[slug] ?? null;
}

export async function loadDbLibraries(): Promise<{ foods: number; exercises: number }> {
  if (loaded) return { foods: 0, exercises: 0 };
  loaded = true;

  try {
    const [foodsRes, exRes] = await Promise.all([
      supabase.from("foods").select("name, category"),
      supabase
        .from("exercises")
        .select("name, exercise_categories(slug)")
        .eq("status", "ativo"),
    ]);

    let foodsCount = 0;
    if (foodsRes.data) {
      const mapped = foodsRes.data
        .map((f) => {
          const group = mapFoodCategory(f.category);
          return group ? { name: f.name, group } : null;
        })
        .filter((x): x is { name: string; group: FoodItem["group"] } => !!x);
      registerExtraFoods(mapped);
      foodsCount = mapped.length;
    }

    let exCount = 0;
    if (exRes.data) {
      const mapped = exRes.data
        .map((e) => {
          const slug = (e.exercise_categories as { slug: string } | null)?.slug ?? null;
          const primary = mapExerciseCategory(slug);
          return primary ? { name: e.name, primary } : null;
        })
        .filter((x): x is { name: string; primary: MuscleGroup } => !!x);
      registerExtraExercises(mapped);
      exCount = mapped.length;
    }

    return { foods: foodsCount, exercises: exCount };
  } catch (err) {
    // Falha silenciosa — engines continuam funcionando só com a LIBRARY curada.
    console.warn("[library-loader] falha ao carregar pool extra:", err);
    loaded = false; // permite retry
    return { foods: 0, exercises: 0 };
  }
}
