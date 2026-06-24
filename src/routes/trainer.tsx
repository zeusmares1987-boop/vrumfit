import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Dumbbell, Camera, CalendarDays, CheckCircle2, TrendingUp, ClipboardList } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { DashboardHome, type DashboardModule, type DashboardStat } from "@/components/DashboardHome";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import avatarOwnerAsset from "@/assets/avatar-owner.jpg.asset.json";
import headerGymAsset from "@/assets/header-gym.jpg.asset.json";
import tileAlunosAsset from "@/assets/tile-alunos.jpg.asset.json";
import tileAvaliacoesAsset from "@/assets/tile-avaliacoes.jpg.asset.json";
import tileProgressoAsset from "@/assets/tile-progresso.jpg.asset.json";
import tileTreinosAsset from "@/assets/tile-treinos.jpg.asset.json";

export const Route = createFileRoute("/trainer")({
  head: () => ({ meta: [{ title: "Painel do Personal — VRUMFIT PERSONAL" }] }),
  component: () => (
    <RequireAuth allow={["personal", "dono"]}>
      <TrainerPage />
    </RequireAuth>
  ),
});

const trainerModules: DashboardModule[] = [
  { icon: Users, title: "Alunos", description: "Cadastro e acompanhamento", to: "/alunos", image: tileAlunosAsset.url },
  { icon: Dumbbell, title: "Treinos", description: "Fichas e exercícios", to: "/treinos", image: tileTreinosAsset.url },
  { icon: Camera, title: "Avaliação", description: "Fotos e resultados", to: "/avaliacoes", image: tileAvaliacoesAsset.url },
  { icon: CalendarDays, title: "Agenda", description: "Aulas e compromissos", to: "/agenda" },
  { icon: CheckCircle2, title: "Presença", description: "Check-in e frequência", to: "/historico" },
  { icon: TrendingUp, title: "Progresso", description: "Evolução dos alunos", to: "/evolucao", image: tileProgressoAsset.url },
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
      if (!user) return { students: 0, todaySessions: 0, pendingAssessments: 0, notices: 0 };
      const today = new Date().toISOString().slice(0, 10);
      const ninetyAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

      let studentsQuery = supabase.from("students").select("user_id").eq("status", "ativo");
      let noticesQuery = supabase.from("notices").select("id", { count: "exact", head: true }).eq("status", "ativo");
      if (role === "personal") {
        studentsQuery = studentsQuery.eq("personal_id", user.id);
        noticesQuery = noticesQuery.eq("personal_id", user.id);
      }

      const [{ data: studentRows }, notices] = await Promise.all([studentsQuery, noticesQuery]);
      const studentIds = (studentRows ?? []).map((s) => s.user_id);

      const [todaySessions, recentAssessments] = await Promise.all([
        studentIds.length
          ? supabase.from("workout_sessions").select("id", { count: "exact", head: true }).in("student_id", studentIds).eq("session_date", today)
          : Promise.resolve({ count: 0 }),
        studentIds.length
          ? supabase.from("assessments").select("student_id").in("student_id", studentIds).gte("date", ninetyAgo)
          : Promise.resolve({ data: [] as { student_id: string }[] }),
      ]);

      const recentSet = new Set((recentAssessments.data ?? []).map((a) => a.student_id));
      const pending = studentIds.filter((id) => !recentSet.has(id)).length;

      return {
        students: studentIds.length,
        todaySessions: todaySessions.count ?? 0,
        pendingAssessments: pending,
        notices: notices.count ?? 0,
      };
    },
    enabled: !!user,
  });

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "Professor";
  const trainerStats: DashboardStat[] = [
    { icon: Users, label: "Alunos", value: String(dashboard?.students ?? 0), hint: "Ativos" },
    { icon: Dumbbell, label: "Treinos Hoje", value: String(dashboard?.todaySessions ?? 0), hint: "Concluídos" },
    { icon: ClipboardList, label: "Avaliações", value: String(dashboard?.pendingAssessments ?? 0), hint: "Pendentes" },
  ];

  return (
    <AppShell hideHeader>
      <DashboardHome
        name={firstName}
        roleLabel="Personal"
        modeLabel="Modo professor"
        subtitle="Gerencie alunos, treinos e evolução."
        avatarUrl={profile?.avatar_url || avatarOwnerAsset.url}
        heroImageUrl={headerGymAsset.url}
        searchPlaceholder="Buscar alunos, treinos, dietas..."
        stats={trainerStats}
        modules={trainerModules}
        notifCount={dashboard?.notices ?? 0}
      />
    </AppShell>
  );
}
