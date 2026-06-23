import { useMemo } from "react";

type Props = {
  /** Dias da semana com treino feito (0=Seg ... 6=Dom) */
  done?: number[];
  /** Dia faltado / alerta */
  missed?: number[];
};

const LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"];

/** Frequência da semana — estilo MFit. */
export function WeekFrequency({ done = [], missed = [] }: Props) {
  const today = useMemo(() => {
    // Seg=0 ... Dom=6
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  }, []);

  return (
    <section className="rounded-2xl bg-surface border border-white/8 p-4">
      <h3 className="text-[14px] font-extrabold text-white">Frequência de Treinos</h3>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {LETTERS.map((l, i) => {
          const isDone = done.includes(i);
          const isMissed = missed.includes(i);
          const isToday = i === today;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span
                className={[
                  "size-9 rounded-full border-2 grid place-items-center text-[12px] font-bold transition",
                  isDone
                    ? "border-primary bg-primary text-black"
                    : isMissed
                      ? "border-destructive text-destructive"
                      : isToday
                        ? "border-primary text-primary"
                        : "border-white/25 text-white/40",
                ].join(" ")}
                aria-label={
                  isDone ? "Treino feito" : isMissed ? "Treino perdido" : isToday ? "Hoje" : "Sem treino"
                }
              >
                {isMissed ? "!" : ""}
              </span>
              <span className="text-[11px] font-bold text-white/70">{l}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
