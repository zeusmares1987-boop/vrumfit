import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { FileText, Upload, Trash2, Download, Loader2, FolderOpen, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type F = { name: string; size: number; updated_at: string; id: string };

export const Route = createFileRoute("/arquivos")({
  head: () => ({ meta: [{ title: "Arquivos — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <Files />
    </RequireAuth>
  ),
});

const BUCKET = "vrumfit-files";

function Files() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [list, setList] = useState<F[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const refresh = async () => {
    if (!uid) return;
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).list(uid, {
      sortBy: { column: "updated_at", order: "desc" },
      limit: 100,
    });
    if (error) toast.error(error.message);
    else
      setList(
        (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder").map((f) => ({
          name: f.name,
          size: (f.metadata as { size?: number } | null)?.size ?? 0,
          updated_at: f.updated_at ?? "",
          id: f.id ?? f.name,
        })),
      );
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !uid) return;
    setUploading(true);
    const path = `${uid}/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, { upsert: false });
    setUploading(false);
    e.target.value = "";
    if (error) toast.error(error.message);
    else { toast.success("Arquivo enviado"); refresh(); }
  };

  const remove = async (name: string) => {
    if (!uid || !confirm("Remover arquivo?")) return;
    const { error } = await supabase.storage.from(BUCKET).remove([`${uid}/${name}`]);
    if (error) toast.error(error.message);
    else { setList((l) => l.filter((x) => x.name !== name)); toast.success("Removido"); }
  };

  const download = async (name: string) => {
    if (!uid) return;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(`${uid}/${name}`, 60);
    if (error || !data) return toast.error(error?.message ?? "Erro");
    window.open(data.signedUrl, "_blank");
  };

  const sizeFmt = (b: number) => (b < 1024 ? `${b}B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1024 ** 2).toFixed(1)}MB`);
  const totalSize = list.reduce((a, b) => a + b.size, 0);

  return (
    <AppShell title="Arquivos">
      <PageHero
        eyebrow="Documentos"
        title="Arquivos"
        subtitle="PDFs, planilhas e imagens da sua equipe"
        icon={FolderOpen}
        stats={[
          { label: "Arquivos", value: list.length },
          { label: "Espaço", value: sizeFmt(totalSize) },
          { label: "Limite", value: "1 GB" },
        ]}
        action={
          <label className={`size-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center cursor-pointer shadow-lg shadow-primary/40 hover:scale-105 transition ${uploading ? "opacity-60" : ""}`}>
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
            <input type="file" onChange={onUpload} className="hidden" disabled={uploading} />
          </label>
        }
      />

      <div className="flex items-center gap-2 rounded-2xl border border-primary/25 bg-primary/5 p-3">
        <Shield className="size-4 text-primary shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          Armazenamento privado — só você e sua equipe podem ver.
        </p>
      </div>

      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>
      ) : list.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Nenhum arquivo ainda" hint="Toque no botão de upload para enviar o primeiro." />
      ) : (
        <ul className="space-y-2">
          {list.map((f) => (
            <li key={f.id} className="glass rounded-2xl p-3 flex items-center gap-3 hover:border-primary/40 transition">
              <div className="size-11 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/30 grid place-items-center shrink-0">
                <FileText className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{f.name.replace(/^\d+-/, "")}</p>
                <p className="text-[10px] text-muted-foreground">{sizeFmt(f.size)} · {f.updated_at?.slice(0, 10)}</p>
              </div>
              <button onClick={() => download(f.name)} className="size-9 rounded-xl glass grid place-items-center text-muted-foreground hover:text-primary">
                <Download className="size-4" />
              </button>
              <button onClick={() => remove(f.name)} className="size-9 rounded-xl glass grid place-items-center text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
