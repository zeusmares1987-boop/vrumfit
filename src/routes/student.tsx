import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dumbbell, Apple, Target, Camera, CalendarDays, TrendingUp,
  CheckCircle2, Store, FolderOpen, Bell, User, Settings,
  ChevronRight, Crown, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { DashboardHome, type DashboardModule, type DashboardStat } from "@/components/DashboardHome";
import { WeekFrequency } from "@/components/WeekFrequency";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import avatarOwnerAsset from "@/assets/avatar-owner.jpg.asset.json";
import headerGymAsset from "@/assets/header-gym.jpg.asset.json";
import tileTreinosAsset from "@/assets/tile-treinos.jpg.asset.json";
import tileDietaAsset from "@/assets/tile-dieta.jpg.asset.json";
import tileExecucaoAsset from "@/assets/tile-execucao.jpg.asset.json";
import tileAvaliacoesAsset from "@/assets/tile-avaliacoes.jpg.asset.json";
import tileProgressoAsset from "@/assets/tile-progresso.jpg.asset.json";
import tileLojaAsset from "@/assets/tile-loja.jpg.asset.json";
import tileArquivosAsset from "@/assets/tile-arquivos.jpg.asset.json";
import tileAvisosAsset from "@/assets/tile-avisos.jpg.asset.json";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Meu treino — VRUMFIT PERSONAL" }] }),
  component: () => (
    <RequireAuth allow={["aluno", "personal", "dono"]}>
      <StudentPage />
    </RequireAuth>
  ),
});

const studentModules: DashboardModule[] = [
  { icon: Dumbbell, title: "Meu Treino", description: "Veja séries, cargas e descanso", to: "/treinos", image: tileTreinosAsset.url },
  { icon: Apple, title: "Dieta", description: "Plano alimentar do dia", to: "/dieta", image: tileDietaAsset.url },
  { icon: Target, title: "Execução", description: "Aprenda o movimento certo", to: "/biblioteca", image: tileExecucaoAsset.url },
  { icon: Camera, title: "Avaliação", description: "Fotos, medidas e histórico", to: "/avaliacoes", image: tileAvaliacoesAsset.url },
  { icon: CalendarDays, title: "Agenda", description: "Seus horários de treino", to: "/agenda", image: headerGymAsset.url },
  { icon: TrendingUp, title: "Progresso", description: "Sua evolução em gráficos", to: "/evolucao", image: tileProgressoAsset.url },
  { icon: CheckCircle2, title: "Histórico", description: "Treinos concluídos", to: "/historico", image: headerGymAsset.url },
  
  { icon: FolderOpen, title: "Arquivos", description: "Materiais do personal", to: "/arquivos", image: tileArquivosAsset.url },
  { icon: Bell, title: "Avisos", description: "Recados importantes", to: "/avisos", image: tileAvisosAsset.url },
  { icon: User, title: "Perfil", description: "Seus dados e preferências", to: "/config", image: headerGymAsset.url },
  { icon: Settings, title: "Configurações", description: "Ajustes da conta", to: "/config", image: headerGymAsset.url },
];


function StudentPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
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
    onError: (error: Error) => toast.error(error.message || "Falha ao reivindicar."),
  });

  const { data: stats } = useQuery({
    queryKey: ["student-stats", user?.id],
    queryFn: async () => {
      if (!user) return { week: 0, month: 0, lastDays: null as number | null };
      const now = new Date();
      const dow = now.getDay();
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - dow); weekStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const iso = (d: Date) => d.toISOString().slice(0, 10);

      const [{ count: week }, { count: month }, { data: last }] = await Promise.all([
        supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("student_id", user.id).gte("session_date", iso(weekStart)),
        supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("student_id", user.id).gte("session_date", iso(monthStart)),
        supabase.from("workout_sessions").select("session_date").eq("student_id", user.id).order("session_date", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const lastDays = last?.session_date
        ? Math.floor((now.getTime() - new Date(last.session_date).getTime()) / 86400000)
        : null;
      return { week: week ?? 0, month: month ?? 0, lastDays };
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

  const studentStats: DashboardStat[] = [
    { icon: Dumbbell, label: "Treinos", value: String(stats?.week ?? 0), hint: "Nesta semana", trend: "" },
    { icon: CheckCircle2, label: "Concluídos", value: String(stats?.month ?? 0), hint: "No mês", trend: "" },
    { icon: TrendingUp, label: "Último", value: stats?.lastDays == null ? "—" : stats.lastDays === 0 ? "Hoje" : `${stats.lastDays}d`, hint: "Atrás", trend: "" },
  ];

  return (
    <AppShell hideHeader>
      <DashboardHome
        name={firstName}
        roleLabel="Aluno"
        modeLabel="Modo treino"
        subtitle="Seu treino, sua dieta e sua evolução"
        avatarUrl={avatarOwnerAsset.url}
        heroImageUrl={headerGymAsset.url}
        searchPlaceholder="Buscar treino, dieta, execução..."
        filters={["Visão geral", "Hoje", "Semana", "Treino", "Dieta"]}
        stats={studentStats}
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

            <WeekFrequency />
          </div>
        )}
      />
    </AppShell>
  );
}

