import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Dumbbell, User, ShoppingBag, Package, CreditCard,
  Wallet, Target, Bell, FolderOpen, Settings,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { SimpleHeader } from "@/components/SimpleHeader";
import { BigCardGrid, type BigCardItem } from "@/components/BigCard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

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

const tiles: BigCardItem[] = [
  { icon: Users, label: "Usuários", to: "/personais" },
  { icon: Dumbbell, label: "Professores", to: "/trainer" },
  { icon: User, label: "Alunos", to: "/student" },
  { icon: ShoppingBag, label: "Loja", to: "/loja" },
  { icon: Package, label: "Produtos", to: "/produtos" },
  { icon: CreditCard, label: "Planos", to: "/planos" },
  { icon: Wallet, label: "Financeiro", to: "/financeiro" },
  { icon: Target, label: "Execução", to: "/treinos" },
  { icon: Bell, label: "Avisos", to: "/avisos" },
  { icon: FolderOpen, label: "Arquivos", to: "/arquivos" },
  { icon: Settings, label: "Configurações", to: "/config" },
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
      <SimpleHeader greeting={`Bem-vindo, ${firstName}!`} subtitle="Controle total do seu negócio" notifCount={3} />
      <div className="mt-5">
        <BigCardGrid items={tiles} />
      </div>
    </AppShell>
  );
}

