import { BarChart2, BarChart3, Check, Clock, ListChecks, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface VrumExercisePosterData {
  name: string;
  target_muscle?: string | null;
  level?: string | null;
  default_sets?: string | null;
  default_reps?: string | null;
  default_rest?: string | null;
  image_start?: string | null;
  image_end?: string | null;
  execution_steps?: string[] | null;
  exercise_categories?: { name?: string | null } | null;
}

interface VrumExercisePosterProps {
  exercise: VrumExercisePosterData;
  compact?: boolean;
}

const levelLabels: Record<string, string> = {
  iniciante: "INICIANTE",
  intermediario: "INTERMEDIÁRIO",
  avancado: "AVANÇADO",
};

export function VrumExercisePoster({ exercise, compact = false }: VrumExercisePosterProps) {
  const target = exercise.target_muscle ?? exercise.exercise_categories?.name ?? "GERAL";
  const steps = exercise.execution_steps?.filter(Boolean) ?? [];
  const shellRef = useRef<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (compact || !shellRef.current) return;
    const element = shellRef.current;
    const updateScale = () => setScale(Math.min(1, element.clientWidth / 691));
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, [compact]);

  if (compact) {
    return <CompactPoster exercise={exercise} />;
  }

  return (
    <article ref={shellRef} className="vrum-poster-shell relative mx-auto overflow-hidden rounded-[22px] border border-border bg-background text-foreground shadow-2xl">
      <div className="vrum-poster-canvas relative flex flex-col bg-background px-6 py-8 font-display" style={{ transform: `scale(${scale})` }}>
        <PosterHeader name={exercise.name} />
        <PosterPhotos start={exercise.image_start} end={exercise.image_end ?? exercise.image_start} name={exercise.name} />
        <TargetBand target={target} />
        <StatsBand exercise={exercise} />
        <ExecutionBand steps={steps} />
        <PosterFooter />
      </div>
    </article>
  );
}

function CompactPoster({ exercise }: { exercise: VrumExercisePosterData }) {
  return (
    <article className="relative aspect-[4/3] overflow-hidden bg-background text-foreground">
      <div className="grid h-full grid-cols-2 gap-1.5 p-1.5">
        <CompactPhoto label="INÍCIO" image={exercise.image_start} name={exercise.name} />
        <CompactPhoto label="FIM" image={exercise.image_end ?? exercise.image_start} name={exercise.name} />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/85 to-transparent p-2.5 pt-10">
        <p className="truncate text-[12px] font-black italic uppercase leading-tight">
          {exercise.name}
        </p>
        <p className="truncate text-[10px] font-black italic uppercase text-primary">
          {exercise.target_muscle ?? exercise.exercise_categories?.name ?? "EXECUÇÃO"}
        </p>
      </div>
    </article>
  );
}

function CompactPhoto({ label, image, name }: { label: string; image?: string | null; name: string }) {
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-border bg-card">
      <div className="absolute left-2 top-2 z-10 skew-x-[-12deg] rounded-[4px] border border-primary bg-background/75 px-2 py-0.5 text-[9px] font-black italic">
        <span className="block skew-x-[12deg]">{label}</span>
      </div>
      {image ? (
        <SafeImage src={image} alt={`${label} — ${name}`} className="h-full w-full object-cover grayscale contrast-125 saturate-125" size="small" />
      ) : (
        <div className="grid h-full place-items-center text-primary">
          <Target className="size-8" />
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_30%)] mix-blend-screen" />
    </div>
  );
}

