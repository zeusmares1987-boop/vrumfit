import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dumbbell, Apple, Target, Camera, CalendarDays, TrendingUp,
  CheckCircle2, Store, FolderOpen, Bell, User, Settings,
  ChevronRight, Crown, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { SimpleHeader } from "@/components/SimpleHeader";
import { BigCardGrid, type BigCardItem } from "@/components/BigCard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Meu treino — VRUMFIT PERSONAL" }] }),
  component: () => (
    <RequireAuth allow={["aluno", "personal", "dono"]}>
      <StudentPage />
    </RequireAuth>
  ),
});

const tiles: BigCardItem[] = [
  { icon: Dumbbell, label: "Meu Treino", to: "/treinos" },
  { icon: Apple, label: "Dieta", to: "/dieta" },
  { icon: Target, label: "Execução", to: "/biblioteca" },
  { icon: Camera, label: "Avaliação", to: "/avaliacoes" },
  { icon: CalendarDays, label: "Agenda", to: "/agenda" },
  { icon: TrendingUp, label: "Progresso", to: "/evolucao" },
  { icon: CheckCircle2, label: "Histórico", to: "/historico" },
  { icon: Store, label: "Loja", to: "/loja" },
  { icon: FolderOpen, label: "Arquivos", to: "/arquivos" },
  { icon: Bell, label: "Avisos", to: "/avisos" },
  { icon: User, label: "Perfil", to: "/config" },
  { icon: Settings, label: "Configurações", to: "/config" },
];

function StudentPage() {
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

  return (
    <AppShell hideHeader>
      <SimpleHeader greeting={`Bem-vindo, ${firstName}!`} subtitle="Seu treino e sua evolução" notifCount={3} />

      {hasOwner === false && (
        <button onClick={() => claim.mutate()} disabled={claim.isPending}
          className="w-full mt-4 rounded-2xl border border-primary/50 bg-primary/10 hover:bg-primary/15 p-3 flex items-center gap-3 text-left transition disabled:opacity-60">
          <div className="size-10 rounded-xl bg-primary/20 border border-primary/50 grid place-items-center text-primary">
            <Crown className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-primary">Sou o Dono deste app</p>
            <p className="text-[11px] text-white/70">Toque para virar Proprietário (só funciona uma vez).</p>
          </div>
          <ChevronRight className="size-4 text-primary shrink-0" />
        </button>
      )}

      {anamnese !== undefined && !anamnese?.completed_at && (
        <Link to="/anamnese" className="w-full mt-3 rounded-2xl border border-primary/40 bg-primary/10 p-3 flex items-center gap-3 hover:bg-primary/15 transition">
          <div className="size-10 rounded-xl bg-primary/20 border border-primary/50 grid place-items-center text-primary">
            <ClipboardList className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-primary">Preencha sua anamnese</p>
            <p className="text-[11px] text-white/70">Ajuda seu personal a montar o melhor treino.</p>
          </div>
          <ChevronRight className="size-4 text-primary shrink-0" />
        </Link>
      )}

      <div className="mt-4">
        <WeekFrequency done={[0]} missed={[1]} />
      </div>

      <div className="mt-4">
        <BigCardGrid items={tiles} />
      </div>
    </AppShell>
  );
}

