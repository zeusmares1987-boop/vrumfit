import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Dumbbell, Apple, CalendarDays, Camera, CheckCircle2,
  Target, TrendingUp, Store, ShoppingBag, FolderOpen, Settings,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { DashboardHome, type DashboardModule, type DashboardStat } from "@/components/DashboardHome";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import avatarOwnerAsset from "@/assets/avatar-owner.jpg.asset.json";
import headerGymAsset from "@/assets/header-gym.jpg.asset.json";
import tileAlunosAsset from "@/assets/tile-alunos.jpg.asset.json";
import tileTreinosAsset from "@/assets/tile-treinos.jpg.asset.json";
import tileDietaAsset from "@/assets/tile-dieta.jpg.asset.json";
import tileAvaliacoesAsset from "@/assets/tile-avaliacoes.jpg.asset.json";
import tileBibliotecaAsset from "@/assets/tile-biblioteca.jpg.asset.json";
import tileProgressoAsset from "@/assets/tile-progresso.jpg.asset.json";
import tileLojaAsset from "@/assets/tile-loja.jpg.asset.json";
import tileProdutosAsset from "@/assets/tile-produtos.jpg.asset.json";
import tileArquivosAsset from "@/assets/tile-arquivos.jpg.asset.json";

export const Route = createFileRoute("/trainer")({
  head: () => ({ meta: [{ title: "Painel do Personal — VRUMFIT PERSONAL" }] }),
  component: () => (
    <RequireAuth allow={["personal", "dono"]}>
      <TrainerPage />
    </RequireAuth>
  ),
});

const trainerModules: DashboardModule[] = [
  { icon: Users, title: "Alunos", description: "Lista, fichas e acompanhamento", to: "/alunos", image: tileAlunosAsset.url },
  { icon: Dumbbell, title: "Treinos", description: "Monte e ajuste prescrições", to: "/treinos", image: tileTreinosAsset.url },
  { icon: Apple, title: "Dieta", description: "Planos alimentares e ajustes", to: "/dieta", image: tileDietaAsset.url },
  { icon: Camera, title: "Avaliação", description: "Fotos, medidas e evolução", to: "/avaliacoes", image: tileAvaliacoesAsset.url },
  { icon: CalendarDays, title: "Agenda", description: "Horários e compromissos", to: "/agenda", image: headerGymAsset.url },
  { icon: CheckCircle2, title: "Presença", description: "Check-ins dos alunos", to: "/agenda", image: headerGymAsset.url },
  { icon: Target, title: "Execução", description: "Biblioteca de exercícios", to: "/biblioteca", image: tileBibliotecaAsset.url },
  { icon: TrendingUp, title: "Progresso", description: "Resultados e gráficos", to: "/evolucao", image: tileProgressoAsset.url },
  { icon: FolderOpen, title: "Arquivos", description: "Materiais dos alunos", to: "/arquivos", image: tileArquivosAsset.url },
  { icon: Settings, title: "Configurações", description: "Perfil e preferências", to: "/config", image: headerGymAsset.url },
];

function TrainerPage() {
  const { user, role } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: dashboard } = useQuery({
    queryKey: ["trainer-dashboard-real", user?.id, role],
    queryFn: async () => {
      if (!user) return { students: 0, workouts: 0, presence: 0, notices: 0 };
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const since = new Date(Date.now() - 30 * 86400000).toISOString();

      let studentsQuery = supabase.from("students").select("user_id").eq("status", "ativo");
      let workoutsQuery = supabase.from("workouts").select("id", { count: "exact", head: true }).eq("status", "ativo");
      let noticesQuery = supabase.from("notices").select("id", { count: "exact", head: true }).eq("status", "ativo").gte("created_at", since);

      if (role === "personal") {
        studentsQuery = studentsQuery.eq("personal_id", user.id);
        workoutsQuery = workoutsQuery.eq("personal_id", user.id);
        noticesQuery = noticesQuery.eq("personal_id", user.id);
      }

      const [{ data: studentRows }, workouts, notices] = await Promise.all([
        studentsQuery,
        workoutsQuery,
        noticesQuery,
      ]);
      const studentIds = (studentRows ?? []).map((student) => student.user_id);
      const { data: sessions } = studentIds.length
        ? await supabase
          .from("workout_sessions")
          .select("student_id")
          .in("student_id", studentIds)
          .gte("session_date", weekStart.toISOString().slice(0, 10))
        : { data: [] };
      const presentStudents = new Set((sessions ?? []).map((session) => session.student_id)).size;

      return {
        students: studentIds.length,
        workouts: workouts.count ?? 0,
        presence: studentIds.length ? Math.round((presentStudents / studentIds.length) * 100) : 0,
        notices: notices.count ?? 0,
      };
    },
    enabled: !!user,
  });

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "Professor";
  const trainerStats: DashboardStat[] = [
    { icon: Users, label: "Alunos", value: String(dashboard?.students ?? 0), hint: "Ativos", trend: "" },
    { icon: Dumbbell, label: "Treinos", value: String(dashboard?.workouts ?? 0), hint: "Ativos", trend: "" },
    { icon: CheckCircle2, label: "Presença", value: `${dashboard?.presence ?? 0}%`, hint: "Semana", trend: "" },
  ];

  return (
    <AppShell hideHeader>
      <DashboardHome
        name={firstName}
        roleLabel="Personal"
        modeLabel="Modo professor"
        subtitle="Gerencie alunos, treinos e resultados"
        avatarUrl={profile?.avatar_url || avatarOwnerAsset.url}
        heroImageUrl={headerGymAsset.url}
        searchPlaceholder="Buscar alunos, treinos, avaliações..."
        stats={trainerStats}
        modules={trainerModules}
        notifCount={dashboard?.notices ?? 0}
      />
    </AppShell>
  );
}
