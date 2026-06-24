import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, User, ClipboardList, Wallet, Settings, GraduationCap } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { DashboardHome, type DashboardModule, type DashboardStat } from "@/components/DashboardHome";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import avatarOwnerAsset from "@/assets/avatar-owner.jpg.asset.json";
import headerGymAsset from "@/assets/header-gym.jpg.asset.json";
import tileAlunosAsset from "@/assets/tile-alunos.jpg.asset.json";
import tileFinanceiroAsset from "@/assets/tile-financeiro.jpg.asset.json";
import tilePlanosAsset from "@/assets/tile-planos.jpg.asset.json";
import tileProfessoresAsset from "@/assets/tile-professores.jpg.asset.json";
import tileUsuariosAsset from "@/assets/tile-usuarios.jpg.asset.json";


export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Painel do Proprietário — VRUMFIT PERSONAL" },
      { name: "description", content: "Controle total do seu negócio." },
    ],
  }),
  component: () => (
    <RequireAuth allow={["dono"]}>
      <OwnerPage />
    </RequireAuth>
  ),
});

const ownerModules: DashboardModule[] = [
  { icon: Users, title: "Usuários", description: "Gerencie acessos", to: "/personais", image: tileUsuariosAsset.url },
  { icon: User, title: "Professores", description: "Equipe e gestão", to: "/trainer", image: tileProfessoresAsset.url },
  { icon: GraduationCap, title: "Alunos", description: "Alunos e matrículas", to: "/alunos", image: tileAlunosAsset.url },
  { icon: ClipboardList, title: "Planos", description: "Assinaturas ativas", to: "/planos", image: tilePlanosAsset.url },
  { icon: Wallet, title: "Financeiro", description: "Receitas e relatórios", to: "/financeiro", image: tileFinanceiroAsset.url },
  { icon: Settings, title: "Configurações", description: "Regras do sistema", to: "/config" },
];

function OwnerPage() {
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

  const { data: dashboard } = useQuery({
    queryKey: ["owner-dashboard-real"],
    queryFn: async () => {
      const [trainers, students, plans, notices] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "personal"),
        supabase.from("students").select("user_id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("plans").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("notices").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      ]);
      return {
        trainers: trainers.count ?? 0,
        students: students.count ?? 0,
        plans: plans.count ?? 0,
        notices: notices.count ?? 0,
      };
    },
    enabled: !!user,
  });

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "Proprietário";
  const ownerStats: DashboardStat[] = [
    { icon: Users, label: "Professores", value: String(dashboard?.trainers ?? 0), hint: "Ativos" },
    { icon: User, label: "Alunos", value: String(dashboard?.students ?? 0), hint: "Matriculados" },
    { icon: ClipboardList, label: "Planos", value: String(dashboard?.plans ?? 0), hint: "Ativos" },
  ];

  return (
    <AppShell hideHeader>
      <DashboardHome
        name={firstName}
        roleLabel="Proprietário"
        modeLabel="Modo gestor"
        subtitle="Controle total do seu negócio."
        avatarUrl={profile?.avatar_url || avatarOwnerAsset.url}
        heroImageUrl={headerGymAsset.url}
        
        searchPlaceholder="Buscar módulos, usuários, produtos..."
        stats={ownerStats}
        modules={ownerModules}
        notifCount={dashboard?.notices ?? 0}
      />
    </AppShell>
  );
}
