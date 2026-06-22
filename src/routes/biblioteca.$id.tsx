import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Pencil, X, Camera, Trash2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { VrumExercisePoster } from "@/components/VrumExercisePoster";
import { StoredImage, toStoredImageRef } from "@/components/StoredImage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

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
  const navigate = useNavigate();
  const { role } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<"image_start" | "image_end" | null>(null);
  const [form, setForm] = useState({ name: "", target_muscle: "", default_sets: "", default_reps: "", default_rest: "", image_start: "", image_end: "", execution_steps: "" });
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
      name: ex.name ?? "",
      target_muscle: ex.target_muscle ?? "",
      default_sets: ex.default_sets ?? "",
      default_reps: ex.default_reps ?? "",
      default_rest: ex.default_rest ?? "",
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
      name: form.name.trim() || ex.name,
      target_muscle: form.target_muscle.trim() || null,
      default_sets: form.default_sets.trim() || null,
      default_reps: form.default_reps.trim() || null,
      default_rest: form.default_rest.trim() || null,
      image_start: form.image_start.trim() || null,
      image_end: form.image_end.trim() || null,
      execution_steps: steps.length ? steps : null,
    }).eq("id", ex.id);
    setSaving(false);
    setEditing(false);
    refetch();
  }

  async function uploadExercisePhoto(file: File, field: "image_start" | "image_end") {
    if (!ex || role !== "dono") return;
    if (!file.type.startsWith("image/")) return toast.error("Escolha uma imagem.");
    setUploadingField(field);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `library/${ex.id}-${field}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("vrumfit-files").upload(path, file, { contentType: file.type });
    if (uploadError) {
      setUploadingField(null);
      return toast.error(uploadError.message);
    }
    const imageRef = toStoredImageRef(path);
    const payload = field === "image_start" ? { image_start: imageRef } : { image_end: imageRef };
    const { error } = await supabase.from("exercises").update(payload).eq("id", ex.id);
    setUploadingField(null);
    if (error) return toast.error(error.message);
    setForm((current) => ({ ...current, [field]: imageRef }));
    refetch();
    toast.success("Foto atualizada!");
  }

  async function removeExercisePhoto(field: "image_start" | "image_end") {
    if (!ex || role !== "dono") return;
    const payload = field === "image_start" ? { image_start: null } : { image_end: null };
    const { error } = await supabase.from("exercises").update(payload).eq("id", ex.id);
    if (error) return toast.error(error.message);
    setForm((current) => ({ ...current, [field]: "" }));
    refetch();
    toast.success("Foto removida.");
  }

  async function deleteExercise() {
    if (!ex || role !== "dono") return;
    if (!confirm("Apagar este exercício da biblioteca?")) return;
    const { error } = await supabase.from("exercises").delete().eq("id", ex.id);
    if (error) return toast.error(error.message);
    toast.success("Exercício apagado.");
    navigate({ to: "/biblioteca" });
  }

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
            <PhotoUploadField label="FOTO INÍCIO" value={form.image_start} loading={uploadingField === "image_start"} onFile={(file) => uploadExercisePhoto(file, "image_start")} onRemove={() => removeExercisePhoto("image_start")} />
            <PhotoUploadField label="FOTO FIM" value={form.image_end} loading={uploadingField === "image_end"} onFile={(file) => uploadExercisePhoto(file, "image_end")} onRemove={() => removeExercisePhoto("image_end")} />
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
          <VrumExercisePoster exercise={ex} />
        </div>
      </div>
    </div>
  );
}

function PhotoUploadField({ label, value, loading, onFile, onRemove }: { label: string; value: string; loading: boolean; onFile: (file: File) => void; onRemove: () => void }) {
  return (
    <div>
      <p className="text-[10px] tracking-widest font-bold text-primary mb-1.5">{label}</p>
      <label className="flex min-h-24 cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/55 p-3 transition hover:border-primary/60">
        <div className="size-20 rounded-lg border border-primary/30 bg-primary/10 grid place-items-center overflow-hidden text-primary shrink-0">
          {value ? <StoredImage src={value} alt={label} className="size-full object-cover" /> : <Camera className="size-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-black text-white">{loading ? "ENVIANDO..." : "ESCOLHER FOTO DA GALERIA"}</p>
          <p className="text-[10px] text-white/55">Toque aqui e selecione a imagem.</p>
          {value && (
            <button type="button" onClick={(e) => { e.preventDefault(); onRemove(); }} className="mt-2 rounded-lg border border-destructive/40 px-3 py-1.5 text-[10px] font-bold text-destructive">
              REMOVER FOTO
            </button>
          )}
        </div>
        <input type="file" accept="image/*" className="sr-only" disabled={loading} onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.currentTarget.value = "";
        }} />
      </label>
    </div>
  );
}

