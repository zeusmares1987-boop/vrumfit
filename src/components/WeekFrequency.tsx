import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"];

function weekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Dom..6=Sab
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Frequência de treinos da semana — lê workout_sessions do usuário. */
export function WeekFrequency() {
  const { user } = useAuth();
  const { monday, sunday } = useMemo(weekRange, []);
  const today = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  }, []);

  const { data: sessions = [] } = useQuery({
    queryKey: ["week-sessions", user?.id, toISO(monday)],
    queryFn: async () => {
      if (!user) return [] as { session_date: string }[];
      const { data } = await supabase
        .from("workout_sessions")
        .select("session_date")
        .eq("student_id", user.id)
        .gte("session_date", toISO(monday))
        .lte("session_date", toISO(sunday));
      return (data ?? []) as { session_date: string }[];
    },
    enabled: !!user,
  });

  const doneSet = useMemo(() => {
    const s = new Set<number>();
    for (const row of sessions) {
      const d = new Date(row.session_date + "T00:00:00").getDay();
      s.add(d === 0 ? 6 : d - 1);
    }
    return s;
  }, [sessions]);

  return (
    <Link
      to="/historico"
      className="block rounded-2xl bg-surface border border-white/8 p-4 transition hover:border-primary/40"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-extrabold text-white">Frequência da semana</h3>
        <span className="text-[11px] font-bold text-primary">{doneSet.size}/7</span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {LETTERS.map((l, i) => {
          const isDone = doneSet.has(i);
          const isPast = i < today;
          const isToday = i === today;
          const isMissed = isPast && !isDone;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span
                className={[
                  "size-9 rounded-full border-2 grid place-items-center text-[12px] font-bold transition",
                  isDone
                    ? "border-primary bg-primary text-black"
                    : isToday
                      ? "border-primary text-primary"
                      : isMissed
                        ? "border-white/15 text-white/30"
                        : "border-white/20 text-white/50",
                ].join(" ")}
                aria-label={isDone ? "Treino feito" : isToday ? "Hoje" : isMissed ? "Sem treino" : "Próximo"}
              >
                {isDone ? "✓" : ""}
              </span>
              <span className="text-[11px] font-bold text-white/70">{l}</span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
