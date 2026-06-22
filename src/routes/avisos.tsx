import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Megaphone, Plus, Trash2, X, Users } from "lucide-react";
import { toast } from "sonner";

type N = { id: string; title: string; message: string; audience: string; created_at: string; created_by: string };

export const Route = createFileRoute("/avisos")({
  head: () => ({ meta: [{ title: "Avisos — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <Avisos />
    </RequireAuth>
  ),
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
    if (!confirm("Remover aviso?")) return;
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList(list.filter((x) => x.id !== id));
  };

  const canPost = role === "dono" || role === "personal";
  const today = list.filter((n) => new Date(n.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <AppShell title="Avisos">
      <PageHero
        eyebrow="Comunicados"
        title="Avisos"
        subtitle="Mensagens internas da sua academia"
        icon={Megaphone}
        stats={[
          { label: "Total", value: list.length },
          { label: "Hoje", value: today },
          { label: "Audiência", value: "Todos" },
        ]}
        action={canPost ? (
          <button onClick={() => setShow(!show)} className="size-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/40 hover:scale-105 transition">
            {show ? <X className="size-5" /> : <Plus className="size-5" />}
          </button>
        ) : undefined}
      />

      {show && (
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-3">Novo aviso</p>
          <form onSubmit={add} className="space-y-2">
            <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            <textarea placeholder="Mensagem" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${inputCls} min-h-[100px] py-2`} />
            <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className={inputCls}>
              <option value="todos">Todos</option>
              <option value="alunos">Alunos</option>
              <option value="personais">Personais</option>
            </select>
            <button className={btnPrimary}>PUBLICAR</button>
          </form>
        </Card>
      )}

      {list.length === 0 ? (
        <EmptyState icon={Megaphone} title="Nenhum aviso ainda" hint={canPost ? "Toque no + para publicar o primeiro." : "Você receberá comunicados aqui."} />
      ) : (
        <div className="space-y-2">
          {list.map((n) => (
            <div key={n.id} className="glass rounded-2xl p-4 hover:border-primary/40 transition">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/15 border border-primary/30">
                    <Megaphone className="size-4 text-primary" />
                  </span>
                  <p className="text-sm font-bold truncate">{n.title}</p>
                </div>
                {(role === "dono" || n.created_by === user?.id) && (
                  <button onClick={() => remove(n.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{n.message}</p>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1">
                  <Users className="size-2.5" /> {n.audience}
                </span>
                <span>·</span>
                <span>{new Date(n.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
