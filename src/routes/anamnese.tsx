import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Save, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/anamnese")({
  head: () => ({ meta: [{ title: "Anamnese — VRUMFIT" }] }),
  component: () => (
    <RequireAuth allow={["aluno", "personal", "dono"]}>
      <AnamnesePage />
    </RequireAuth>
  ),
});

type Form = {
  sex: "M" | "F" | null;
  activity_factor: number | null;
  experience_level: "iniciante" | "intermediario" | "avancado" | null;
  has_health_issues: boolean | null;
  health_issues: string;
  medications: string;
  surgeries: string;
  injuries: string;
  allergies: string;
  smokes: boolean | null;
  drinks: boolean | null;
  sleep_hours: string;
  stress_level: number | null;
  activity_history: string;
  goal: string;
  emergency_contact: string;
  doctor_clearance: boolean;
  notes: string;
};

const empty: Form = {
  sex: null, activity_factor: null, experience_level: null,
  has_health_issues: null, health_issues: "", medications: "", surgeries: "",
  injuries: "", allergies: "", smokes: null, drinks: null, sleep_hours: "",
  stress_level: null, activity_history: "", goal: "", emergency_contact: "",
  doctor_clearance: false, notes: "",
};

function AnamnesePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState<Form>(empty);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const { data, isLoading } = useQuery({
    queryKey: ["anamnese", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("anamneses").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (data) {
      setF({
        sex: (data as any).sex ?? null,
        activity_factor: (data as any).activity_factor ?? null,
        experience_level: (data as any).experience_level ?? null,
        has_health_issues: data.has_health_issues,
        health_issues: data.health_issues ?? "",
        medications: data.medications ?? "",
        surgeries: data.surgeries ?? "",
        injuries: data.injuries ?? "",
        allergies: data.allergies ?? "",
        smokes: data.smokes,
        drinks: data.drinks,
        sleep_hours: data.sleep_hours?.toString() ?? "",
        stress_level: data.stress_level,
        activity_history: data.activity_history ?? "",
        goal: data.goal ?? "",
        emergency_contact: data.emergency_contact ?? "",
        doctor_clearance: !!data.doctor_clearance,
        notes: data.notes ?? "",
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { data: stu } = await supabase.from("students").select("personal_id").eq("user_id", user.id).maybeSingle();
      const payload = {
        user_id: user.id,
        personal_id: stu?.personal_id ?? null,
        sex: f.sex,
        activity_factor: f.activity_factor,
        experience_level: f.experience_level,
        has_health_issues: f.has_health_issues,
        health_issues: f.health_issues || null,
        medications: f.medications || null,
        surgeries: f.surgeries || null,
        injuries: f.injuries || null,
        allergies: f.allergies || null,
        smokes: f.smokes,
        drinks: f.drinks,
        sleep_hours: f.sleep_hours ? Number(f.sleep_hours) : null,
        stress_level: f.stress_level,
        activity_history: f.activity_history || null,
        goal: f.goal || null,
        emergency_contact: f.emergency_contact || null,
        doctor_clearance: f.doctor_clearance,
        notes: f.notes || null,
        completed_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("anamneses").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Anamnese salva!");
      qc.invalidateQueries({ queryKey: ["anamnese"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha"),
  });

  return (
    <AppShell>
      <PageHero icon={ClipboardList} title="Anamnese" subtitle="Suas informações de saúde ajudam seu personal a montar o melhor treino." />

      {data?.completed_at && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-success/40 bg-success/10 p-3 text-success">
          <CheckCircle2 className="size-5" />
          <p className="text-[13px] font-bold">Anamnese preenchida em {new Date(data.completed_at).toLocaleDateString("pt-BR")}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid place-items-center min-h-[30dvh]"><div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
          <Group title="Perfil físico (usado pelo cálculo)">
            <div>
              <p className="text-[12px] text-white/70 mb-1">Sexo biológico</p>
              <div className="flex gap-2">
                {[{ v: "M" as const, l: "Masculino" }, { v: "F" as const, l: "Feminino" }].map((o) => (
                  <button key={o.v} type="button" onClick={() => set("sex", o.v)}
                    className={`flex-1 h-10 rounded-xl border text-sm font-bold ${f.sex === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-black/30 border-white/10 text-white/70"}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] text-white/70 mb-1">Nível de atividade física diária</p>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { v: 1.2, l: "Sedentário (escritório, sem treino)" },
                  { v: 1.375, l: "Leve (1–3x/sem)" },
                  { v: 1.55, l: "Moderado (3–5x/sem)" },
                  { v: 1.725, l: "Intenso (6–7x/sem)" },
                  { v: 1.9, l: "Atleta (2x dia / trabalho físico)" },
                ].map((o) => (
                  <button key={o.v} type="button" onClick={() => set("activity_factor", o.v)}
                    className={`h-10 rounded-xl border text-[13px] font-semibold px-3 text-left ${f.activity_factor === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-black/30 border-white/10 text-white/70"}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] text-white/70 mb-1">Experiência em treino</p>
              <div className="flex gap-2">
                {[
                  { v: "iniciante" as const, l: "Iniciante" },
                  { v: "intermediario" as const, l: "Intermediário" },
                  { v: "avancado" as const, l: "Avançado" },
                ].map((o) => (
                  <button key={o.v} type="button" onClick={() => set("experience_level", o.v)}
                    className={`flex-1 h-10 rounded-xl border text-[13px] font-bold ${f.experience_level === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-black/30 border-white/10 text-white/70"}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </Group>

          <Group title="Saúde">
            <BoolField label="Tem algum problema de saúde?" value={f.has_health_issues} onChange={(v) => set("has_health_issues", v)} />
            {f.has_health_issues && <TextArea label="Quais?" value={f.health_issues} onChange={(v) => set("health_issues", v)} />}
            <TextArea label="Medicamentos em uso" value={f.medications} onChange={(v) => set("medications", v)} />
            <TextArea label="Cirurgias anteriores" value={f.surgeries} onChange={(v) => set("surgeries", v)} />
            <TextArea label="Lesões / dores" value={f.injuries} onChange={(v) => set("injuries", v)} />
            <TextArea label="Alergias" value={f.allergies} onChange={(v) => set("allergies", v)} />
            <Check label="Liberação médica para treinar" value={f.doctor_clearance} onChange={(v) => set("doctor_clearance", v)} />
          </Group>

          <Group title="Hábitos">
            <BoolField label="Fumante?" value={f.smokes} onChange={(v) => set("smokes", v)} />
            <BoolField label="Consome álcool?" value={f.drinks} onChange={(v) => set("drinks", v)} />
            <Input label="Horas de sono por noite" type="number" step="0.5" value={f.sleep_hours} onChange={(v) => set("sleep_hours", v)} />
            <Scale label="Nível de estresse (1-5)" value={f.stress_level} onChange={(v) => set("stress_level", v)} max={5} />
          </Group>

          <Group title="Treino e objetivo">
            <TextArea label="Histórico de atividade física" value={f.activity_history} onChange={(v) => set("activity_history", v)} />
            <TextArea label="Seu objetivo principal" value={f.goal} onChange={(v) => set("goal", v)} />
          </Group>

          <Group title="Outros">
            <Input label="Contato de emergência (nome + telefone)" value={f.emergency_contact} onChange={(v) => set("emergency_contact", v)} />
            <TextArea label="Observações" value={f.notes} onChange={(v) => set("notes", v)} />
          </Group>

          <button type="submit" disabled={save.isPending}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60">
            <Save className="size-4" /> {save.isPending ? "Salvando…" : "Salvar anamnese"}
          </button>
        </form>
      )}
    </AppShell>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">{title}</p>
      {children}
    </div>
  );
}
function Input({ label, value, onChange, type = "text", step }: { label: string; value: string; onChange: (v: string) => void; type?: string; step?: string }) {
  return (
    <label className="block">
      <span className="text-[12px] text-white/70">{label}</span>
      <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 rounded-xl bg-black/30 border border-white/10 px-3 text-sm focus:border-primary outline-none" />
    </label>
  );
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[12px] text-white/70">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
        className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-sm focus:border-primary outline-none resize-y" />
    </label>
  );
}
function BoolField({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div>
      <p className="text-[12px] text-white/70 mb-1">{label}</p>
      <div className="flex gap-2">
        {[{ v: true, l: "Sim" }, { v: false, l: "Não" }].map((o) => (
          <button key={o.l} type="button" onClick={() => onChange(o.v)}
            className={`flex-1 h-10 rounded-xl border text-sm font-bold ${value === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-black/30 border-white/10 text-white/70"}`}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}
function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-primary" />
      <span className="text-[13px]">{label}</span>
    </label>
  );
}
function Scale({ label, value, onChange, max }: { label: string; value: number | null; onChange: (v: number) => void; max: number }) {
  return (
    <div>
      <p className="text-[12px] text-white/70 mb-1">{label}</p>
      <div className="flex gap-1.5">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`flex-1 h-10 rounded-xl border text-sm font-bold ${value === n ? "bg-primary text-primary-foreground border-primary" : "bg-black/30 border-white/10 text-white/70"}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
