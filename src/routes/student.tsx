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
import headerGymAsset from "@/assets/header-gym.jpg.asset.json";
const headerGym = headerGymAsset.url;
import tileTreinosAsset from "@/assets/tile-treinos.jpg.asset.json";
const tileTreinos = tileTreinosAsset.url;
import tileDietaAsset from "@/assets/tile-dieta.jpg.asset.json";
const tileDieta = tileDietaAsset.url;
import tileProgressoAsset from "@/assets/tile-progresso.jpg.asset.json";
const tileProgresso = tileProgressoAsset.url;
import tileAvaliacoesAsset from "@/assets/tile-avaliacoes.jpg.asset.json";
const tileAvaliacoes = tileAvaliacoesAsset.url;
import tileBibliotecaAsset from "@/assets/tile-biblioteca.jpg.asset.json";
const tileBiblioteca = tileBibliotecaAsset.url;
import tileLojaAsset from "@/assets/tile-loja.jpg.asset.json";
const tileLoja = tileLojaAsset.url;
import tileArquivosAsset from "@/assets/tile-arquivos.jpg.asset.json";
const tileArquivos = tileArquivosAsset.url;
import tileAvisosAsset from "@/assets/tile-avisos.jpg.asset.json";
const tileAvisos = tileAvisosAsset.url;
import tileFinanceiroAsset from "@/assets/tile-financeiro.jpg.asset.json";
const tileFinanceiro = tileFinanceiroAsset.url;
import tileChatAsset from "@/assets/tile-chat.jpg.asset.json";
const tileChat = tileChatAsset.url;
import tileMaisAsset from "@/assets/tile-mais.jpg.asset.json";
const tileMais = tileMaisAsset.url;

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

  const firstName = profile?.full_name?.split(" ")[0] ?? "Aluno";
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <AppShell>
      {hasOwner === false && (
        <button onClick={() => claim.mutate()} disabled={claim.isPending}
          className="w-full mb-3 rounded-2xl border border-primary/50 bg-primary/10 hover:bg-primary/15 p-3 flex items-center gap-3 text-left transition disabled:opacity-60">
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

      {/* Welcome hero */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_60px_-30px_rgba(255,120,30,0.45)]">
        <img src={headerGym} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-primary/25" />
        <div className="relative p-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary/85 font-bold">{today}</p>
          <h1 className="mt-1 text-[26px] font-black leading-tight tracking-tight">
            Olá, <span className="text-primary">{firstName}</span>
          </h1>
          <p className="mt-1 text-[12.5px] text-white/70">Pronto para o treino de hoje?</p>
          
        </div>
      </section>

      {/* Treino + Dieta */}
      <div className="mt-4 grid gap-2.5">
        <Link to="/treinos" className="group relative block rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/20 via-black/40 to-black/70 p-4 hover:border-primary/70 hover:translate-y-[-1px] transition">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-primary/25 border border-primary/50 grid place-items-center text-primary shadow-[0_6px_18px_-6px_rgba(255,120,30,0.6)]">
              <Dumbbell className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Meu treino atual</p>
              <p className="text-[16px] font-extrabold truncate mt-0.5">{currentWorkout?.name ?? "Nenhum treino ativo"}</p>
              <p className="text-[11.5px] text-white/65 truncate">{currentWorkout?.objective ?? "Aguardando prescrição do personal"}</p>
            </div>
            <ChevronRight className="size-5 text-primary group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        <Link to="/dieta" className="group relative block rounded-2xl border border-white/12 bg-white/[0.035] p-4 hover:border-primary/45 hover:bg-white/[0.05] transition">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-white/5 border border-primary/30 grid place-items-center text-primary">
              <Apple className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Minha dieta atual</p>
              <p className="text-[16px] font-extrabold truncate mt-0.5">{currentDiet?.name ?? "Nenhuma dieta ativa"}</p>
              <p className="text-[11.5px] text-white/65 truncate">{currentDiet?.objective ?? "Aguardando prescrição do personal"}</p>
            </div>
            <ChevronRight className="size-5 text-primary group-hover:translate-x-0.5 transition" />
          </div>
        </Link>
      </div>

      {/* Section header */}
      <div className="mt-7 mb-3 flex items-center gap-2.5">
        <span className="inline-block w-1 h-5 bg-primary rounded-full" />
        <h2 className="text-[18px] font-black tracking-tight">Módulos</h2>
        <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      <section className="grid grid-cols-3 gap-2">
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
    <Link to={to} className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-primary/55 hover:translate-y-[-2px] hover:shadow-[0_12px_30px_-12px_rgba(255,120,30,0.55)] transition-all duration-200 block ${wide ? "aspect-[16/9]" : "aspect-[5/6]"}`}>
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover scale-100 group-hover:scale-[1.04] transition-transform duration-500" loading="lazy" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.2) 100%)" }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
      <div className="relative h-full p-3 flex flex-col">
        <div className="size-9 rounded-xl border border-primary/55 bg-black/55 backdrop-blur-sm grid place-items-center text-primary group-hover:bg-primary/20 transition">
          <Icon className="size-[16px]" />
        </div>
        <div className="mt-auto pr-5">
          <p className="text-[13px] font-extrabold leading-tight">{label}</p>
          <p className="text-[10px] text-white/65 leading-snug mt-0.5 line-clamp-2">{hint}</p>
        </div>
        <ChevronRight className="absolute bottom-2.5 right-2.5 size-4 text-primary opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
      </div>
    </Link>
  );
}
