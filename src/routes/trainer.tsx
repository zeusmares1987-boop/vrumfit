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
  { icon: Store, title: "Loja", description: "Sua loja profissional", to: "/loja-pro", image: tileLojaAsset.url },
  { icon: ShoppingBag, title: "Produtos", description: "Itens e serviços", to: "/produtos", image: tileProdutosAsset.url },
  { icon: FolderOpen, title: "Arquivos", description: "Materiais dos alunos", to: "/arquivos", image: tileArquivosAsset.url },
  { icon: Settings, title: "Configurações", description: "Perfil e preferências", to: "/config", image: headerGymAsset.url },
];

const trainerStats: DashboardStat[] = [
  { icon: Users, label: "Alunos", value: "86", hint: "Ativos", trend: "↑ 10%" },
  { icon: Dumbbell, label: "Treinos", value: "142", hint: "Montados", trend: "↑ 7%" },
  { icon: CheckCircle2, label: "Presença", value: "91%", hint: "Na semana", trend: "↑ 4%" },
];

function TrainerPage() {
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

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "Professor";

  return (
    <AppShell hideHeader>
      <DashboardHome
        name={firstName}
        roleLabel="Personal"
        modeLabel="Modo professor"
        subtitle="Gerencie alunos, treinos e resultados"
        avatarUrl={avatarOwnerAsset.url}
        heroImageUrl={headerGymAsset.url}
        searchPlaceholder="Buscar alunos, treinos, avaliações..."
        filters={["Visão geral", "Hoje", "Semana", "Alunos", "Treinos"]}
        stats={trainerStats}
        modules={trainerModules}
        notifCount={3}
      />
    </AppShell>
  );
}
