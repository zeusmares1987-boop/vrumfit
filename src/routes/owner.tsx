import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Dumbbell, User, ShoppingBag, Package, CreditCard,
  Wallet, Target, Bell, FolderOpen, LayoutGrid,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { HomeHero } from "@/components/HomeHero";
import { NeonGrid, type NeonTileItem } from "@/components/NeonTile";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import headerGymAsset from "@/assets/header-gym.jpg.asset.json";
const headerGym = headerGymAsset.url;

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

const tiles: NeonTileItem[] = [
  { icon: Users, label: "Usuários", hint: "Acessos e permissões", to: "/personais" },
  { icon: Dumbbell, label: "Professores", hint: "Equipe e gestão", to: "/trainer" },
  { icon: User, label: "Alunos", hint: "Cadastros e matrículas", to: "/student" },
  { icon: ShoppingBag, label: "Loja", hint: "Sua loja integrada", to: "/loja" },
  { icon: Package, label: "Produtos", hint: "Catálogo e estoque", to: "/produtos" },
  { icon: CreditCard, label: "Planos", hint: "Assinaturas e limites", to: "/planos" },
  { icon: Wallet, label: "Financeiro", hint: "Receitas e relatórios", to: "/financeiro" },
  { icon: Target, label: "Execução", hint: "Biblioteca e técnica", to: "/treinos" },
  { icon: Bell, label: "Avisos", hint: "Comunicados", to: "/avisos" },
  { icon: FolderOpen, label: "Arquivos", hint: "Documentos e downloads", to: "/arquivos" },
  { icon: LayoutGrid, label: "Mais", hint: "Outras funções", to: "/config" },
];

function OwnerPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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
  const q = query.toLowerCase();
  const filtered = tiles.filter((t) =>
    (t.label + " " + t.hint).toLowerCase().includes(q)
  );

  return (
    <AppShell hideHeader>
      <HomeHero
        photo={headerGym}
        eyebrow="Bem-vindo,"
        name={firstName}
        tagline="Tenha controle total do seu negócio"
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Buscar módulos, usuários, produtos..."
        onFilters={() => setShowFilters((v) => !v)}
        filtersActive={showFilters}
        notifCount={3}
      />

      <div className="mt-6">
        {filtered.length > 0 ? (
          <NeonGrid items={filtered} />
        ) : (
          <p className="text-center py-10 text-white/50 text-sm">Nenhum módulo encontrado.</p>
        )}
      </div>
    </AppShell>
  );
}
