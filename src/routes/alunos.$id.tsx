import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Card } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { StoredImage } from "@/components/StoredImage";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Target, Dumbbell, Apple, ClipboardCheck, Activity, ArrowLeft, MessageCircle, CheckCircle2, FileText, Star, ClipboardList, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/alunos/$id")({
  head: () => ({ meta: [{ title: "Perfil do aluno — VRUMFIT" }] }),
  component: () => (
    <RequireAuth allow={["personal", "dono"]}>
      <AlunoDetail />
    </RequireAuth>
  ),
});

function AlunoDetail() {
  const { id } = Route.useParams();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["aluno-detail", id],
    queryFn: async () => {
      const [{ data: profile }, { data: student }, { data: workout }, { data: diet }, { data: assess }, { data: sessions }, { data: invoices }, { data: anamnese }, { data: appts }] = await Promise.all([
        supabase.from("profiles").select("full_name,email,phone,avatar_url").eq("id", id).maybeSingle(),
        supabase.from("students").select("objective,status,personal_id,created_at").eq("user_id", id).maybeSingle(),
        supabase.from("workouts").select("id,name,objective,status,created_at").eq("student_id", id).eq("status", "ativo").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("diets").select("id,name,objective,status").eq("student_id", id).eq("status", "ativo").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("assessments").select("id,date,weight_kg").eq("student_id", id).order("date", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("workout_sessions").select("id,session_date,duration_min,notes,rating,rpe,feedback").eq("student_id", id).order("session_date", { ascending: false }).limit(8),
        supabase.from("invoices").select("id,amount_cents,status,due_date").eq("student_id", id).order("due_date", { ascending: false }).limit(5),
        supabase.from("anamneses").select("*").eq("user_id", id).maybeSingle(),
        supabase.from("appointments").select("id,starts_at,duration_min,title,status").eq("student_id", id).gte("starts_at", new Date(Date.now() - 86400000).toISOString()).order("starts_at", { ascending: true }).limit(5),
      ]);
      return { profile, student, workout, diet, assess, sessions: sessions ?? [], invoices: invoices ?? [], anamnese, appts: appts ?? [] };
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Carregando…">
        <div className="min-h-[40dvh] grid place-items-center"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
      </AppShell>
    );
  }

  if (!data?.profile) {
    return (
      <AppShell title="Aluno">
        <EmptyState icon={Activity} title="Aluno não encontrado" hint="Pode ter sido removido ou você não tem acesso." />
        <Link to="/alunos" className="text-primary text-sm font-semibold flex items-center gap-1 mt-3"><ArrowLeft className="size-4" /> Voltar</Link>
      </AppShell>
    );
  }

  const { profile, student, workout, diet, assess, sessions, invoices, anamnese, appts } = data;
  const name = profile.full_name ?? "Sem nome";
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const adherence30 = sessions.filter((s) => {
    const d = new Date(s.session_date);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    return d >= cutoff;
  }).length;

  return (
    <AppShell title={name}>
      <button onClick={() => router.history.back()} className="text-primary text-[12px] font-semibold flex items-center gap-1 mb-1">
        <ArrowLeft className="size-3.5" /> Voltar
      </button>

      <PageHero
        eyebrow={student?.status ? `Aluno · ${student.status}` : "Aluno"}
        title={name}
        subtitle={student?.objective ? `Objetivo: ${student.objective}` : "Sem objetivo definido"}
        icon={Target}
        stats={[
          { label: "Treinos 30d", value: adherence30 },
          { label: "Peso", value: assess?.weight_kg ? `${assess.weight_kg}kg` : "—" },
          { label: "Avaliações", value: assess ? "✓" : "—" },
        ]}
      />

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 grid place-items-center text-primary font-black text-xl overflow-hidden shrink-0">
            {profile.avatar_url ? <StoredImage src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-extrabold truncate">{name}</p>
            {profile.email && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                <Mail className="size-3" />{profile.email}
              </p>
            )}
            {profile.phone && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Phone className="size-3" />{profile.phone}
              </p>
            )}
          </div>
        </div>
        {profile.phone && (
          <a
            href={`https://wa.me/${profile.phone.replace(/\D/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 h-11 rounded-xl bg-success/15 border border-success/40 text-success text-[12px] font-bold"
          >
            <MessageCircle className="size-4" /> ABRIR WHATSAPP
          </a>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-2">
        <DetailRow icon={Dumbbell} title="Treino ativo" value={workout?.name ?? "Nenhum"} hint={workout?.objective ?? "Sem prescrição"} to="/treinos" />
        <DetailRow icon={Apple} title="Dieta ativa" value={diet?.name ?? "Nenhuma"} hint={diet?.objective ?? "Sem prescrição"} to="/dieta" />
        <DetailRow icon={ClipboardCheck} title="Última avaliação" value={assess?.date ? new Date(assess.date).toLocaleDateString("pt-BR") : "—"} hint={assess?.weight_kg ? `${assess.weight_kg}kg` : "Sem registros"} to="/avaliacoes" />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="size-4 text-primary" />
          <h3 className="text-[12px] font-extrabold uppercase tracking-widest">Últimas sessões</h3>
        </div>
        {sessions.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">O aluno ainda não marcou nenhum treino feito.</p>
        ) : (
          <ul className="space-y-1.5">
            {sessions.map((s: any) => (
              <li key={s.id} className="glass rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold">{new Date(s.session_date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</span>
                  <div className="flex items-center gap-1.5">
                    {s.rating && (
                      <span className="flex items-center gap-0.5 text-primary text-[11px] font-bold">
                        {Array.from({ length: s.rating }).map((_, i) => <Star key={i} className="size-2.5 fill-current" />)}
                      </span>
                    )}
                    {s.rpe && <span className="text-[10px] bg-primary/15 text-primary rounded px-1.5 py-0.5 font-bold">RPE {s.rpe}</span>}
                  </div>
                </div>
                {s.feedback && <p className="text-[11px] text-muted-foreground mt-1 italic">"{s.feedback}"</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="size-4 text-primary" />
          <h3 className="text-[12px] font-extrabold uppercase tracking-widest">Anamnese</h3>
        </div>
        {!anamnese?.completed_at ? (
          <p className="text-[12px] text-muted-foreground">Aluno ainda não preencheu.</p>
        ) : (
          <div className="space-y-1.5 text-[12px]">
            {anamnese.goal && <Info label="Objetivo" value={anamnese.goal} />}
            {anamnese.has_health_issues && <Info label="Problemas de saúde" value={anamnese.health_issues || "Sim"} />}
            {anamnese.medications && <Info label="Medicamentos" value={anamnese.medications} />}
            {anamnese.injuries && <Info label="Lesões" value={anamnese.injuries} />}
            {anamnese.allergies && <Info label="Alergias" value={anamnese.allergies} />}
            {anamnese.surgeries && <Info label="Cirurgias" value={anamnese.surgeries} />}
            <div className="flex gap-3 pt-1">
              {anamnese.smokes !== null && <span className="text-[11px]">🚬 {anamnese.smokes ? "Fuma" : "Não fuma"}</span>}
              {anamnese.drinks !== null && <span className="text-[11px]">🍺 {anamnese.drinks ? "Bebe" : "Não bebe"}</span>}
              {anamnese.sleep_hours && <span className="text-[11px]">😴 {anamnese.sleep_hours}h</span>}
            </div>
            {anamnese.emergency_contact && <Info label="Emergência" value={anamnese.emergency_contact} />}
            <p className="text-[10px] text-muted-foreground pt-1">Preenchida em {new Date(anamnese.completed_at).toLocaleDateString("pt-BR")}</p>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="size-4 text-primary" />
          <h3 className="text-[12px] font-extrabold uppercase tracking-widest">Próximos horários</h3>
        </div>
        {appts.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">Nada agendado.</p>
        ) : (
          <ul className="space-y-1.5">
            {appts.map((a: any) => (
              <li key={a.id} className="flex items-center justify-between glass rounded-lg px-3 py-2">
                <span className="text-[12px] font-semibold">{new Date(a.starts_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-[10px] text-muted-foreground">{a.title} · {a.duration_min}min</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/agenda" className="mt-3 block text-center text-[11px] font-bold text-primary">Abrir agenda →</Link>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="size-4 text-primary" />
          <h3 className="text-[12px] font-extrabold uppercase tracking-widest">Faturas</h3>
        </div>
        {invoices.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">Sem faturas registradas.</p>
        ) : (
          <ul className="space-y-1.5">
            {invoices.map((i) => (
              <li key={i.id} className="flex items-center justify-between glass rounded-lg px-3 py-2">
                <div>
                  <p className="text-[12px] font-semibold">R$ {(i.amount_cents / 100).toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">Vence {new Date(i.due_date).toLocaleDateString("pt-BR")}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  i.status === "pago" ? "bg-success/20 text-success" : i.status === "atrasado" ? "bg-destructive/20 text-destructive" : "bg-muted/30 text-muted-foreground"
                }`}>{i.status}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/financeiro" className="mt-3 block text-center text-[11px] font-bold text-primary">Gerenciar faturas →</Link>
      </Card>
    </AppShell>
  );
}

function DetailRow({ icon: Icon, title, value, hint, to }: { icon: React.ComponentType<{ className?: string }>; title: string; value: string; hint: string; to: string }) {
  return (
    <Link to={to} className="glass rounded-2xl p-3.5 flex items-center gap-3 hover:border-primary/40 transition">
      <div className="size-10 rounded-xl bg-primary/10 border border-primary/40 grid place-items-center text-primary shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{title}</p>
        <p className="text-[14px] font-extrabold truncate">{value}</p>
        <p className="text-[10.5px] text-muted-foreground truncate">{hint}</p>
      </div>
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="font-semibold break-words">{value}</span>
    </div>
  );
}
