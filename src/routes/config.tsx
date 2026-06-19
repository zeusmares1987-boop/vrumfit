import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Card, Field, inputCls, btnPrimary } from "@/components/AppShell";
import { useLocalState } from "@/hooks/use-local-state";

type Cfg = { studio: string; cnpj: string; phone: string; addr: string; notifications: boolean };

export const Route = createFileRoute("/config")({
  head: () => ({ meta: [{ title: "Configurações — VRUMFIT" }] }),
  component: Cfg,
});

function Cfg() {
  const nav = useNavigate();
  const [cfg, setCfg] = useLocalState<Cfg>("vrumfit:config", {
    studio: "Studio VrumFit", cnpj: "", phone: "", addr: "", notifications: true,
  });

  const logout = () => {
    window.localStorage.removeItem("vrumfit:session");
    nav({ to: "/login" });
  };

  return (
    <AppShell title="Configurações" subtitle="Dados do studio">
      <Card>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); alert("Configurações salvas."); }}>
          <Field label="Nome do studio"><input value={cfg.studio} onChange={(e) => setCfg({ ...cfg, studio: e.target.value })} className={inputCls} /></Field>
          <Field label="CNPJ"><input value={cfg.cnpj} onChange={(e) => setCfg({ ...cfg, cnpj: e.target.value })} className={inputCls} /></Field>
          <Field label="Telefone"><input value={cfg.phone} onChange={(e) => setCfg({ ...cfg, phone: e.target.value })} className={inputCls} /></Field>
          <Field label="Endereço"><input value={cfg.addr} onChange={(e) => setCfg({ ...cfg, addr: e.target.value })} className={inputCls} /></Field>
          <label className="flex items-center justify-between glass rounded-xl px-3 py-3">
            <span className="text-sm">Notificações</span>
            <input type="checkbox" checked={cfg.notifications} onChange={(e) => setCfg({ ...cfg, notifications: e.target.checked })} className="size-5 accent-[var(--brand)]" />
          </label>
          <button className={btnPrimary}>SALVAR</button>
        </form>
      </Card>

      <button onClick={logout} className="w-full rounded-xl glass text-destructive font-semibold py-3 text-sm">SAIR DA CONTA</button>
    </AppShell>
  );
}
