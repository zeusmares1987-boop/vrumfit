import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dumbbell, Apple, TrendingUp, BookOpen, ShoppingBag, FolderOpen, Bell,
  ClipboardCheck, ChevronRight, FileText, Crown, MessageCircle, LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import logoV from "@/assets/logo-v.png";
import headerGym from "@/assets/header-gym.jpg";
import tileTreinos from "@/assets/tile-treinos.jpg";
import tileDieta from "@/assets/tile-dieta.jpg";
import tileProgresso from "@/assets/tile-progresso.jpg";
import tileAvaliacoes from "@/assets/tile-avaliacoes.jpg";
import tileBiblioteca from "@/assets/tile-biblioteca.jpg";
import tileLoja from "@/assets/tile-loja.jpg";
import tileArquivos from "@/assets/tile-arquivos.jpg";
import tileAvisos from "@/assets/tile-avisos.jpg";
import tileFinanceiro from "@/assets/tile-financeiro.jpg";
import tileChat from "@/assets/tile-chat.jpg";
import tileMais from "@/assets/tile-mais.jpg";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Meu treino — VRUMFIT PERSONAL" }] }),
  component: () => (
    <RequireAuth allow={["aluno", "personal", "dono"]}>
      <StudentPage />
    </RequireAuth>
  ),
});

type Tile = {
  icon: React.ComponentType<{ className?: string }>;
  label: string; hint: string; to: string; bg: string;
};

const smallTiles: Tile[] = [
  { icon: Dumbbell, label: "Treinos", hint: "Meu plano atual", to: "/treinos", bg: tileTreinos },
  { icon: Apple, label: "Dieta", hint: "Minha dieta", to: "/dieta", bg: tileDieta },
  { icon: TrendingUp, label: "Progresso", hint: "Peso e medidas", to: "/evolucao", bg: tileProgresso },
  { icon: ClipboardCheck, label: "Avaliações", hint: "Histórico", to: "/avaliacoes", bg: tileAvaliacoes },
  { icon: BookOpen, label: "Biblioteca", hint: "Como executar", to: "/biblioteca", bg: tileBiblioteca },
  { icon: ShoppingBag, label: "Loja", hint: "Produtos", to: "/loja", bg: tileLoja },
  { icon: MessageCircle, label: "Chat", hint: "Falar com personal", to: "/chat", bg: tileChat },
  { icon: Bell, label: "Avisos", hint: "Comunicados", to: "/avisos", bg: tileAvisos },
  { icon: FileText, label: "Faturas", hint: "Pagamentos", to: "/financeiro", bg: tileFinanceiro },
];
const wideTiles: Tile[] = [
  { icon: FolderOpen, label: "Arquivos", hint: "PDFs e materiais", to: "/arquivos", bg: tileArquivos },
  { icon: LayoutGrid, label: "Mais", hint: "Perfil & configurações", to: "/config", bg: tileMais },
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

  const { data: currentWorkout } = useQuery({
    queryKey: ["my-workout", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("workouts").select("id,name,objective").eq("student_id", user.id).eq("status", "ativo").order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: currentDiet } = useQuery({
    queryKey: ["my-diet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("diets").select("id,name,objective").eq("student_id", user.id).eq("status", "ativo").order("created_at", { ascending: false }).limit(1).maybeSingle();
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

  return (
    <AppShell>
      {hasOwner === false && (
        <button onClick={() => claim.mutate()} disabled={claim.isPending}
          className="w-full mb-3 rounded-2xl border border-primary/50 bg-primary/10 hover:bg-primary/20 p-3 flex items-center gap-3 text-left transition disabled:opacity-60">
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

      {/* Welcome */}
      <section className="relative">
        <div className="relative rounded-[18px] overflow-hidden">
          <img src={headerGym} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
          <div className="relative p-4 pr-20 min-h-[88px]">
            <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">
              Bem-vindo, <span className="text-primary">{profile?.full_name?.split(" ")[0] ?? "Aluno"}</span>
            </h1>
            <p className="mt-1 text-[12px] text-white/70">Bora treinar firme hoje.</p>
            <img src={logoV} alt="" className="absolute right-3 top-1/2 -translate-y-1/2 size-12 opacity-90" />
          </div>
        </div>
      </section>

      {/* Treino atual */}
      <Link to="/treinos" className="mt-4 block rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-black/40 to-black/60 p-4 hover:border-primary/60 transition">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-primary/20 border border-primary/40 grid place-items-center text-primary">
            <Dumbbell className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-primary font-semibold">Meu treino atual</p>
            <p className="text-[16px] font-extrabold truncate">{currentWorkout?.name ?? "Nenhum treino ativo"}</p>
            <p className="text-[11px] text-white/60">{currentWorkout?.objective ?? "Seu personal vai prescrever em breve"}</p>
          </div>
          <ChevronRight className="size-5 text-primary" />
        </div>
      </Link>

      {/* Dieta atual */}
      <Link to="/dieta" className="mt-3 block rounded-2xl border border-white/15 bg-white/[0.03] p-4 hover:border-primary/40 transition">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-white/5 border border-primary/30 grid place-items-center text-primary">
            <Apple className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-primary font-semibold">Minha dieta atual</p>
            <p className="text-[16px] font-extrabold truncate">{currentDiet?.name ?? "Nenhuma dieta ativa"}</p>
            <p className="text-[11px] text-white/60">{currentDiet?.objective ?? "Seu personal vai prescrever em breve"}</p>
          </div>
          <ChevronRight className="size-5 text-primary" />
        </div>
      </Link>

      <h2 className="mt-6 text-[20px] font-extrabold tracking-tight flex items-center gap-2">
        <span className="inline-block w-[3px] h-5 bg-primary rounded-full" /> Módulos
      </h2>

      <section className="mt-3 grid grid-cols-3 gap-2">
        {smallTiles.map((t) => <PhotoTile key={t.label} {...t} />)}
      </section>
      <section className="mt-2 grid grid-cols-2 gap-2">
        {wideTiles.map((t) => <PhotoTile key={t.label} {...t} wide />)}
      </section>
    </AppShell>
  );
}

function PhotoTile({ icon: Icon, label, hint, to, bg, wide }: Tile & { wide?: boolean }) {
  return (
    <Link to={to} className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition block ${wide ? "aspect-[16/9]" : "aspect-[5/6]"}`}>
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.15) 100%)" }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="relative h-full p-3 flex flex-col">
        <div className="size-9 rounded-xl border border-primary/50 bg-black/55 backdrop-blur-sm grid place-items-center text-primary">
          <Icon className="size-[16px]" />
        </div>
        <div className="mt-auto pr-5">
          <p className="text-[13px] font-extrabold leading-tight">{label}</p>
          <p className="text-[10px] text-white/65 leading-snug mt-0.5 line-clamp-2">{hint}</p>
        </div>
        <ChevronRight className="absolute bottom-2.5 right-2.5 size-4 text-primary" />
      </div>
    </Link>
  );
}
