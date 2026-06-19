import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { useLocalState } from "@/hooks/use-local-state";
import { FileText, Upload, Trash2 } from "lucide-react";

type F = { id: string; name: string; size: string; type: string; date: string };

export const Route = createFileRoute("/arquivos")({
  head: () => ({ meta: [{ title: "Arquivos — VRUMFIT" }] }),
  component: Files,
});

const seed: F[] = [
  { id: "1", name: "Anamnese-Marina.pdf", size: "240 KB", type: "PDF", date: "10/06" },
  { id: "2", name: "Avaliacao-Lucas.pdf", size: "180 KB", type: "PDF", date: "08/06" },
  { id: "3", name: "Contrato-Personal.docx", size: "60 KB", type: "DOC", date: "01/06" },
];

function Files() {
  const [list, setList] = useLocalState<F[]>("vrumfit:files", seed);

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const d = new Date();
    setList([{
      id: crypto.randomUUID(),
      name: f.name,
      size: `${Math.round(f.size / 1024)} KB`,
      type: f.name.split(".").pop()?.toUpperCase() ?? "FILE",
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
    }, ...list]);
    e.target.value = "";
  };

  return (
    <AppShell title="Arquivos" subtitle={`${list.length} documentos`}
      action={
        <label className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center cursor-pointer">
          <Upload className="size-4" />
          <input type="file" onChange={onUpload} className="hidden" />
        </label>
      }>
      <Card className="text-center text-xs text-muted-foreground">
        Limite local: 5 MB por arquivo · armazenado no dispositivo
      </Card>
      <ul className="space-y-2">
        {list.map((f) => (
          <li key={f.id} className="glass rounded-xl p-3 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/15 border border-primary/25 grid place-items-center">
              <FileText className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{f.name}</p>
              <p className="text-[10px] text-muted-foreground">{f.type} · {f.size} · {f.date}</p>
            </div>
            <button onClick={() => setList(list.filter((x) => x.id !== f.id))} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
