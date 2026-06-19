import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Dumbbell, Apple, ClipboardCheck, TrendingUp, FolderOpen, Bell, Wallet, MoreHorizontal, ChevronRight, BookOpen,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import headerGym from "@/assets/header-gym.jpg";

export const Route = createFileRoute("/trainer")({
  head: () => ({ meta: [{ title: "Painel do Personal — VRUMFIT PERSONAL" }] }),
  component: () => (
    <RequireAuth allow={["personal", "dono"]}>
      <TrainerPage />
    </RequireAuth>
  ),
});

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

  const tiles = [
    { icon: Users, label: "Alunos", hint: "Sua carteira de alunos", to: "/alunos" },
    { icon: Dumbbell, label: "Treinos", hint: "Prescrever / Histórico", to: "/treinos" },
    { icon: Apple, label: "Dietas", hint: "Prescrever / Modelos", to: "/dieta" },
    { icon: ClipboardCheck, label: "Avaliações", hint: "Medidas e fotos", to: "/avaliacoes" },
    { icon: TrendingUp, label: "Progresso", hint: "Evolução dos alunos", to: "/evolucao" },
    { icon: BookOpen, label: "Biblioteca", hint: "Exercícios VrumFit", to: "/treinos" },
    { icon: FolderOpen, label: "Arquivos", hint: "PDFs e documentos", to: "/arquivos" },
    { icon: Bell, label: "Avisos", hint: "Comunicados", to: "/avisos" },
    { icon: Wallet, label: "Financeiro", hint: "Suas receitas", to: "/financeiro" },
  ];

  return (
    <AppShell>
      <section>
        <div className="relative rounded-[18px] overflow-hidden">
          <img src={headerGym} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
          <div className="relative p-4 min-h-[88px]">
            <h1 className="text-[22px] font-extrabold leading-tight">
              Olá, <span className="text-primary">{profile?.full_name?.split(" ")[0] ?? "Personal"}</span>
            </h1>
            <p className="mt-1 text-[12px] text-white/70">Disciplina · Foco · Resultados</p>
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2.5">
        <Stat icon={Users} label="Alunos" value={counts?.alunos ?? 0} />
        <Stat icon={Dumbbell} label="Treinos ativos" value={counts?.treinos ?? 0} />
        <Stat icon={Apple} label="Dietas ativas" value={counts?.dietas ?? 0} />
        <Stat icon={ClipboardCheck} label="Avaliações" value={counts?.avaliacoes ?? 0} />
      </section>

      <h2 className="mt-6 text-[18px] font-extrabold flex items-center gap-2">
        <span className="inline-block w-[3px] h-5 bg-primary rounded-full" /> Módulos
      </h2>

      <section className="mt-3 grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className="group rounded-2xl border border-white/10 hover:border-primary/50 bg-white/[0.03] p-3 flex items-start gap-3 transition">
            <div className="size-10 rounded-xl border border-primary/40 grid place-items-center text-primary shrink-0">
              <t.icon className="size-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold">{t.label}</p>
              <p className="text-[10.5px] text-white/60 leading-snug line-clamp-2">{t.hint}</p>
            </div>
            <ChevronRight className="size-4 text-primary self-center" />
          </Link>
        ))}
      </section>

      <div className="mt-6">
        <Link to="/config" className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3 hover:border-primary/40 transition">
          <div className="size-10 rounded-xl border border-primary/40 grid place-items-center text-primary"><MoreHorizontal className="size-4" /></div>
          <div className="flex-1"><p className="text-[13px] font-bold">Perfil & Configurações</p></div>
          <ChevronRight className="size-4 text-primary" />
        </Link>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <div className="size-7 rounded-lg border border-primary/40 grid place-items-center text-primary"><Icon className="size-3.5" /></div>
        <p className="text-[11px] font-semibold text-white/85">{label}</p>
      </div>
      <p className="text-[24px] font-extrabold mt-1">{value}</p>
    </div>
  );
}
