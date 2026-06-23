import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Dumbbell, User, ShoppingBag, Package, CreditCard,
  Wallet, Target, Bell, FolderOpen, Settings, ShieldCheck,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { DashboardHome, type DashboardModule, type DashboardStat } from "@/components/DashboardHome";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import avatarOwnerAsset from "@/assets/avatar-owner.jpg.asset.json";
import headerGymAsset from "@/assets/header-gym.jpg.asset.json";
import tileAlunosAsset from "@/assets/tile-alunos.jpg.asset.json";
import tileProfessoresAsset from "@/assets/tile-professores.jpg.asset.json";
import tileProdutosAsset from "@/assets/tile-produtos.jpg.asset.json";
import tileLojaAsset from "@/assets/tile-loja.jpg.asset.json";
import tileFinanceiroAsset from "@/assets/tile-financeiro.jpg.asset.json";
import tilePlanosAsset from "@/assets/tile-planos.jpg.asset.json";
import tileTreinosAsset from "@/assets/tile-treinos.jpg.asset.json";
import tileAvisosAsset from "@/assets/tile-avisos.jpg.asset.json";
import tileArquivosAsset from "@/assets/tile-arquivos.jpg.asset.json";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Painel do Proprietário — VRUMFIT PERSONAL" },
      { name: "description", content: "Visão geral do seu negócio." },
    ],
  }),
  component: () => (
    <RequireAuth allow={["dono"]}>
      <OwnerPage />
    </RequireAuth>
  ),
});

const ownerModules: DashboardModule[] = [
  { icon: Users, title: "Usuários", description: "Gerencie acessos e permissões", to: "/personais", image: tileAlunosAsset.url },
  { icon: Dumbbell, title: "Professores", description: "Equipe e gestão de personais", to: "/trainer", image: tileProfessoresAsset.url },
  { icon: User, title: "Alunos", description: "Alunos, matrículas e evolução", to: "/student", image: tileAlunosAsset.url },
  { icon: ShoppingBag, title: "Loja", description: "Vendas, vitrine e pedidos", to: "/loja", image: tileLojaAsset.url },
  { icon: Package, title: "Produtos", description: "Cadastro de produtos", to: "/produtos", image: tileProdutosAsset.url },
  { icon: CreditCard, title: "Planos", description: "Assinaturas e cobranças", to: "/planos", image: tilePlanosAsset.url },
  { icon: Wallet, title: "Financeiro", description: "Receitas e pagamentos", to: "/financeiro", image: tileFinanceiroAsset.url },
  { icon: Target, title: "Execução", description: "Treinos e biblioteca", to: "/treinos", image: tileTreinosAsset.url },
  { icon: Bell, title: "Avisos", description: "Comunicados para todos", to: "/avisos", image: tileAvisosAsset.url },
  { icon: FolderOpen, title: "Arquivos", description: "Documentos e anexos", to: "/arquivos", image: tileArquivosAsset.url },
  { icon: Settings, title: "Configurações", description: "Ajustes do aplicativo", to: "/config", image: headerGymAsset.url },
];

const ownerStats: DashboardStat[] = [
  { icon: Dumbbell, label: "Professores", value: "24", hint: "Ativos", trend: "↑ 8%" },
  { icon: User, label: "Alunos", value: "312", hint: "Ativos", trend: "↑ 12%" },
  { icon: ShieldCheck, label: "Produtos", value: "48", hint: "Cadastrados", trend: "↑ 5%" },
];

function OwnerPage() {
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

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "Proprietário";

  return (
    <AppShell hideHeader>
      <DashboardHome
        name={firstName}
        roleLabel="Proprietário"
        modeLabel="Modo gestor"
        subtitle="Tenha controle total do seu negócio"
        avatarUrl={avatarOwnerAsset.url}
        heroImageUrl={headerGymAsset.url}
        searchPlaceholder="Buscar módulos, usuários, produtos..."
        filters={["Visão geral", "Hoje", "Semana", "Mês", "Personalizado"]}
        stats={ownerStats}
        modules={ownerModules}
        notifCount={3}
      />
    </AppShell>
  );
}

