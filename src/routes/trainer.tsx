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
import headerGymAsset from "@/assets/header-gym.jpg.asset.json";
const headerGym = headerGymAsset.url;
import tileAlunosAsset from "@/assets/tile-alunos.jpg.asset.json";
const tileAlunos = tileAlunosAsset.url;
import tileTreinosAsset from "@/assets/tile-treinos.jpg.asset.json";
const tileTreinos = tileTreinosAsset.url;
import tileDietaAsset from "@/assets/tile-dieta.jpg.asset.json";
const tileDieta = tileDietaAsset.url;
import tileAvaliacoesAsset from "@/assets/tile-avaliacoes.jpg.asset.json";
const tileAvaliacoes = tileAvaliacoesAsset.url;
import tileProgressoAsset from "@/assets/tile-progresso.jpg.asset.json";
const tileProgresso = tileProgressoAsset.url;
import tileBibliotecaAsset from "@/assets/tile-biblioteca.jpg.asset.json";
const tileBiblioteca = tileBibliotecaAsset.url;
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

  const firstName = profile?.full_name?.split(" ")[0] ?? "Personal";
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <AppShell>
      {/* Welcome hero */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_60px_-30px_rgba(255,120,30,0.45)]">
        <img src={headerGym} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-primary/25" />
        <div className="relative p-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary/85 font-bold">{today}</p>
          <h1 className="mt-1 text-[26px] font-black leading-tight tracking-tight">
            Olá, <span className="text-primary">{firstName}</span>
          </h1>
          <p className="mt-1 text-[12.5px] text-white/70">Disciplina · Foco · Resultados</p>
          
        </div>
      </section>

      {/* Metric cards */}
      <section className="mt-4 grid grid-cols-2 gap-2.5">
        <Metric icon={Users} label="Alunos" value={counts?.alunos ?? 0} sub="Carteira" />
        <Metric icon={Dumbbell} label="Treinos" value={counts?.treinos ?? 0} sub="Ativos" />
        <Metric icon={Apple} label="Dietas" value={counts?.dietas ?? 0} sub="Ativas" />
        <Metric icon={ClipboardCheck} label="Avaliações" value={counts?.avaliacoes ?? 0} sub="Total" />
      </section>

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

function Metric({
  icon: Icon, label, value, sub,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub: string }) {
  const display = typeof value === "number" ? (value === 0 ? "—" : value.toString()) : value;
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-black/40 p-3.5 flex flex-col gap-1 backdrop-blur-md hover:border-primary/40 transition">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-lg border border-primary/40 bg-primary/10 grid place-items-center text-primary shrink-0">
          <Icon className="size-3.5" />
        </div>
        <p className="text-[11px] font-semibold text-white/85 truncate uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-[24px] leading-none font-black mt-1.5">{display}</p>
      <p className="text-[10px] text-white/50">{sub}</p>
    </div>
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
