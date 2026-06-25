import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Plus, Clock, MapPin, X, CheckCircle2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/agenda")({
  head: () => ({ meta: [{ title: "Agenda — VRUMFIT" }] }),
  component: () => (
    <RequireAuth allow={["aluno", "personal", "dono"]}>
      <AgendaPage />
    </RequireAuth>
  ),
});

function AgendaPage() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const isPersonal = role === "personal" || role === "dono";
  const [open, setOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["appointments", user?.id, role],
    queryFn: async () => {
      if (!user) return [];
      let q = supabase
        .from("appointments")
        .select("id,starts_at,duration_min,title,location,notes,status,personal_id,student_id")
        .order("starts_at", { ascending: true });
      if (role === "aluno") q = q.eq("student_id", user.id);
      else if (role === "personal") q = q.eq("personal_id", user.id);
      const { data } = await q;
      if (!data?.length) return [];
      const userIds = Array.from(new Set(data.flatMap((a) => [a.student_id, a.personal_id])));
      const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", userIds);
      const map = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
      return data.map((a) => ({
        ...a,
        student_name: map.get(a.student_id) ?? "Aluno",
        personal_name: map.get(a.personal_id) ?? "Personal",
      }));
    },
    enabled: !!user,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from("appointments").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["appointments"] }); },
    onError: (e: any) => toast.error(e.message ?? "Falha"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["appointments"] }); },
    onError: (e: any) => toast.error(e.message ?? "Falha"),
  });

  const now = Date.now();
  const upcoming = items.filter((a) => new Date(a.starts_at).getTime() >= now - 3600_000);
  const past = items.filter((a) => new Date(a.starts_at).getTime() < now - 3600_000).slice(-10).reverse();
  const todayCount = upcoming.filter((a) => new Date(a.starts_at).toDateString() === new Date().toDateString()).length;

  return (
    <AppShell>
      <PageHero
        eyebrow="Calendário"
        icon={CalendarDays}
        title="Agenda"
        subtitle={isPersonal ? "Seus horários com alunos." : "Seus horários com o personal."}
        stats={[
          { label: "Hoje", value: todayCount },
          { label: "Próximos", value: upcoming.length },
          { label: "Histórico", value: past.length },
        ]}
        action={isPersonal ? (
          <button onClick={() => setOpen(true)} aria-label="Novo horário"
            className="size-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/40 hover:scale-105 transition">
            <Plus className="size-5" />
          </button>
        ) : undefined}
      />


      {isLoading ? (
        <div className="grid place-items-center min-h-[30dvh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Sem horários" hint={isPersonal ? "Toque em Novo para agendar." : "Seu personal ainda não agendou."} />
      ) : (
        <>
          <Section title="Próximos">
            {upcoming.length === 0 ? <p className="text-[13px] text-muted-foreground">Nada agendado.</p> : upcoming.map((a) => (
              <Card key={a.id} appt={a} isPersonal={isPersonal} onDone={() => update.mutate({ id: a.id, patch: { status: "concluido" } })}
                onCancel={() => update.mutate({ id: a.id, patch: { status: "cancelado" } })}
                onDelete={() => confirm("Excluir?") && remove.mutate(a.id)} />
            ))}
          </Section>
          {past.length > 0 && (
            <Section title="Histórico">
              {past.map((a) => <Card key={a.id} appt={a} isPersonal={isPersonal} past />)}
            </Section>
          )}
        </>
      )}

      {open && isPersonal && <NewModal onClose={() => setOpen(false)} onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["appointments"] }); }} />}
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-block w-1 h-4 bg-primary rounded-full" />
        <h3 className="text-[14px] font-extrabold">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Card({ appt, isPersonal, past, onDone, onCancel, onDelete }: any) {
  const d = new Date(appt.starts_at);
  const dateLabel = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  const timeLabel = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const statusColor = appt.status === "concluido" ? "text-success border-success/40 bg-success/10"
    : appt.status === "cancelado" ? "text-muted-foreground border-border bg-muted/30 line-through"
    : "text-primary border-primary/40 bg-primary/10";

  return (
    <div className={`rounded-2xl border p-3 transition hover:border-primary/60 ${past ? "opacity-70" : ""} ${statusColor}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 size-12 rounded-xl bg-background/60 border border-current grid place-items-center">
          <div className="text-center leading-none">
            <div className="text-[9px] uppercase">{dateLabel.split(",")[0]}</div>
            <div className="text-[16px] font-black mt-0.5">{d.getDate()}</div>
          </div>
        </div>
        <div className="flex-1 min-w-0 text-foreground">
          <p className="text-[14px] font-extrabold truncate">{appt.title}</p>
          <p className="text-[11.5px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="size-3" /> {timeLabel} · {appt.duration_min}min
          </p>
          <p className="text-[11.5px] text-muted-foreground truncate">
            {isPersonal ? `Aluno: ${appt.student_name}` : `Personal: ${appt.personal_name}`}
          </p>
          {appt.location && <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="size-3" />{appt.location}</p>}
        </div>
      </div>
      {!past && isPersonal && appt.status === "agendado" && (
        <div className="mt-3 flex gap-2">
          <button onClick={onDone} className="flex-1 h-9 rounded-xl bg-success/15 border border-success/40 text-success text-[12px] font-bold flex items-center justify-center gap-1 hover:bg-success/25 transition">
            <CheckCircle2 className="size-3.5" /> Concluído
          </button>
          <button onClick={onCancel} className="flex-1 h-9 rounded-xl bg-muted/40 border border-border text-muted-foreground text-[12px] font-bold flex items-center justify-center gap-1 hover:text-foreground transition">
            <X className="size-3.5" /> Cancelar
          </button>
          <button onClick={onDelete} aria-label="Excluir" className="h-9 px-3 rounded-xl bg-destructive/15 border border-destructive/40 text-destructive hover:bg-destructive/25 transition">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function NewModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("08:00");
  const [duration, setDuration] = useState("60");
  const [title, setTitle] = useState("Sessão");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const { data: students = [] } = useQuery({
    queryKey: ["my-students-list", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("students").select("user_id").eq("personal_id", user.id).eq("status", "ativo");
      if (!data?.length) return [];
      const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", data.map((s) => s.user_id));
      return profs ?? [];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user || !studentId) throw new Error("Selecione o aluno");
      const starts_at = new Date(`${date}T${time}:00`).toISOString();
      const { error } = await supabase.from("appointments").insert({
        personal_id: user.id, student_id: studentId, starts_at,
        duration_min: Number(duration), title, location: location || null, notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Horário criado!"); onSaved(); },
    onError: (e: any) => toast.error(e.message ?? "Falha"),
  });

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-end sm:place-items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-primary/20 p-5 max-h-[90dvh] overflow-y-auto shadow-2xl shadow-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold">Novo horário</h3>
          <button onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground transition"><X className="size-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
          <Field label="Aluno">
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required
              className="mt-1 w-full h-10 rounded-xl bg-background/60 border border-border px-3 text-sm focus:border-primary outline-none">
              <option value="">Selecione…</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Data"><Inp type="date" value={date} onChange={setDate} /></Field>
            <Field label="Hora"><Inp type="time" value={time} onChange={setTime} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Duração (min)"><Inp type="number" value={duration} onChange={setDuration} /></Field>
            <Field label="Título"><Inp value={title} onChange={setTitle} /></Field>
          </div>
          <Field label="Local (opcional)"><Inp value={location} onChange={setLocation} /></Field>
          <Field label="Observações"><Inp value={notes} onChange={setNotes} /></Field>
          <button type="submit" disabled={create.isPending}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold uppercase tracking-wider disabled:opacity-60 hover:opacity-95 transition">
            {create.isPending ? "Salvando…" : "Agendar"}
          </button>
        </form>
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[12px] text-muted-foreground">{label}</span>{children}</label>;
}
function Inp({ value, onChange, type = "text" }: { value: string; onChange: (v: string) => void; type?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full h-10 rounded-xl bg-background/60 border border-border px-3 text-sm focus:border-primary outline-none transition" />;
}
