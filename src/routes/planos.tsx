import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Check, Plus, Trash2, X, CreditCard, Sparkles, Store, Smartphone, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

type Plan = { id: string; name: string; price_cents: number; period: string; benefits: string[] | null; status: string; role_target: string | null };
type PlanAudience = "dono" | "personal" | "aluno";

export const Route = createFileRoute("/planos")({
  head: () => ({ meta: [{ title: "Planos — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <Planos />
    </RequireAuth>
  ),
});

type PeriodTab = "mensal" | "trimestral" | "anual";
const PERIOD_LABEL: Record<PeriodTab, string> = { mensal: "Mensal", trimestral: "Trimestral", anual: "Anual" };
const PERIOD_HINT: Record<PeriodTab, string> = { mensal: "Pague mês a mês", trimestral: "Economize ~10%", anual: "Melhor custo-benefício" };

function Planos() {
  const { role } = useAuth();
  const nav = useNavigate();
  const [audience, setAudience] = useState<PlanAudience | null>(null);
  const [period, setPeriod] = useState<PeriodTab>("mensal");
  const [category, setCategory] = useState<"app" | "loja">("app");

  const subscribe = (planId: string) => {
    nav({ to: "/checkout/$planId", params: { planId } });
  };
  const [list, setList] = useState<Plan[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", period: "mensal", benefits: "" });



  useEffect(() => {
    const saved = window.localStorage.getItem("vrumfit:plans-audience");
    if (saved === "aluno" || saved === "personal" || saved === "dono") setAudience(saved);
  }, []);

  const load = async () => {
    const { data, error } = await supabase.from("plans").select("*").order("price_cents");
    if (error) toast.error(error.message); else setList((data ?? []) as Plan[]);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    const { error } = await supabase.from("plans").insert({
      name: form.name, period: form.period,
      price_cents: Math.round(parseFloat(form.price) * 100),
      benefits: form.benefits.split("\n").map((s) => s.trim()).filter(Boolean),
      status: "ativo" as any,
    });
    if (error) return toast.error(error.message);
    setForm({ name: "", price: "", period: "mensal", benefits: "" });
    setShow(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover plano?")) return;
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList(list.filter((x) => x.id !== id));
  };

  const effectiveAudience: PlanAudience | null = role === "dono" ? audience ?? "dono" : role;
  const canEdit = role === "dono" && effectiveAudience === "dono";
  const visible = canEdit
    ? list
    : list.filter((p) => {
        const t = (p.role_target ?? "").toLowerCase();
        if (effectiveAudience === "personal") return t === "professor" || t === "personal";
        if (effectiveAudience === "aluno") return t === "aluno";
        return false;
      });
  const cheapest = visible.length ? Math.min(...visible.map((p) => p.price_cents)) : 0;

  return (
    <AppShell title="Planos">
      <PageHero
        eyebrow="Assinaturas"
        title="Planos"
        subtitle="Ofertas e benefícios da sua academia"
        icon={CreditCard}
        stats={[
          { label: "Planos", value: visible.length },
          { label: "A partir de", value: cheapest ? `R$ ${(cheapest / 100).toFixed(0)}` : "—" },
          { label: "Ativos", value: visible.filter((p) => p.status === "ativo").length },
        ]}
        action={canEdit ? (
          <button
            onClick={() => setShow(!show)}
            className="size-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/40 hover:scale-105 transition"
          >
            {show ? <X className="size-5" /> : <Plus className="size-5" />}
          </button>
        ) : undefined}
      />

      {show && (
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-3">Novo plano</p>
          <form onSubmit={add} className="space-y-2">
            <input placeholder="Nome do plano" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input placeholder="Preço (R$)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
            <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className={inputCls}>
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
            <textarea placeholder="Benefícios (um por linha)" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} className={`${inputCls} min-h-[100px] py-2`} />
            <button className={btnPrimary}>SALVAR</button>
          </form>
        </Card>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sem planos cadastrados"
          hint={canEdit ? "Toque no + para criar o primeiro plano." : "Aguarde o gestor configurar planos."}
        />
      ) : (() => {
        const isLoja = (p: Plan) => /oferta|loja|vitrine|mentor/i.test(p.name);
        const appPlans = visible.filter((p) => !isLoja(p));
        const lojaPlans = visible.filter(isLoja);

        const renderCard = (p: Plan, featured: boolean) => (
          <Card key={p.id} className={`p-4 relative overflow-hidden ${featured ? "border-primary/60 bg-gradient-to-br from-primary/10 to-transparent" : ""}`}>
            {featured && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-2xl flex items-center gap-1">
                <Sparkles className="size-2.5" /> Mais escolhido
              </div>
            )}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">{p.name}</p>
                <p className="text-3xl font-extrabold mt-1 leading-none">
                  R$ {(p.price_cents / 100).toFixed(2)}
                  <span className="text-xs text-muted-foreground font-medium ml-1">/{p.period}</span>
                </p>
              </div>
              {canEdit && (
                <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive p-1.5">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <ul className="space-y-1.5">
              {(p.benefits ?? []).map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-primary/20">
                    <Check className="size-2.5 text-primary" strokeWidth={3} />
                  </span>
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
            {!canEdit && p.status === "ativo" && p.price_cents > 0 && (
              <button onClick={() => subscribe(p.id)} className={`${btnPrimary} mt-4`}>
                ASSINAR COM PIX OU CARTÃO
              </button>
            )}
          </Card>
        );

        const Section = ({ icon: Icon, title, subtitle, plans, extra }: { icon: typeof Store; title: string; subtitle: string; plans: Plan[]; extra?: React.ReactNode }) => {
          if (plans.length === 0 && !extra) return null;
          return (
            <section className="space-y-3">
              <div className="flex items-center gap-3 pt-2">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/15 border border-primary/30">
                  <Icon className="size-5 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">{title}</p>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
              </div>
              {extra}
              <div className="space-y-3">
                {plans.map((p, i) => renderCard(p, i === 1 && plans.length >= 2))}
              </div>
            </section>
          );
        };

        const availablePeriods = (["mensal", "trimestral", "anual"] as PeriodTab[]).filter((per) =>
          appPlans.some((p) => (p.period ?? "").toLowerCase() === per)
        );
        const activePeriod: PeriodTab = availablePeriods.includes(period)
          ? period
          : (availablePeriods[0] ?? "mensal");
        const appForPeriod = appPlans.filter((p) => (p.period ?? "").toLowerCase() === activePeriod);

        return (
          <div className="space-y-6">
            {appPlans.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-3 pt-2">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/15 border border-primary/30">
                    <Smartphone className="size-5 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">Plano do App</p>
                    <p className="text-xs text-muted-foreground">
                      {effectiveAudience === "personal" ? "Uso do sistema, alunos, treinos e dietas" : "Acesso completo aos recursos do aluno"}
                    </p>
                  </div>
                </div>

                {availablePeriods.length > 1 && (
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl glass border border-primary/20">
                    {availablePeriods.map((per) => {
                      const active = per === activePeriod;
                      return (
                        <button
                          key={per}
                          onClick={() => setPeriod(per)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition ${
                            active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {PERIOD_LABEL[per]}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground -mt-1 px-1">{PERIOD_HINT[activePeriod]}</p>

                <div className="space-y-3">
                  {appForPeriod.map((p, i) => renderCard(p, i === 0 && appForPeriod.length >= 2 && activePeriod === "anual"))}
                </div>
              </section>
            )}

            <Section
              icon={Store}
              title="Plano da Loja"
              subtitle="Venda mentorias, PDFs, treinos prontos e materiais"
              plans={lojaPlans}
              extra={effectiveAudience === "personal" ? (
                <Link to="/loja-pro/config" className="flex items-center gap-3 p-3 rounded-2xl glass border border-primary/30 hover:border-primary/60 transition">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/15">
                    <Settings className="size-4 text-primary" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">Editar minha vitrine</p>
                    <p className="text-[11px] text-muted-foreground">Nome, bio, contato e publicações</p>
                  </div>
                </Link>
              ) : undefined}
            />
          </div>
        );
      })()}

    </AppShell>
  );
}
