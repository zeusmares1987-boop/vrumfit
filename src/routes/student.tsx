import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dumbbell, Apple, TrendingUp, BookOpen, ShoppingBag, FolderOpen, Bell,
  ClipboardCheck, ChevronRight, FileText, Crown, LayoutGrid, UserCog, MessageCircle, CheckCircle2,
  ClipboardList, CalendarDays, X, Star,
} from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { StoredImage } from "@/components/StoredImage";
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
  { icon: CalendarDays, label: "Agenda", hint: "Meus horários", to: "/agenda", bg: tileAvaliacoes },
  { icon: ClipboardList, label: "Anamnese", hint: "Saúde", to: "/anamnese", bg: tileMais },
  { icon: BookOpen, label: "Biblioteca", hint: "Como executar", to: "/biblioteca", bg: tileBiblioteca },
  { icon: ShoppingBag, label: "Loja", hint: "Produtos", to: "/loja", bg: tileLoja },
  { icon: Bell, label: "Avisos", hint: "Comunicados", to: "/avisos", bg: tileAvisos },
  { icon: FileText, label: "Faturas", hint: "Pagamentos", to: "/financeiro", bg: tileFinanceiro },
];
const wideTiles: Tile[] = [
  { icon: FolderOpen, label: "Arquivos", hint: "PDFs e materiais", to: "/arquivos", bg: tileArquivos },
  { icon: LayoutGrid, label: "Mais", hint: "Perfil & configurações", to: "/config", bg: tileMais },
];

function StudentPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [fbOpen, setFbOpen] = useState(false);

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

  const { data: myPersonal } = useQuery({
    queryKey: ["my-personal", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: stu } = await supabase.from("students").select("personal_id").eq("user_id", user.id).maybeSingle();
      if (!stu?.personal_id) return null;
      const { data: prof } = await supabase.from("profiles").select("full_name,email,phone,avatar_url").eq("id", stu.personal_id).maybeSingle();
      return prof ? { ...prof, id: stu.personal_id } : null;
    },
    enabled: !!user,
  });

  const today = new Date().toISOString().slice(0, 10);
  const { data: sessionToday } = useQuery({
    queryKey: ["my-session-today", user?.id, today],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("workout_sessions").select("id").eq("student_id", user.id).eq("session_date", today).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const markDone = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not logged");
      const { data, error } = await supabase.from("workout_sessions").insert({
        student_id: user.id,
        workout_id: currentWorkout?.id ?? null,
        session_date: today,
      }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      toast.success("Treino marcado! 💪");
      qc.invalidateQueries({ queryKey: ["my-session-today"] });
      setFbOpen(true);
    },
    onError: (e: any) => toast.error(e.message ?? "Falha"),
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

  const firstName = profile?.full_name?.split(" ")[0] ?? "Aluno";
  const todayLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

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

      {anamnese && !anamnese.completed_at || !anamnese ? (
        <Link to="/anamnese" className="w-full mb-3 rounded-2xl border border-warning/40 bg-warning/10 p-3 flex items-center gap-3 hover:bg-warning/15 transition" style={{ borderColor: "rgba(255,180,40,0.4)", background: "rgba(255,180,40,0.10)" }}>
          <div className="size-10 rounded-xl bg-primary/20 border border-primary/50 grid place-items-center text-primary">
            <ClipboardList className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-primary">Preencha sua anamnese</p>
            <p className="text-[11px] text-white/70">Ajuda seu personal a montar o melhor treino.</p>
          </div>
          <ChevronRight className="size-4 text-primary" />
        </Link>
      ) : null}

      {/* Welcome hero */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_60px_-30px_rgba(255,120,30,0.45)]">
        <img src={headerGym} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-primary/25" />
        <div className="relative p-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary/85 font-bold">{todayLabel}</p>
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

        {/* Marcar treino feito hoje */}
        <button
          onClick={() => !sessionToday && markDone.mutate()}
          disabled={markDone.isPending || !!sessionToday}
          className={`group relative block w-full text-left rounded-2xl p-4 transition ${
            sessionToday
              ? "border border-success/50 bg-success/10"
              : "border border-primary/40 bg-gradient-to-br from-primary/15 to-black/40 hover:border-primary/70"
          } disabled:opacity-90`}
        >
          <div className="flex items-center gap-3">
            <div className={`size-12 rounded-xl border grid place-items-center shrink-0 ${
              sessionToday ? "bg-success/20 border-success/50 text-success" : "bg-primary/20 border-primary/50 text-primary"
            }`}>
              <CheckCircle2 className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold" style={{ color: sessionToday ? "rgb(74 222 128)" : undefined }}>
                {sessionToday ? "Treino feito hoje ✓" : "Marcar treino feito hoje"}
              </p>
              <p className="text-[12px] text-white/65 mt-0.5">
                {sessionToday ? "Bom trabalho. Bora amanhã também." : "Toque ao terminar a sessão para registrar adesão."}
              </p>
            </div>
          </div>
        </button>

        {/* Meu Personal */}
        {myPersonal && (
          <Link to="/config" className="group relative block rounded-2xl border border-white/12 bg-white/[0.035] p-4 hover:border-primary/45 transition">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl border border-primary/40 bg-primary/10 grid place-items-center text-primary font-black overflow-hidden shrink-0">
                {myPersonal.avatar_url
                  ? <StoredImage src={myPersonal.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <UserCog className="size-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Meu personal</p>
                <p className="text-[14px] font-extrabold truncate mt-0.5">{myPersonal.full_name ?? "Personal"}</p>
                {myPersonal.email && <p className="text-[10.5px] text-white/55 truncate">{myPersonal.email}</p>}
              </div>
              {myPersonal.phone && (
                <a
                  href={`https://wa.me/${myPersonal.phone.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 size-10 rounded-xl bg-success/15 border border-success/40 grid place-items-center text-success"
                  aria-label="WhatsApp do personal"
                >
                  <MessageCircle className="size-4" />
                </a>
              )}
            </div>
          </Link>
        )}
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

      {myPersonal?.phone && (
        <a
          href={`https://wa.me/${myPersonal.phone.replace(/\D/g, "")}`}
          target="_blank" rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-2 h-12 rounded-2xl bg-success/15 border border-success/40 text-success text-[13px] font-extrabold uppercase tracking-wider"
        >
          <MessageCircle className="size-4" /> Falar com meu personal
        </a>
      )}
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
