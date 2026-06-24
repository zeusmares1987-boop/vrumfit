import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dumbbell, Apple, Target, CalendarDays, TrendingUp, CheckCircle2,
  ChevronRight, Crown, ClipboardList, Flame, Clock, BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { DashboardHome, type DashboardModule } from "@/components/DashboardHome";
import { WeekFrequency } from "@/components/WeekFrequency";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import avatarOwnerAsset from "@/assets/avatar-owner.jpg.asset.json";
import heroStudentAsset from "@/assets/hero/hero-student.jpg.asset.json";
import tileDietaAsset from "@/assets/tile-dieta.jpg.asset.json";
import tileExecucaoAsset from "@/assets/tile-execucao.jpg.asset.json";
import tileProgressoAsset from "@/assets/tile-progresso.jpg.asset.json";
import tileTreinosAsset from "@/assets/tile-treinos.jpg.asset.json";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Meu treino — VRUMFIT PERSONAL" }] }),
  component: () => (
    <RequireAuth allow={["aluno", "personal", "dono"]}>
      <StudentPage />
    </RequireAuth>
  ),
});

const studentModules: DashboardModule[] = [
  { icon: Dumbbell, title: "Meu Treino", description: "Séries e exercícios", to: "/treinos", image: tileTreinosAsset.url },
  { icon: Apple, title: "Dieta", description: "Refeições e água", to: "/dieta", image: tileDietaAsset.url },
  { icon: Target, title: "Execução", description: "Como fazer certo", to: "/biblioteca", image: tileExecucaoAsset.url },
  { icon: CalendarDays, title: "Agenda", description: "Aulas e horários", to: "/agenda" },
  { icon: TrendingUp, title: "Progresso", description: "Sua evolução", to: "/evolucao", image: tileProgressoAsset.url },
  { icon: CheckCircle2, title: "Check-in", description: "Registrar presença", to: "/historico" },
];

function StudentPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: anamnese } = useQuery({
    queryKey: ["my-anamnese", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("anamneses").select("completed_at").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: hasOwner, refetch: refetchHasOwner } = useQuery({
    queryKey: ["has-owner"],
    queryFn: async () => {
      const { count } = await supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "dono");
      return (count ?? 0) > 0;
    },
  });

  const claim = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_ownership");
      if (error) throw error;
      return data;
    },
    onSuccess: async (ok) => {
      if (ok) {
        toast.success("Você agora é o Dono! Recarregando...");
        await refetchHasOwner();
        setTimeout(() => window.location.assign("/owner"), 700);
      } else {
        toast.error("Já existe um dono cadastrado.");
      }
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao reivindicar."),
  });

  const { data: todayWorkout } = useQuery({
    queryKey: ["student-today-workout", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("workouts")
        .select("id,name,duration_min")
        .eq("student_id", user.id)
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as { id: string; name: string | null; duration_min: number | null } | null;
    },
    enabled: !!user,
  });

  const { data: trainer } = useQuery({
    queryKey: ["my-trainer", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: link } = await supabase
        .from("students")
        .select("personal_id")
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .maybeSingle();
      if (!link?.personal_id) return null;
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name,cref,phone,avatar_url")
        .eq("id", link.personal_id)
        .maybeSingle();
      return prof as { full_name: string | null; cref: string | null; phone: string | null; avatar_url: string | null } | null;
    },
    enabled: !!user,
  });

  const { data: notifCount } = useQuery({
    queryKey: ["student-notif-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { count } = await supabase
        .from("notices")
        .select("id", { count: "exact", head: true })
        .eq("status", "ativo")
        .gte("created_at", since)
        .or(`audience.in.(todos,alunos),target_user_id.eq.${user.id}`);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "Aluno";

  return (
    <AppShell hideHeader>
      <DashboardHome
        name={firstName}
        roleLabel="Aluno"
        modeLabel="Modo treino"
        subtitle="Acompanhe seu treino e sua evolução."
        avatarUrl={profile?.avatar_url || avatarOwnerAsset.url}
        heroImageUrl={heroStudentAsset.url}
        searchPlaceholder="Buscar treino, dieta, exercícios..."
        stats={[]}
        modules={studentModules}
        notifCount={notifCount ?? 0}
        alerts={(
          <div className="space-y-3">
            {hasOwner === false && (
              <button onClick={() => claim.mutate()} disabled={claim.isPending}
                className="flex w-full items-center gap-3 rounded-2xl border border-primary/50 bg-primary/10 p-3 text-left transition hover:bg-primary/15 disabled:opacity-60">
                <div className="grid size-10 place-items-center rounded-xl border border-primary/50 bg-primary/20 text-primary">
                  <Crown className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-primary">Sou o Dono deste app</p>
                  <p className="text-[11px] text-muted-foreground">Toque para virar Proprietário.</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-primary" />
              </button>
            )}

            {anamnese !== undefined && !anamnese?.completed_at && (
              <Link to="/anamnese" className="flex w-full items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-3 transition hover:bg-primary/15">
                <div className="grid size-10 place-items-center rounded-xl border border-primary/50 bg-primary/20 text-primary">
                  <ClipboardList className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-primary">Preencha sua anamnese</p>
                  <p className="text-[11px] text-muted-foreground">Ajuda seu personal a montar o melhor treino.</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-primary" />
              </Link>
            )}
          </div>
        )}
        beforeStats={(
          <div className="space-y-3">
            <WeekFrequency />
            {trainer && (
              <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                  <BadgeCheck className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Meu professor</p>
                  <p className="truncate text-[14px] font-extrabold text-foreground">{trainer.full_name ?? "—"}</p>
                  <p className="truncate text-[11px] text-muted-foreground">CREF: {trainer.cref?.trim() || "não informado"}</p>
                </div>
              </div>
            )}
            {todayWorkout && (
              <Link to="/treinos" className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card/70 p-3 backdrop-blur-sm transition hover:border-primary/55">
                <div className="grid size-14 shrink-0 place-items-center rounded-full border border-primary/50 bg-primary/10 text-primary">
                  <Dumbbell className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-extrabold text-foreground">Treino de Hoje</p>
                  <p className="truncate text-[12px] text-muted-foreground">{todayWorkout.name ?? "Sem nome"}</p>
                  {todayWorkout.duration_min && (
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="size-3 text-primary" />{todayWorkout.duration_min} min</span>
                      <span className="inline-flex items-center gap-1"><Flame className="size-3 text-primary" />~{Math.round(todayWorkout.duration_min * 9)} kcal</span>
                    </div>
                  )}
                </div>
                <span className="ml-1 hidden shrink-0 rounded-xl bg-primary px-3 py-2 text-[12px] font-bold text-primary-foreground sm:inline-block">Iniciar</span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            )}
          </div>
        )}
      />
    </AppShell>
  );
}
