/**
 * plan-gate — Fase 4 do Cérebro VrumFit.
 * Determina o que o aluno pode fazer com base no plano ativo.
 *
 * Regra:
 * - Aluno vinculado a um personal: herda o plano do personal.
 * - Caso contrário: usa o próprio plano.
 * - Sem plano ativo: pode gerar (preview), mas não salvar no perfil.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type PlanGate = {
  canSaveDiet: boolean;
  canSaveWorkout: boolean;
  planName: string | null;
  isLinkedToPro: boolean;
  reason: string | null;
};

const EMPTY: PlanGate = {
  canSaveDiet: false,
  canSaveWorkout: false,
  planName: null,
  isLinkedToPro: false,
  reason: "Sem plano ativo — você pode gerar, mas precisa de um plano para salvar no perfil.",
};

export function usePlanGate(): { gate: PlanGate; isLoading: boolean } {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["plan-gate", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async (): Promise<PlanGate> => {
      if (!user) return EMPTY;

      // 1) Vínculo com personal
      const { data: stu } = await supabase
        .from("students")
        .select("personal_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const ownerId = stu?.personal_id ?? user.id;
      const isLinkedToPro = !!stu?.personal_id && stu.personal_id !== user.id;

      // 2) Plano ativo (do personal, se houver; senão do próprio)
      const { data: plan } = await supabase
        .rpc("current_plan", { _uid: ownerId });

      const p = plan as { name?: string; can_generate_diet?: boolean; can_generate_workout?: boolean } | null;
      if (!p) {
        return { ...EMPTY, isLinkedToPro };
      }
      return {
        canSaveDiet: !!p.can_generate_diet,
        canSaveWorkout: !!p.can_generate_workout,
        planName: p.name ?? null,
        isLinkedToPro,
        reason: (!p.can_generate_diet || !p.can_generate_workout)
          ? `Plano ${p.name ?? "atual"} não inclui esta função.`
          : null,
      };
    },
  });
  return { gate: data ?? EMPTY, isLoading };
}
