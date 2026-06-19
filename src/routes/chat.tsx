import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell, inputCls } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Send } from "lucide-react";
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

  // Load contacts: alunos see their personal + dono. personal sees alunos + dono. dono sees all.
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

  // Load + subscribe to messages for active conversation
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

  const activeName = useMemo(() => contacts.find((c) => c.id === activeId)?.full_name ?? "—", [contacts, activeId]);

  return (
    <AppShell title="Chat" subtitle={`${contacts.length} contatos`}>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {contacts.map((c) => (
          <button key={c.id} onClick={() => setActiveId(c.id)}
            className={`shrink-0 glass rounded-xl px-3 py-2 text-left ${activeId === c.id ? "border-primary/60" : ""}`}>
            <p className="text-xs font-bold">{c.full_name ?? c.email}</p>
            <p className="text-[10px] text-muted-foreground">{c.email}</p>
          </button>
        ))}
        {contacts.length === 0 && <p className="text-xs text-white/50 py-2">Nenhum contato disponível.</p>}
      </div>

      {activeId && (
        <div className="glass rounded-2xl p-3 space-y-2 min-h-[300px] flex flex-col">
          <p className="text-[10px] uppercase text-white/50 tracking-widest">{activeName}</p>
          <div className="flex-1 space-y-2 max-h-[50vh] overflow-y-auto">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === user?.id ? "bg-primary text-primary-foreground" : "glass"}`}>
                  {m.body}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 pt-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Mensagem…" className={inputCls} />
            <button className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0">
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
