/**
 * student-context — Fase 2 do Cérebro VrumFit.
 * Lê profile + students + anamnese + última avaliação para pré-popular
 * os formulários de Dieta e Treinos com dados reais do aluno.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type StudentContext = {
  sex: "M" | "F" | null;
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  objective: string | null; // workout_objective enum
  activityFactor: number | null;
  goalDiet: "cutting_agressivo" | "cutting" | "manutencao" | "bulking_limpo" | "bulking" | null;
  goalWorkout: "hipertrofia" | "emagrecimento" | "forca" | "condicionamento" | "saude" | "manutencao" | null;
  level: "iniciante" | "intermediario" | "avancado" | null;
};

function yearsBetween(birth: string | null | undefined): number | null {
  if (!birth) return null;
  const d = new Date(birth);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.max(10, Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
}

function mapObjectiveToDiet(obj: string | null): StudentContext["goalDiet"] {
  switch (obj) {
    case "emagrecimento": return "cutting";
    case "hipertrofia": return "bulking_limpo";
    case "forca": return "manutencao";
    case "condicionamento": return "manutencao";
    case "saude": return "manutencao";
    case "manutencao": return "manutencao";
    default: return null;
  }
}

function mapObjectiveToWorkout(obj: string | null): StudentContext["goalWorkout"] {
  if (!obj) return null;
  return obj as StudentContext["goalWorkout"];
}

function inferActivity(history: string | null | undefined): number | null {
  if (!history) return null;
  const h = history.toLowerCase();
  if (/sedent/.test(h)) return 1.2;
  if (/(leve|raramente|1.*sem|2.*sem)/.test(h)) return 1.375;
  if (/(moder|3.*sem|4.*sem|5.*sem)/.test(h)) return 1.55;
  if (/(intens|6.*sem|7.*sem|diari)/.test(h)) return 1.725;
  if (/(atleta|profission)/.test(h)) return 1.9;
  return null;
}

function inferLevel(history: string | null | undefined): StudentContext["level"] {
  if (!history) return null;
  const h = history.toLowerCase();
  if (/(iniciant|nunca|primeira vez|começ)/.test(h)) return "iniciante";
  if (/(avanc|atleta|competidor|anos.*treino|10.*ano|5.*ano)/.test(h)) return "avancado";
  if (/(intermedi|alguns meses|1.*ano|2.*ano)/.test(h)) return "intermediario";
  return null;
}

export function useStudentContext(): { ctx: StudentContext; isLoading: boolean } {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["student-context", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<StudentContext> => {
      if (!user) return emptyCtx();
      const [stu, ana, ass] = await Promise.all([
        supabase.from("students").select("birth_date,height_cm,weight_kg,objective").eq("user_id", user.id).maybeSingle(),
        supabase.from("anamneses").select("activity_history,goal,sex,activity_factor,experience_level").eq("user_id", user.id).maybeSingle(),
        supabase.from("assessments").select("weight_kg,height_cm,date").eq("student_id", user.id).order("date", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const s = stu.data;
      const a = ana.data as any;
      const av = ass.data;
      const obj = (s?.objective as string | null) ?? null;
      return {
        sex: (a?.sex as "M" | "F" | null) ?? null,
        age: yearsBetween(s?.birth_date) ?? null,
        weightKg: (av?.weight_kg as number | null) ?? (s?.weight_kg as number | null) ?? null,
        heightCm: (av?.height_cm as number | null) ?? (s?.height_cm as number | null) ?? null,
        objective: obj,
        activityFactor: (a?.activity_factor as number | null) ?? inferActivity(a?.activity_history),
        goalDiet: mapObjectiveToDiet(obj),
        goalWorkout: mapObjectiveToWorkout(obj),
        level: (a?.experience_level as StudentContext["level"]) ?? inferLevel(a?.activity_history),
      };
    },
  });
  return { ctx: data ?? emptyCtx(), isLoading };
}

function emptyCtx(): StudentContext {
  return {
    sex: null, age: null, weightKg: null, heightCm: null, objective: null,
    activityFactor: null, goalDiet: null, goalWorkout: null, level: null,
  };
}
