import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { HelpCircle, ChevronDown, ChevronUp, MessageSquare, Inbox } from "lucide-react";

const faqs = [
  { q: "Como prescrever um treino?", a: "Vá em Treinos, escolha frequência e objetivo, clique em Gerar e exporte em PDF." },
  { q: "Posso editar a dieta gerada?", a: "Sim. A geração é uma sugestão calculada — adapte os itens antes de exportar." },
  { q: "Os dados ficam salvos?", a: "Sim, tudo sincroniza na nuvem entre seus dispositivos automaticamente." },
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
  const openTickets = tickets.filter((ticket) => ticket.status === "aberto").length;

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
    <AppShell title="Suporte">
      <PageHero
        eyebrow="Ajuda"
        title="Suporte"
        subtitle="Tire dúvidas ou fale com a equipe VrumFit"
        icon={HelpCircle}
        stats={[
          { label: "FAQ", value: faqs.length },
          { label: "Tickets", value: tickets.length },
          { label: "Abertos", value: openTickets },
        ]}
      />

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="size-4 text-primary" />
          <h3 className="text-[10px] uppercase tracking-[0.28em] text-primary font-bold">Perguntas frequentes</h3>
        </div>
        <ul className="space-y-1">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={i} className="border-t border-white/5 first:border-0">
                <button onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full text-left text-sm font-bold flex items-center justify-between py-3 hover:text-primary transition">
                  {f.q}
                  {isOpen ? <ChevronUp className="size-4 text-primary shrink-0" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
                </button>
                {isOpen && <p className="text-xs text-muted-foreground pb-3 leading-relaxed">{f.a}</p>}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="size-4 text-primary" />
          <h3 className="text-[10px] uppercase tracking-[0.28em] text-primary font-bold">Abrir ticket</h3>
        </div>
        <form onSubmit={submit} className="space-y-2">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto" className={inputCls} />
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Descreva sua dúvida…" className={`${inputCls} min-h-[100px] py-2`} />
          <button className={btnPrimary}>ENVIAR</button>
        </form>
      </Card>

      {tickets.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Inbox className="size-4 text-primary" />
            <h3 className="text-[10px] uppercase tracking-[0.28em] text-primary font-bold">Meus tickets</h3>
          </div>
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id} className="glass rounded-2xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold truncate">{t.subject}</p>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                    t.status === "aberto" ? "bg-primary/20 text-primary" : "bg-success/20 text-success"
                  }`}>{t.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5">{new Date(t.created_at).toLocaleString("pt-BR")}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AppShell>
  );
}
