import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Settings as SettingsIcon, CreditCard, Dumbbell, Store, Users,
  Megaphone, FileText, BarChart3, ChevronRight,
} from "lucide-react";
import { AppShell, Card } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel do Dono — VRUMFIT" }] }),
  component: () => (
    <RequireAuth allow={["dono"]}>
      <AdminPage />
    </RequireAuth>
  ),
});

type AdminItem = {
  icon: typeof SettingsIcon;
  title: string;
  desc: string;
  to: string;
};

const groups: { label: string; items: AdminItem[] }[] = [
  {
    label: "Planos & Financeiro",
    items: [
      { icon: CreditCard, title: "Planos e Preços", desc: "Criar, editar e ativar planos", to: "/planos" },
      { icon: BarChart3, title: "Financeiro", desc: "Cobranças e recebimentos", to: "/financeiro" },
    ],
  },
  {
    label: "Treinos & Conteúdo",
    items: [
      { icon: Dumbbell, title: "Biblioteca de Exercícios", desc: "Fotos, vídeos e categorias", to: "/biblioteca" },
      { icon: FileText, title: "Avisos do App", desc: "Mensagens para alunos e personais", to: "/avisos" },
    ],
  },
  {
    label: "Loja",
    items: [
      { icon: Store, title: "Produtos da Loja", desc: "Cadastrar e editar produtos", to: "/produtos" },
      { icon: SettingsIcon, title: "Configurações da Loja", desc: "WhatsApp, Pix, regras", to: "/loja-pro/config" },
    ],
  },
  {
    label: "Usuários",
    items: [
      { icon: Users, title: "Professores", desc: "Listar e gerenciar personais", to: "/personais" },
      { icon: Users, title: "Alunos", desc: "Listar e gerenciar alunos", to: "/alunos" },
      { icon: Megaphone, title: "Suporte", desc: "Tickets e mensagens", to: "/suporte" },
    ],
  },
];

function AdminPage() {
  return (
    <AppShell title="Painel do Dono">
      <PageHero
        eyebrow="Administração"
        title="Painel do Dono"
        subtitle="Configure tudo do app em um só lugar."
        icon={SettingsIcon}
      />

      <div className="space-y-5">
        {groups.map((g) => (
          <section key={g.label} className="space-y-2">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-primary/90 px-1">{g.label}</h2>
            <Card className="p-2">
              <div className="divide-y divide-white/5">
                {g.items.map((it) => (
                  <Link
                    key={it.title}
                    to={it.to}
                    className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-primary/5"
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
                      <it.icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-foreground truncate">{it.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{it.desc}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </Card>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
