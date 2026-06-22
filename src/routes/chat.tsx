import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell, inputCls } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Send, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string };
type Contact = { id: string; full_name: string | null; email: string | null };

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Chat — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <ChatPage />
    </RequireAuth>
  ),
});

function ChatPage() {
  const { user, role } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const targets = new Set<string>();
      if (role === "aluno") {
        const { data: s } = await supabase.from("students").select("personal_id").eq("user_id", user.id).maybeSingle();
        if (s?.personal_id) targets.add(s.personal_id);
        const { data: dono } = await supabase.from("user_roles").select("user_id").eq("role", "dono");
        dono?.forEach((d) => targets.add(d.user_id));
      } else if (role === "personal") {
        const { data: alunos } = await supabase.from("students").select("user_id").eq("personal_id", user.id);
        alunos?.forEach((a) => targets.add(a.user_id));
        const { data: dono } = await supabase.from("user_roles").select("user_id").eq("role", "dono");
        dono?.forEach((d) => targets.add(d.user_id));
      } else if (role === "dono") {
        const { data: all } = await supabase.from("profiles").select("id");
        all?.forEach((p) => { if (p.id !== user.id) targets.add(p.id); });
      }
      targets.delete(user.id);
      if (!targets.size) { setContacts([]); return; }
      const { data: profs } = await supabase
        .from("profiles").select("id,full_name,email").in("id", Array.from(targets));
      setContacts((profs ?? []) as Contact[]);
      if (profs?.length) setActiveId(profs[0].id);
    })();
  }, [user?.id, role]);

  useEffect(() => {
    if (!user || !activeId) return;
    let alive = true;
    const fetchMsgs = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${activeId}),and(sender_id.eq.${activeId},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      if (alive) setMessages((data ?? []) as Msg[]);
    };
    fetchMsgs();
    const ch = supabase
      .channel(`chat:${user.id}:${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Msg;
        if ((m.sender_id === user.id && m.recipient_id === activeId) || (m.sender_id === activeId && m.recipient_id === user.id)) {
          setMessages((prev) => [...prev, m]);
        }
      })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [user?.id, activeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !user || !activeId) return;
    const body = draft.trim();
    setDraft("");
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id, recipient_id: activeId, body,
    });
    if (error) toast.error(error.message);
  };

  const activeContact = useMemo(() => contacts.find((c) => c.id === activeId), [contacts, activeId]);

  return (
    <AppShell title="Chat">
      <PageHero
        eyebrow="Mensagens"
        title="Chat"
        subtitle="Comunicação direta com a equipe e alunos"
        icon={MessageCircle}
        stats={[
          { label: "Contatos", value: contacts.length },
          { label: "Conversa", value: activeContact?.full_name?.split(" ")[0] ?? "—" },
          { label: "Status", value: activeId ? "Ativo" : "—" },
        ]}
      />

      {contacts.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum contato disponível" hint="Você verá aqui as pessoas autorizadas a conversar com você." />
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
            {contacts.map((c) => {
              const initials = (c.full_name ?? c.email ?? "?").split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
              const active = activeId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`shrink-0 flex items-center gap-2 rounded-2xl px-3 py-2 text-left transition ${
                    active ? "bg-primary/15 border border-primary/50" : "glass hover:border-primary/30"
                  }`}
                >
                  <div className={`size-9 rounded-xl grid place-items-center text-xs font-black ${active ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary border border-primary/30"}`}>
                    {initials}
                  </div>
                  <div className="min-w-0 max-w-[140px]">
                    <p className="text-xs font-bold truncate">{c.full_name ?? c.email}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {activeId && (
            <div className="glass rounded-3xl p-4 flex flex-col min-h-[420px]">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <div className="size-2 rounded-full bg-success animate-pulse" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{activeContact?.full_name ?? activeContact?.email}</p>
              </div>
              <div className="flex-1 space-y-2 py-3 max-h-[55vh] overflow-y-auto">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-10">Inicie a conversa.</p>
                )}
                {messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        mine ? "bg-primary text-primary-foreground rounded-br-sm" : "glass rounded-bl-sm"
                      }`}>
                        {m.body}
                        <p className={`text-[9px] mt-0.5 opacity-60 ${mine ? "text-primary-foreground" : ""}`}>
                          {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={send} className="flex gap-2 pt-2 border-t border-white/5">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Digite uma mensagem…" className={inputCls} />
                <button className="size-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shrink-0 shadow-lg shadow-primary/40 hover:scale-105 transition">
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
