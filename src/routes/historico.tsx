import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Dumbbell, Star } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/historico")({
  head: () => ({ meta: [{ title: "Histórico de treinos — VRUMFIT" }] }),
  component: () => (
    <RequireAuth allow={["aluno", "personal", "dono"]}>
      <HistoricoPage />
    </RequireAuth>
  ),
});

const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function HistoricoPage() {
  const { user } = useAuth();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthStart = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1), [cursor]);
  const monthEnd = useMemo(() => new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0), [cursor]);

  const { data: sessions = [] } = useQuery({
    queryKey: ["my-sessions", user?.id, ymd(monthStart), ymd(monthEnd)],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("workout_sessions")
        .select("id,session_date,duration_min,notes,rating,rpe")
        .eq("student_id", user.id)
        .gte("session_date", ymd(monthStart))
        .lte("session_date", ymd(monthEnd))
        .order("session_date", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const doneSet = useMemo(() => new Set(sessions.map((s) => s.session_date)), [sessions]);

  const cells = useMemo(() => {
    const firstDow = monthStart.getDay();
    const total = monthEnd.getDate();
    const arr: Array<{ day: number | null; date: string | null }> = [];
    for (let i = 0; i < firstDow; i++) arr.push({ day: null, date: null });
    for (let d = 1; d <= total; d++) {
      const date = ymd(new Date(cursor.getFullYear(), cursor.getMonth(), d));
      arr.push({ day: d, date });
    }
    while (arr.length % 7 !== 0) arr.push({ day: null, date: null });
    return arr;
  }, [monthStart, monthEnd, cursor]);

  const todayStr = ymd(today);
  const totalMes = sessions.length;

  return (
    <AppShell>
      <div className="flex items-center gap-3 mb-3">
        <Link to="/student" className="size-9 grid place-items-center rounded-xl bg-white/5 border border-white/10">
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-lg font-extrabold">Histórico de treinos</h1>
          <p className="text-xs text-white/60">Seus dias treinados aparecem com bolinha</p>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="size-9 grid place-items-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold capitalize">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</p>
            <p className="text-[11px] text-primary font-semibold">{totalMes} {totalMes === 1 ? "treino" : "treinos"}</p>
          </div>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="size-9 grid place-items-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEK.map((w, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-white/40 py-1">{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => {
            if (!c.day) return <div key={i} className="aspect-square" />;
            const done = c.date ? doneSet.has(c.date) : false;
            const isToday = c.date === todayStr;
            return (
              <div
                key={i}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[12px] relative ${
                  isToday ? "bg-white/10 border border-primary/60" : "bg-white/[0.03]"
                }`}
              >
                <span className={done ? "font-bold text-white" : "text-white/70"}>{c.day}</span>
                {done && <span className="mt-0.5 size-1.5 rounded-full bg-primary" />}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-3 text-[11px] text-white/60">
          <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> Treinou</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-md border border-primary/60" /> Hoje</span>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-sm font-bold mb-2 text-white/80">Sessões do mês</h2>
        {sessions.length === 0 ? (
          <div className="rounded-2xl bg-card border border-white/10 p-6 text-center text-sm text-white/60">
            Nenhum treino registrado neste mês.
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => {
              const d = new Date(s.session_date + "T00:00:00");
              const label = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
              return (
                <li key={s.id} className="rounded-2xl bg-card border border-white/10 p-3 flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/15 border border-primary/30 grid place-items-center text-primary">
                    <Dumbbell className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold capitalize">{label}</p>
                    <p className="text-[11px] text-white/60 truncate">
                      {s.duration_min ? `${s.duration_min} min` : "Treino concluído"}
                      {s.rpe ? ` • RPE ${s.rpe}` : ""}
                      {s.notes ? ` • ${s.notes}` : ""}
                    </p>
                  </div>
                  {s.rating ? (
                    <div className="flex items-center gap-0.5 text-primary">
                      <Star className="size-3.5 fill-current" />
                      <span className="text-xs font-bold">{s.rating}</span>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
