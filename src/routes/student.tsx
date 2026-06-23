import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dumbbell, Apple, Target, Camera, CalendarDays, TrendingUp,
  CheckCircle2, Store, FolderOpen, Bell, User, LayoutGrid,
  ChevronRight, Crown, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { HomeHero } from "@/components/HomeHero";
import { NeonGrid, type NeonTileItem } from "@/components/NeonTile";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import headerGymAsset from "@/assets/header-gym.jpg.asset.json";
const headerGym = headerGymAsset.url;

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Meu treino — VRUMFIT PERSONAL" }] }),
  component: () => (
    <RequireAuth allow={["aluno", "personal", "dono"]}>
      <StudentPage />
    </RequireAuth>
  ),
});

const tiles: NeonTileItem[] = [
  { icon: Dumbbell, label: "Meu Treino", hint: "Séries e exercícios", to: "/treinos" },
  { icon: Apple, label: "Dieta", hint: "Refeições e água", to: "/dieta" },
  { icon: Target, label: "Execução", hint: "Como fazer certo", to: "/biblioteca" },
  { icon: Camera, label: "Avaliação", hint: "Fotos e resultados", to: "/avaliacoes" },
  { icon: CalendarDays, label: "Agenda", hint: "Aulas e horários", to: "/agenda" },
  { icon: TrendingUp, label: "Progresso", hint: "Sua evolução", to: "/evolucao" },
  { icon: CheckCircle2, label: "Check-in", hint: "Registrar presença", to: "/historico" },
  { icon: Store, label: "Loja", hint: "Produtos e serviços", to: "/loja" },
  { icon: FolderOpen, label: "Arquivos", hint: "PDFs e materiais", to: "/arquivos" },
  { icon: Bell, label: "Avisos", hint: "Recados e novidades", to: "/avisos" },
  { icon: User, label: "Perfil", hint: "Seus dados", to: "/config" },
  { icon: LayoutGrid, label: "Mais", hint: "Configurações e suporte", to: "/config" },
];

function StudentPage() {
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
    onError: (e: any) => toast.error(e.message ?? "Falha ao reivindicar."),
  });

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "Aluno";
  const q = query.toLowerCase();
  const filtered = tiles.filter((t) => (t.label + " " + t.hint).toLowerCase().includes(q));

  return (
    <AppShell hideHeader>
      <HomeHero
        photo={headerGym}
        eyebrow="Bem-vindo,"
        name={firstName}
        tagline="Acompanhe seu treino e sua evolução"
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Buscar treino, dieta, exercícios..."
        onFilters={() => setShowFilters((v) => !v)}
        filtersActive={showFilters}
        notifCount={3}
      />

      {hasOwner === false && (
        <button onClick={() => claim.mutate()} disabled={claim.isPending}
          className="w-full mt-4 rounded-2xl border border-primary/50 bg-primary/10 hover:bg-primary/15 p-3 flex items-center gap-3 text-left transition disabled:opacity-60">
          <div className="size-10 rounded-xl bg-primary/20 border border-primary/50 grid place-items-center text-primary">
            <Crown className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-primary">Sou o Dono deste app</p>
            <p className="text-[11px] text-white/70">Toque para virar Proprietário (só funciona uma vez).</p>
          </div>
          <ChevronRight className="size-4 text-primary" />
        </button>
      )}

      {anamnese !== undefined && !anamnese?.completed_at && (
        <Link to="/anamnese" className="w-full mt-3 rounded-2xl border border-primary/40 bg-primary/10 p-3 flex items-center gap-3 hover:bg-primary/15 transition">
          <div className="size-10 rounded-xl bg-primary/20 border border-primary/50 grid place-items-center text-primary">
            <ClipboardList className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-primary">Preencha sua anamnese</p>
            <p className="text-[11px] text-white/70">Ajuda seu personal a montar o melhor treino.</p>
          </div>
          <ChevronRight className="size-4 text-primary" />
        </Link>
      )}

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
