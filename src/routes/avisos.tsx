import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type N = { id: string; title: string; message: string; audience: string; created_at: string; created_by: string };

export const Route = createFileRoute("/avisos")({
  head: () => ({ meta: [{ title: "Avisos — VRUMFIT" }] }),
  component: Avisos,
});

function Avisos() {
  const { user, role } = useAuth();
  const [list, setList] = useState<N[]>([]);
  const [form, setForm] = useState({ title: "", message: "", audience: "todos" });
  const [show, setShow] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("notices").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setList((data ?? []) as N[]);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !user) return;
    const { error } = await supabase.from("notices").insert({
      title: form.title, message: form.message, audience: form.audience as any,
      created_by: user.id, status: "publicado" as any,
    });
    if (error) return toast.error(error.message);
    setForm({ title: "", message: "", audience: "todos" });
    setShow(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList(list.filter((x) => x.id !== id));
  };

  const canPost = role === "dono" || role === "personal";

  return (
    <AppShell title="Avisos" subtitle="Comunicados internos"
      action={canPost ? (
        <button onClick={() => setShow(!show)} className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center">
          <Plus className="size-4" />
        </button>
      ) : undefined}>
      {show && (
        <Card className="p-3">
          <form onSubmit={add} className="space-y-2">
            <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            <textarea placeholder="Mensagem" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${inputCls} min-h-[80px] py-2`} />
            <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className={inputCls}>
              <option value="todos">Todos</option>
              <option value="alunos">Alunos</option>
              <option value="personais">Personais</option>
            </select>
            <button className={btnPrimary}>PUBLICAR</button>
          </form>
        </Card>
      )}
      <div className="space-y-2">
        {list.map((n) => (
          <div key={n.id} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4 text-primary" />
                <p className="text-sm font-bold">{n.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString("pt-BR")}</span>
                {(role === "dono" || n.created_by === user?.id) && (
                  <button onClick={() => remove(n.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap">{n.message}</p>
          </div>
        ))}
        {list.length === 0 && <p className="text-center text-xs text-white/50 py-6">Sem avisos.</p>}
      </div>
    </AppShell>
  );
}
