import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card } from "@/components/AppShell";
import { FileText, Upload, Trash2, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type F = { name: string; size: number; updated_at: string; id: string };

export const Route = createFileRoute("/arquivos")({
  head: () => ({ meta: [{ title: "Arquivos — VRUMFIT" }] }),
  component: Files,
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
    else {
      toast.success("Arquivo enviado");
      refresh();
    }
  };

  const remove = async (name: string) => {
    if (!uid) return;
    const { error } = await supabase.storage.from(BUCKET).remove([`${uid}/${name}`]);
    if (error) toast.error(error.message);
    else {
      setList((l) => l.filter((x) => x.name !== name));
      toast.success("Removido");
    }
  };

  const download = async (name: string) => {
    if (!uid) return;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(`${uid}/${name}`, 60);
    if (error || !data) return toast.error(error?.message ?? "Erro");
    window.open(data.signedUrl, "_blank");
  };

  const sizeFmt = (b: number) => (b < 1024 ? `${b}B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1024 ** 2).toFixed(1)}MB`);

  return (
    <AppShell title="Arquivos" subtitle={`${list.length} documento(s)`}
      action={
        <label className={`size-10 rounded-full bg-primary text-primary-foreground grid place-items-center cursor-pointer ${uploading ? "opacity-60" : ""}`}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          <input type="file" onChange={onUpload} className="hidden" disabled={uploading} />
        </label>
      }>
      <Card className="text-center text-xs text-muted-foreground">
        Armazenamento seguro · seus arquivos só são visíveis para você e sua equipe
      </Card>
      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-primary" /></div>
      ) : list.length === 0 ? (
        <Card className="text-center text-sm text-muted-foreground">Nenhum arquivo ainda. Toque em + para enviar.</Card>
      ) : (
        <ul className="space-y-2">
          {list.map((f) => (
            <li key={f.id} className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/15 border border-primary/25 grid place-items-center">
                <FileText className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{f.name.replace(/^\d+-/, "")}</p>
                <p className="text-[10px] text-muted-foreground">{sizeFmt(f.size)} · {f.updated_at?.slice(0, 10)}</p>
              </div>
              <button onClick={() => download(f.name)} className="text-muted-foreground hover:text-primary">
                <Download className="size-4" />
              </button>
              <button onClick={() => remove(f.name)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
