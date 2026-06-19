import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, inputCls } from "@/components/AppShell";
import { useLocalState } from "@/hooks/use-local-state";
import { Send } from "lucide-react";

type Msg = { from: "me" | "them"; text: string; ts: number };
type Thread = { id: string; name: string; role: string; messages: Msg[] };

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Chat — VRUMFIT" }] }),
  component: ChatPage,
});

const seed: Thread[] = [
  { id: "1", name: "Marina Souza", role: "Aluna", messages: [
    { from: "them", text: "Bom dia! Posso trocar o treino de hoje?", ts: Date.now() - 1000000 },
    { from: "me", text: "Pode sim, vou mandar o B agora.", ts: Date.now() - 900000 },
  ]},
  { id: "2", name: "Carlos Personal", role: "Personal", messages: [
    { from: "them", text: "Avaliação do Lucas marcada pra 18h.", ts: Date.now() - 500000 },
  ]},
  { id: "3", name: "Júlia Aluna", role: "Aluna", messages: [
    { from: "them", text: "A dieta tá funcionando muito bem!", ts: Date.now() - 200000 },
  ]},
];

function ChatPage() {
  const [threads, setThreads] = useLocalState<Thread[]>("vrumfit:chat", seed);
  const [active, setActive] = useState(threads[0]?.id);
  const [draft, setDraft] = useState("");
  const t = threads.find((x) => x.id === active);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !t) return;
    setThreads(threads.map((x) =>
      x.id === t.id ? { ...x, messages: [...x.messages, { from: "me", text: draft, ts: Date.now() }] } : x
    ));
    setDraft("");
  };

  return (
    <AppShell title="Chat" subtitle={`${threads.length} conversas`}>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {threads.map((th) => (
          <button key={th.id} onClick={() => setActive(th.id)}
            className={`shrink-0 glass rounded-xl px-3 py-2 text-left ${active === th.id ? "border-primary/60" : ""}`}>
            <p className="text-xs font-bold">{th.name}</p>
            <p className="text-[10px] text-muted-foreground">{th.role}</p>
          </button>
        ))}
      </div>

      {t && (
        <div className="glass rounded-2xl p-3 space-y-2 min-h-[300px] flex flex-col">
          <div className="flex-1 space-y-2">
            {t.messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === "me" ? "bg-primary text-primary-foreground" : "glass"}`}>
                  {m.text}
                </div>
              </div>
            ))}
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
