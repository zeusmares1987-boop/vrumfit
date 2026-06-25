import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Kind = "diet" | "workout";

function fmt(d: string) {
  const x = new Date(d);
  return x.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function LastSavedBadge({ kind }: { kind: Kind }) {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["last-saved", kind, user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      if (!user) return null;
      const table = kind === "diet" ? "diets" : "workouts";
      const { data } = await supabase
        .from(table)
        .select("id,name,created_at")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
  if (!data) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-card/50 px-4 py-2.5 text-[11px] flex items-center justify-between gap-3">
      <span className="text-muted-foreground">
        Último {kind === "diet" ? "plano de dieta" : "treino"} salvo:
      </span>
      <span className="font-semibold text-foreground truncate">
        {data.name} <span className="text-muted-foreground font-normal">· {fmt(data.created_at)}</span>
      </span>
    </div>
  );
}
