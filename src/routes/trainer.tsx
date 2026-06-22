import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Dumbbell, Apple, ClipboardCheck, TrendingUp, FolderOpen, Bell, Wallet,
  BookOpen, ChevronRight, MessageCircle, LayoutGrid, Store,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import logoVAsset from "@/assets/logo-v.webp.asset.json";
const logoV = logoVAsset.url;
import headerGym from "@/assets/header-gym.jpg";
import tileAlunos from "@/assets/tile-alunos.jpg";
import tileTreinos from "@/assets/tile-treinos.jpg";
import tileDieta from "@/assets/tile-dieta.jpg";
import tileAvaliacoes from "@/assets/tile-avaliacoes.jpg";
import tileProgresso from "@/assets/tile-progresso.jpg";
import tileBiblioteca from "@/assets/tile-biblioteca.jpg";
import tileArquivos from "@/assets/tile-arquivos.jpg";
import tileAvisos from "@/assets/tile-avisos.jpg";
import tileFinanceiro from "@/assets/tile-financeiro.jpg";
import tileChat from "@/assets/tile-chat.jpg";
import tileMais from "@/assets/tile-mais.jpg";

export const Route = createFileRoute("/trainer")({
  head: () => ({ meta: [{ title: "Painel do Personal — VRUMFIT PERSONAL" }] }),
  component: () => (
    <RequireAuth allow={["personal", "dono"]}>
      <TrainerPage />
    </RequireAuth>
  ),
});

type Tile = {
  icon: React.ComponentType<{ className?: string }>;
  label: string; hint: string; to: string; bg: string;
};

const smallTiles: Tile[] = [
  { icon: Users, label: "Alunos", hint: "Sua carteira", to: "/alunos", bg: tileAlunos },
  { icon: Dumbbell, label: "Treinos", hint: "Prescrever / histórico", to: "/treinos", bg: tileTreinos },
  { icon: Apple, label: "Dietas", hint: "Prescrever / modelos", to: "/dieta", bg: tileDieta },
  { icon: ClipboardCheck, label: "Avaliações", hint: "Medidas e fotos", to: "/avaliacoes", bg: tileAvaliacoes },
  { icon: TrendingUp, label: "Progresso", hint: "Evolução dos alunos", to: "/evolucao", bg: tileProgresso },
  { icon: BookOpen, label: "Biblioteca", hint: "Exercícios VrumFit", to: "/biblioteca", bg: tileBiblioteca },
  { icon: MessageCircle, label: "Chat", hint: "Mensagens dos alunos", to: "/chat", bg: tileChat },
  { icon: Bell, label: "Avisos", hint: "Comunicados", to: "/avisos", bg: tileAvisos },
  { icon: Wallet, label: "Financeiro", hint: "Suas receitas", to: "/financeiro", bg: tileFinanceiro },
  { icon: Store, label: "Minhas Ofertas", hint: "Vitrine na loja", to: "/loja-pro", bg: tileFinanceiro },
];
const wideTiles: Tile[] = [
  { icon: FolderOpen, label: "Arquivos", hint: "PDFs e documentos", to: "/arquivos", bg: tileArquivos },
  { icon: LayoutGrid, label: "Mais", hint: "Perfil & configurações", to: "/config", bg: tileMais },
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

  const { data: counts } = useQuery({
    queryKey: ["trainer-counts", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [students, workouts, diets, assessments] = await Promise.all([
        supabase.from("students").select("user_id", { count: "exact", head: true }).eq("personal_id", user.id),
        supabase.from("workouts").select("id", { count: "exact", head: true }).eq("personal_id", user.id).eq("status", "ativo"),
        supabase.from("diets").select("id", { count: "exact", head: true }).eq("personal_id", user.id).eq("status", "ativo"),
        supabase.from("assessments").select("id", { count: "exact", head: true }).eq("personal_id", user.id),
      ]);
      return {
        alunos: students.count ?? 0,
        treinos: workouts.count ?? 0,
        dietas: diets.count ?? 0,
        avaliacoes: assessments.count ?? 0,
      };
    },
    enabled: !!user,
  });

  return (
    <AppShell>
      {/* Welcome */}
      <section className="relative">
        <div className="relative rounded-[18px] overflow-hidden">
          <img src={headerGym} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
          <div className="relative p-4 pr-20 min-h-[88px]">
            <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">
              Olá, <span className="text-primary">{profile?.full_name?.split(" ")[0] ?? "Personal"}</span>
            </h1>
            <p className="mt-1 text-[12px] text-white/70">Disciplina · Foco · Resultados</p>
            <img src={logoV} alt="" width={48} height={48} decoding="async" loading="lazy" className="absolute right-3 top-1/2 -translate-y-1/2 size-12 opacity-90" />
          </div>
        </div>
      </section>

      {/* Metric cards */}
      <section className="mt-4 grid grid-cols-2 gap-2.5">
        <Metric icon={Users} label="Alunos" value={counts?.alunos ?? 0} sub="Carteira" />
        <Metric icon={Dumbbell} label="Treinos" value={counts?.treinos ?? 0} sub="Ativos" />
        <Metric icon={Apple} label="Dietas" value={counts?.dietas ?? 0} sub="Ativas" />
        <Metric icon={ClipboardCheck} label="Avaliações" value={counts?.avaliacoes ?? 0} sub="Total" />
      </section>

      {/* Modules header */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-[20px] font-extrabold tracking-tight flex items-center gap-2">
          <span className="inline-block w-[3px] h-5 bg-primary rounded-full" /> Módulos
        </h2>
      </div>

      <section className="mt-3 grid grid-cols-3 gap-2">
        {smallTiles.map((t) => <PhotoTile key={t.label} {...t} />)}
      </section>
      <section className="mt-2 grid grid-cols-2 gap-2">
        {wideTiles.map((t) => <PhotoTile key={t.label} {...t} wide />)}
      </section>
    </AppShell>
  );
}

function Metric({
  icon: Icon, label, value, sub,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub: string }) {
  const display = typeof value === "number" ? (value === 0 ? "—" : value.toString()) : value;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-3 flex flex-col gap-1.5 backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        <div className="size-7 rounded-lg border border-primary/40 grid place-items-center text-primary shrink-0">
          <Icon className="size-3.5" />
        </div>
        <p className="text-[11px] font-semibold text-white/85 truncate">{label}</p>
      </div>
      <p className="text-[22px] leading-none font-extrabold mt-1">{display}</p>
      <p className="text-[10px] text-white/50 -mt-0.5">{sub}</p>
    </div>
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
