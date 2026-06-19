import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";

const faqs = [
  { q: "Como prescrever um treino?", a: "Vá em Treinos, escolha frequência e objetivo, clique em Gerar Planilha e exporte." },
  { q: "Posso editar a dieta gerada?", a: "Sim. A geração é uma sugestão calculada — adapte os itens antes de exportar." },
  { q: "Os dados ficam salvos?", a: "Sim, no dispositivo. Ao ativar o Cloud, sincronizam entre celular e desktop." },
  { q: "Como cancelo a conta de um aluno?", a: "Abra Alunos, toque na lixeira ao lado do nome." },
];

export const Route = createFileRoute("/suporte")({
  head: () => ({ meta: [{ title: "Suporte — VRUMFIT" }] }),
  component: Sup,
});

function Sup() {
  const [open, setOpen] = useState<number | null>(0);
  const [msg, setMsg] = useState("");

  return (
    <AppShell title="Suporte" subtitle="FAQ e contato direto">
      <Card>
        <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Perguntas frequentes</h3>
        <ul className="space-y-2">
          {faqs.map((f, i) => (
            <li key={i} className="border-t border-border pt-2 first:border-0 first:pt-0">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left text-sm font-semibold flex items-center justify-between">
                {f.q}
                <span className="text-primary">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <p className="text-xs text-muted-foreground mt-1.5">{f.a}</p>}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Fale com a gente</h3>
        <form onSubmit={(e) => { e.preventDefault(); alert("Mensagem enviada!"); setMsg(""); }} className="space-y-2">
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Descreva sua dúvida…"
            className={`${inputCls} min-h-[100px]`} />
          <button className={btnPrimary}>ENVIAR</button>
        </form>
      </Card>
    </AppShell>
  );
}