function PosterHeader({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop() : "";
  const first = parts.join(" ") || name;

  return (
    <header className="shrink-0">
      <div className="text-[54px] font-black italic leading-none tracking-normal">
        <span>Vrum</span><span className="text-primary">Fit</span>
      </div>
      <div className="ml-10 mt-1 text-[16px] font-bold tracking-[0.7em] text-foreground/80">PERSONAL</div>
      <h1 className="mt-12 text-[58px] font-black italic uppercase leading-[0.95] tracking-normal">
        <span>{first}</span>{last && <span className="text-primary"> {last}</span>}
      </h1>
      <div className="mt-3 flex items-center gap-3">
        <span className="h-1 w-8 bg-primary" />
        <span className="text-[23px] font-bold italic uppercase tracking-[0.25em] text-foreground/80">EXECUÇÃO</span>
      </div>
    </header>
  );
}

function PosterPhotos({ start, end, name }: { start?: string | null; end?: string | null; name: string }) {
  return (
    <section className="mt-7 grid grid-cols-2 gap-3">
      <PhotoFrame label="INÍCIO" image={start} alt={`Início do exercício ${name}`} />
      <PhotoFrame label="FIM" image={end} alt={`Fim do exercício ${name}`} />
    </section>
  );
}

function PhotoFrame({ label, image, alt }: { label: string; image?: string | null; alt: string }) {
  return (
    <div className="relative h-[420px] overflow-hidden rounded-[15px] border border-border bg-card">
      <div className="absolute left-3 top-4 z-10 skew-x-[-12deg] rounded-[5px] border border-primary px-7 py-2 text-[20px] font-black italic tracking-[0.08em]">
        <span className="block skew-x-[12deg]">{label}</span>
      </div>
      {image ? (
        <SafeImage src={image} alt={alt} className="h-full w-full object-cover object-center grayscale contrast-125 saturate-125" size="large" />
      ) : (
        <div className="grid h-full place-items-center bg-card text-primary">
          <Target className="size-20 opacity-80" />
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,color-mix(in_oklab,var(--primary)_24%,transparent),transparent_28%)] mix-blend-screen" />
    </div>
  );
}

function SafeImage({ src, alt, className, size }: { src: string; alt: string; className: string; size: "small" | "large" }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-card text-primary">
        <Target className={size === "large" ? "size-20 opacity-80" : "size-8 opacity-80"} />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

function TargetBand({ target }: { target: string }) {
  return (
    <section className="mt-5 flex h-[154px] items-center overflow-hidden rounded-[15px] border border-primary/55 bg-card/60 px-6">
      <div className="grid size-24 shrink-0 place-items-center rounded-full border border-primary text-primary">
        <Target className="size-12" />
      </div>
      <div className="ml-7 flex-1">
        <p className="text-[20px] font-black italic uppercase text-primary">MÚSCULO ALVO</p>
        <p className="mt-1 text-[25px] font-black italic uppercase text-foreground">{target}</p>
      </div>
      <div className="relative h-full w-36 opacity-90">
        <div className="absolute bottom-0 left-8 h-32 w-10 rounded-full bg-primary/80 blur-[1px]" />
        <div className="absolute bottom-0 right-8 h-32 w-10 rounded-full bg-primary/80 blur-[1px]" />
      </div>
    </section>
  );
}

function StatsBand({ exercise }: { exercise: VrumExercisePosterData }) {
  const stats = [
    { icon: ListChecks, label: "SÉRIES", value: exercise.default_sets ?? "3 – 4" },
    { icon: BarChart3, label: "REPETIÇÕES", value: exercise.default_reps ?? "8 – 15" },
    { icon: Clock, label: "DESCANSO", value: exercise.default_rest ?? "60 – 90s" },
    { icon: BarChart2, label: "NÍVEL", value: levelLabels[exercise.level ?? ""] ?? "TODOS" },
  ];

  return (
    <section className="mt-4 grid h-[172px] grid-cols-4 rounded-[15px] border border-border bg-card/55 px-3 py-5">
      {stats.map(({ icon: Icon, label, value }, index) => (
        <div key={label} className="flex flex-col items-center justify-center border-border text-center [&:not(:last-child)]:border-r">
          <Icon className="size-11 text-primary" />
          <p className="mt-3 text-[16px] font-black italic uppercase text-primary">{label}</p>
          <p className="mt-2 text-[20px] font-semibold italic uppercase leading-tight text-foreground">{value}</p>
        </div>
      ))}
    </section>
  );
}

function ExecutionBand({ steps }: { steps: string[] }) {
  const visibleSteps = steps.length ? steps.slice(0, 6) : ["Execução detalhada em revisão pelo treinador."];
  return (
    <section className="mt-4 flex-1 rounded-[15px] border border-border bg-card/50 px-6 py-5">
      <div className="mb-5 flex items-center gap-3 text-primary">
        <Target className="size-8" />
        <p className="text-[20px] font-black italic uppercase">EXECUÇÃO</p>
      </div>
      <ul className="space-y-3">
        {visibleSteps.map((step, index) => (
          <li key={`${step}-${index}`} className="flex items-start gap-5 border-b border-border pb-3 last:border-b-0">
            <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full border border-primary text-primary">
              <Check className="size-4" />
            </span>
            <p className="text-[18px] italic leading-snug text-foreground/85">{step}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PosterFooter() {
  return (
    <footer className="mt-4 text-center">
      <div className="mx-auto h-px w-[92%] bg-primary/50 shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_80%,transparent)]" />
      <p className="mt-4 text-[22px] font-black italic uppercase tracking-[0.12em]">
        DISCIPLINA <span className="text-primary">FOCO</span> RESULTADOS
      </p>
      <p className="mt-2 text-[12px] font-semibold tracking-[0.65em] text-foreground/55">VRUMFIT PERSONAL</p>
    </footer>
  );
}