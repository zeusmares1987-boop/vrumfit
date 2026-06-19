import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { Check } from "lucide-react";

export const Route = createFileRoute("/planos")({
  head: () => ({ meta: [{ title: "Planos — VRUMFIT" }] }),
  component: Planos,
});

const plans = [
  { name: "Basic", price: 149, color: false, features: ["Treino mensal", "Suporte chat", "App mobile"] },
  { name: "Standard", price: 249, color: false, features: ["Treino quinzenal", "Dieta básica", "Avaliação trimestral", "Suporte priority"] },
  { name: "Premium", price: 399, color: true, features: ["Treino semanal", "Dieta personalizada", "Avaliação mensal", "Acompanhamento 1-on-1", "WhatsApp direto"] },
];

function Planos() {
  return (
    <AppShell title="Planos" subtitle="Assinaturas oferecidas">
      <div className="space-y-3">
        {plans.map((p) => (
          <Card key={p.name} className={p.color ? "border-primary/50 bg-primary/5" : ""}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className={`text-[10px] uppercase tracking-[0.3em] font-bold ${p.color ? "text-primary" : "text-muted-foreground"}`}>{p.name}</p>
                <p className="text-2xl font-extrabold mt-1">R$ {p.price}<span className="text-xs text-muted-foreground font-medium">/mês</span></p>
              </div>
              {p.color && <span className="glass border-primary/40 rounded-full px-2 py-0.5 text-[9px] uppercase text-primary font-bold">Popular</span>}
            </div>
            <ul className="space-y-1.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs">
                  <Check className="size-3.5 text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
