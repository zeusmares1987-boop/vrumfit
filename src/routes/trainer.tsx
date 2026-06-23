import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Dumbbell, Apple, CalendarDays, Camera, CheckCircle2,
  Target, TrendingUp, Store, ShoppingBag, FolderOpen, Settings,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { SimpleHeader } from "@/components/SimpleHeader";
import { BigCardGrid, type BigCardItem } from "@/components/BigCard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/trainer")({
  head: () => ({ meta: [{ title: "Painel do Personal — VRUMFIT PERSONAL" }] }),
  component: () => (
    <RequireAuth allow={["personal", "dono"]}>
      <TrainerPage />
    </RequireAuth>
  ),
});

const tiles: BigCardItem[] = [
  { icon: Users, label: "Alunos", to: "/alunos" },
  { icon: Dumbbell, label: "Treinos", to: "/treinos" },
  { icon: Apple, label: "Dieta", to: "/dieta" },
  { icon: Camera, label: "Avaliação", to: "/avaliacoes" },
  { icon: CalendarDays, label: "Agenda", to: "/agenda" },
  { icon: CheckCircle2, label: "Presença", to: "/agenda" },
  { icon: Target, label: "Execução", to: "/biblioteca" },
  { icon: TrendingUp, label: "Progresso", to: "/evolucao" },
  { icon: Store, label: "Loja", to: "/loja-pro" },
  { icon: ShoppingBag, label: "Produtos", to: "/produtos" },
  { icon: FolderOpen, label: "Arquivos", to: "/arquivos" },
  { icon: Settings, label: "Configurações", to: "/config" },
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
      <SimpleHeader greeting={`Bem-vindo, ${firstName}!`} subtitle="Gerencie alunos, treinos e resultados" notifCount={3} />
      <div className="mt-5">
        <BigCardGrid items={tiles} />
      </div>
    </AppShell>
  );
}
