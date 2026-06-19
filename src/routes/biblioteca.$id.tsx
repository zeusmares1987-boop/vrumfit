import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Target, BarChart3, Clock, BarChart2, Dumbbell, ListChecks } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import logoV from "@/assets/logo-v.png";

export const Route = createFileRoute("/biblioteca/$id")({
  head: () => ({ meta: [{ title: "Exercício — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <DetailPage />
    </RequireAuth>
  ),
});

function DetailPage() {
  const { id } = useParams({ from: "/biblioteca/$id" });
  const { data: ex } = useQuery({
    queryKey: ["exercise", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercises")
        .select("*, exercise_categories(name), exercise_subcategories(name)")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  if (!ex) {
    return (
      <div className="min-h-[100dvh] grid place-items-center bg-background text-white/60">
        Carregando exercício...
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white font-display">
      {/* Header com botão voltar */}
      <div className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3 flex items-center gap-3">
        <Link to="/biblioteca" className="size-10 rounded-full bg-white/5 border border-white/10 grid place-items-center text-white/80 hover:text-primary">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2">
          <img src={logoV} alt="" className="size-8" />
          <div className="leading-tight">
            <div className="text-[14px] font-extrabold tracking-tight">
              <span className="text-white">Vrum</span><span className="text-primary">Fit</span>
            </div>
            <div className="text-[8px] font-bold tracking-[0.35em] text-primary/90">PERSONAL</div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-10 max-w-md mx-auto">
        {/* Título */}
        <h1 className="text-[34px] leading-[1] font-black tracking-tight uppercase">
          {ex.name.split(" ").length > 1 ? (
            <>
              {ex.name.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-primary">{ex.name.split(" ").slice(-1)}</span>
            </>
          ) : (
            <span className="text-primary">{ex.name}</span>
          )}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-[2px] w-5 bg-primary" />
          <span className="text-[11px] tracking-[0.4em] text-white/80 font-semibold">EXECUÇÃO</span>
        </div>

        {/* Início / Fim */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <FrameCard label="INÍCIO" image={ex.image_start} />
          <FrameCard label="FIM" image={ex.image_end} />
        </div>

        {/* Músculo alvo */}
        <div className="mt-4 rounded-2xl border border-primary/40 bg-black/60 p-4 flex items-center gap-3">
          <div className="size-12 rounded-xl border border-primary/50 bg-primary/10 grid place-items-center text-primary">
            <Target className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] tracking-widest font-bold text-primary">MÚSCULO ALVO</p>
            <p className="text-[16px] font-extrabold mt-0.5">{ex.target_muscle ?? ex.exercise_categories?.name ?? "Geral"}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/50 p-3 grid grid-cols-4 gap-2">
          <Stat icon={ListChecks} label="SÉRIES" value={ex.default_sets ?? "3 – 4"} />
          <Stat icon={BarChart3} label="REPETIÇÕES" value={ex.default_reps ?? "8 – 15"} />
          <Stat icon={Clock} label="DESCANSO" value={ex.default_rest ?? "60 – 90s"} />
          <Stat icon={BarChart2} label="NÍVEL" value={({
            iniciante: "Iniciante",
            intermediario: "Intermediário",
            avancado: "Avançado",
          } as Record<string, string>)[ex.level] ?? "Todos"} />
        </div>

        {/* Execução */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-7 rounded-lg border border-primary/40 grid place-items-center text-primary">
              <Dumbbell className="size-3.5" />
            </div>
            <p className="text-[12px] font-bold tracking-widest text-primary">EXECUÇÃO</p>
          </div>
          {(ex.execution_steps ?? []).length === 0 ? (
            <p className="text-[12px] text-white/55">Passos de execução serão adicionados em breve.</p>
          ) : (
            <ul className="space-y-3">
              {(ex.execution_steps as string[]).map((step, i, arr) => (
                <li key={i}>
                  <div className="flex items-start gap-3">
                    <div className="size-5 rounded-full border border-primary/60 grid place-items-center text-primary shrink-0 mt-0.5">
                      <Check className="size-3" />
                    </div>
                    <p className="text-[12.5px] text-white/85 leading-snug flex-1">{step}</p>
                  </div>
                  {i < arr.length - 1 && <div className="h-px bg-white/8 mt-3" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer slogan */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] tracking-[0.18em] font-bold">
          <span>DISCIPLINA</span>
          <span className="text-primary">FOCO</span>
          <span>RESULTADOS</span>
        </div>
        <div className="mt-1 text-center text-[9px] tracking-[0.4em] text-white/40">
          VRUMFIT PERSONAL
        </div>
      </div>
    </div>
  );
}

function FrameCard({ label, image }: { label: string; image: string | null }) {
  return (
    <div className="relative rounded-2xl border border-white/15 bg-black/40 overflow-hidden aspect-[4/5]">
      <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-md border border-primary/50 bg-black/70 text-[10px] tracking-wider font-bold">
        {label}
      </div>
      {image ? (
        <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-white/30">
          <Dumbbell className="size-14" />
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="size-9 rounded-xl border border-primary/40 grid place-items-center text-primary">
        <Icon className="size-4" />
      </div>
      <p className="text-[9px] tracking-wider font-bold text-primary">{label}</p>
      <p className="text-[11px] text-white/85 font-semibold leading-tight">{value}</p>
    </div>
  );
}
