import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Dumbbell, Apple, ClipboardCheck, CalendarDays, Camera,
  CheckCircle2, Target, TrendingUp, Store, ShoppingBag, FolderOpen, LayoutGrid,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { HomeHero } from "@/components/HomeHero";
import { NeonGrid, type NeonTileItem } from "@/components/NeonTile";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import headerGymAsset from "@/assets/header-gym.jpg.asset.json";
const headerGym = headerGymAsset.url;

export const Route = createFileRoute("/trainer")({
  head: () => ({ meta: [{ title: "Painel do Personal — VRUMFIT PERSONAL" }] }),
  component: () => (
    <RequireAuth allow={["personal", "dono"]}>
      <TrainerPage />
    </RequireAuth>
  ),
});

const tiles: NeonTileItem[] = [
  { icon: Users, label: "Alunos", hint: "Cadastro e acompanhamento", to: "/alunos" },
  { icon: Dumbbell, label: "Treinos", hint: "Fichas e exercícios", to: "/treinos" },
  { icon: Apple, label: "Dieta", hint: "Planos e refeições", to: "/dieta" },
  { icon: Camera, label: "Avaliação", hint: "Fotos e resultados", to: "/avaliacoes" },
  { icon: CalendarDays, label: "Agenda", hint: "Aulas e compromissos", to: "/agenda" },
  { icon: CheckCircle2, label: "Presença", hint: "Check-in e frequência", to: "/agenda" },
  { icon: Target, label: "Execução", hint: "Biblioteca e técnica", to: "/biblioteca" },
  { icon: TrendingUp, label: "Progresso", hint: "Evolução dos alunos", to: "/evolucao" },
  { icon: Store, label: "Loja", hint: "Seus serviços e vendas", to: "/loja-pro" },
  { icon: ShoppingBag, label: "Produtos", hint: "Materiais e ofertas", to: "/produtos" },
  { icon: FolderOpen, label: "Arquivos", hint: "PDFs e documentos", to: "/arquivos" },
  { icon: LayoutGrid, label: "Mais", hint: "Configurações e suporte", to: "/config" },
];

function TrainerPage() {
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

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "Professor";
  const q = query.toLowerCase();
  const filtered = tiles.filter((t) => (t.label + " " + t.hint).toLowerCase().includes(q));

  return (
    <AppShell hideHeader>
      <HomeHero
        photo={headerGym}
        eyebrow="Bem-vindo,"
        name={firstName}
        tagline="Gerencie alunos, treinos e resultados"
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Buscar alunos, treinos, dietas..."
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
