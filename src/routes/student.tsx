import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dumbbell, Apple, TrendingUp, BookOpen, ShoppingBag, FolderOpen, Bell, ClipboardCheck, ChevronRight, FileText, Crown,
} from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import headerGym from "@/assets/header-gym.jpg";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Meu treino — VRUMFIT PERSONAL" }] }),
  component: () => (
    <RequireAuth allow={["aluno", "personal", "dono"]}>
      <StudentPage />
    </RequireAuth>
  ),
});

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

  return (
    <AppShell>
      <section>
        <div className="relative rounded-[18px] overflow-hidden">
          <img src={headerGym} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
          <div className="relative p-4 min-h-[88px]">
            <h1 className="text-[22px] font-extrabold leading-tight">
              Bem-vindo, <span className="text-primary">{profile?.full_name?.split(" ")[0] ?? "Aluno"}</span>
            </h1>
            <p className="mt-1 text-[12px] text-white/70">Bora treinar firme hoje.</p>
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

      <h2 className="mt-6 text-[18px] font-extrabold flex items-center gap-2">
        <span className="inline-block w-[3px] h-5 bg-primary rounded-full" /> Acesso rápido
      </h2>

      <section className="mt-3 grid grid-cols-2 gap-2.5">
        {[
          { icon: TrendingUp, label: "Progresso", hint: "Peso, medidas, frequência", to: "/evolucao" },
          { icon: ClipboardCheck, label: "Avaliações", hint: "Histórico de medidas", to: "/avaliacoes" },
          { icon: BookOpen, label: "Biblioteca", hint: "Como executar exercícios", to: "/treinos" },
          { icon: ShoppingBag, label: "Loja", hint: "Produtos digitais", to: "/loja" },
          { icon: FolderOpen, label: "Arquivos", hint: "PDFs e materiais", to: "/arquivos" },
          { icon: Bell, label: "Avisos", hint: "Comunicados", to: "/avisos" },
          { icon: FileText, label: "Faturas", hint: "Pagamentos", to: "/financeiro" },
        ].map((t) => (
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
    </AppShell>
  );
}
