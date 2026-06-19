import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const faqs = [
  { q: "Como prescrever um treino?", a: "Vá em Treinos, escolha frequência e objetivo, clique em Gerar Planilha e exporte." },
  { q: "Posso editar a dieta gerada?", a: "Sim. A geração é uma sugestão calculada — adapte os itens antes de exportar." },
  { q: "Os dados ficam salvos?", a: "Sim, todos os dados sincronizam na nuvem entre seus dispositivos." },
  { q: "Como cancelo a conta de um aluno?", a: "Abra Alunos, toque na lixeira ao lado do nome (apenas Dono)." },
];

type Ticket = { id: string; subject: string; message: string; status: string; created_at: string };

export const Route = createFileRoute("/suporte")({
  head: () => ({ meta: [{ title: "Suporte — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <Sup />
    </RequireAuth>
  ),
});

function Sup() {
  const { user } = useAuth();
  const [open, setOpen] = useState<number | null>(0);
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTickets((data ?? []) as Ticket[]);
  };
  useEffect(() => { load(); }, [user?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject || !msg) return;
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id, subject, message: msg, status: "aberto",
    });
    if (error) return toast.error(error.message);
    toast.success("Ticket enviado!");
    setSubject(""); setMsg("");
    load();
  };

  return (
    <AppShell title="Suporte" subtitle="FAQ e contato direto">
      <Card className="p-3">
        <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Perguntas frequentes</h3>
        <ul className="space-y-2">
          {faqs.map((f, i) => (
            <li key={i} className="border-t border-border pt-2 first:border-0 first:pt-0">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left text-sm font-semibold flex items-center justify-between">
                {f.q}<span className="text-primary">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <p className="text-xs text-muted-foreground mt-1.5">{f.a}</p>}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-3">
        <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Abrir ticket</h3>
        <form onSubmit={submit} className="space-y-2">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto" className={inputCls} />
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Descreva sua dúvida…" className={`${inputCls} min-h-[100px] py-2`} />
          <button className={btnPrimary}>ENVIAR</button>
        </form>
      </Card>

      {tickets.length > 0 && (
        <Card className="p-3">
          <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Meus tickets</h3>
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id} className="glass rounded-xl p-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{t.subject}</p>
                  <span className="text-[10px] uppercase text-primary">{t.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t.message}</p>
                <p className="text-[10px] text-white/40 mt-1">{new Date(t.created_at).toLocaleString("pt-BR")}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AppShell>
  );
}
