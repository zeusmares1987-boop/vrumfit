import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Pencil, X } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { VrumExercisePoster } from "@/components/VrumExercisePoster";
import { getExercisePosterUrl } from "@/lib/exercisePosters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

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
  const { role } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ image_start: "", image_end: "", execution_steps: "" });
  const { data: ex, refetch } = useQuery({
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
  useEffect(() => {
    if (!ex) return;
    setForm({
      image_start: ex.image_start ?? "",
      image_end: ex.image_end ?? "",
      execution_steps: ((ex.execution_steps as string[] | null) ?? []).join("\n"),
    });
  }, [ex]);

  async function saveExerciseMedia() {
    if (!ex || role !== "dono") return;
    setSaving(true);
    const steps = form.execution_steps.split("\n").map((step) => step.trim()).filter(Boolean);
    await supabase.from("exercises").update({
      image_start: form.image_start.trim() || null,
      image_end: form.image_end.trim() || null,
      execution_steps: steps.length ? steps : null,
    }).eq("id", ex.id);
    setSaving(false);
    setEditing(false);
    refetch();
  }

  if (!ex) {
    return (
      <div className="min-h-[100dvh] grid place-items-center bg-background text-white/60">
        Carregando exercício...
      </div>
    );
  }

  const posterUrl = getExercisePosterUrl(ex.id);

  return (
    <div className="min-h-[100dvh] bg-black text-white font-display">
      {/* Header com botão voltar */}
      <div className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3 flex items-center gap-3">
        <Link to="/biblioteca" className="size-10 rounded-full bg-white/5 border border-white/10 grid place-items-center text-white/80 hover:text-primary">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="leading-tight">
          <div className="text-[14px] font-extrabold tracking-tight">
            <span className="text-white">Vrum</span><span className="text-primary">Fit</span>
          </div>
          <div className="text-[8px] font-bold tracking-[0.35em] text-primary/90">PERSONAL</div>
        </div>
      </div>

      <div className="px-3 pb-10 max-w-[720px] mx-auto">
        {role === "dono" && (
          <button onClick={() => setEditing((v) => !v)} className="mb-3 w-full h-11 rounded-xl border border-primary/40 bg-primary/10 text-primary text-[12px] font-bold flex items-center justify-center gap-2">
            {editing ? <X className="size-4" /> : <Pencil className="size-4" />} {editing ? "FECHAR EDIÇÃO" : "EDITAR FOTOS E PASSOS"}
          </button>
        )}

        {editing && role === "dono" && (
          <div className="mt-3 rounded-2xl border border-primary/30 bg-black/60 p-4 space-y-3">
            <EditField label="URL da foto INÍCIO" value={form.image_start} onChange={(value) => setForm((f) => ({ ...f, image_start: value }))} />
            <EditField label="URL da foto FIM" value={form.image_end} onChange={(value) => setForm((f) => ({ ...f, image_end: value }))} />
            <div>
              <p className="text-[10px] tracking-widest font-bold text-primary mb-1.5">PASSOS — UM POR LINHA</p>
              <textarea value={form.execution_steps} onChange={(e) => setForm((f) => ({ ...f, execution_steps: e.target.value }))} className="min-h-28 w-full rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-[12px] outline-none focus:border-primary/60" />
            </div>
            <button onClick={saveExerciseMedia} disabled={saving} className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[12px] font-black flex items-center justify-center gap-2 disabled:opacity-60">
              <Save className="size-4" /> {saving ? "SALVANDO..." : "SALVAR EXERCÍCIO"}
            </button>
          </div>
        )}

        <div>
          {posterUrl ? (
            <img src={posterUrl} alt={`Pôster completo do exercício ${ex.name}`} className="mx-auto w-full max-w-[691px] rounded-[22px] border border-white/10 shadow-2xl" />
          ) : (
            <VrumExercisePoster exercise={ex} />
          )}
        </div>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-widest font-bold text-primary mb-1.5 block">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-black/55 px-3 text-[12px] outline-none focus:border-primary/60" placeholder="https://... ou /__l5e/assets-v1/..." />
    </label>
  );
}

