import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Archive, ArrowUpRight, Bell, Box, ClipboardList, Eye, GraduationCap, LayoutGrid, Settings, ShoppingBag, Target, User, Users, Wallet } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { DashboardHome, type DashboardModule, type DashboardStat } from "@/components/DashboardHome";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import avatarOwnerAsset from "@/assets/avatar-owner.jpg.asset.json";
import heroOwnerAsset from "@/assets/hero/hero-owner.jpg.asset.json";
import tileAlunosAsset from "@/assets/tile-alunos.jpg.asset.json";
import tileFinanceiroAsset from "@/assets/tile-financeiro.jpg.asset.json";
import tilePlanosAsset from "@/assets/tile-planos.jpg.asset.json";
import tileProfessoresAsset from "@/assets/tile-professores.jpg.asset.json";
import tileUsuariosAsset from "@/assets/tile-usuarios.jpg.asset.json";


export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Painel do Proprietário — VRUMFIT PERSONAL" },
      { name: "description", content: "Controle total do seu negócio." },
    ],
  }),
  component: () => (
    <RequireAuth allow={["dono"]}>
      <OwnerPage />
    </RequireAuth>
  ),
});

const ownerModules: DashboardModule[] = [
  { icon: Settings, title: "Painel do Dono", description: "Configurar tudo do app", to: "/admin", image: tileUsuariosAsset.url },
  { icon: User, title: "Professores", description: "Equipe e gestão", to: "/personais", image: tileProfessoresAsset.url },
  { icon: User, title: "Alunos", description: "Cadastros e matrículas", to: "/alunos", image: tileAlunosAsset.url },
  { icon: ShoppingBag, title: "Loja", description: "Sua loja integrada", to: "/loja-pro" },
  { icon: Box, title: "Produtos", description: "Catálogo e estoque", to: "/produtos" },
  { icon: ClipboardList, title: "Planos", description: "Assinaturas e limites", to: "/planos", image: tilePlanosAsset.url },
  { icon: Wallet, title: "Financeiro", description: "Receitas e relatórios", to: "/financeiro", image: tileFinanceiroAsset.url },
  { icon: Target, title: "Execução", description: "Biblioteca e técnica", to: "/biblioteca" },
  { icon: Bell, title: "Avisos", description: "Comunicados", to: "/avisos" },
  { icon: Archive, title: "Arquivos", description: "Documentos e downloads", to: "/arquivos" },
  { icon: Users, title: "Usuários", description: "Acessos e permissões", to: "/personais", image: tileUsuariosAsset.url },
  { icon: LayoutGrid, title: "Mais", description: "Outras funções", to: "/elite" },
];

function OwnerPage() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: dashboard } = useQuery({
    queryKey: ["owner-dashboard-real"],
    queryFn: async () => {
      const [trainers, students, plans, notices] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "personal"),
        supabase.from("students").select("user_id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("plans").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("notices").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      ]);
      return {
        trainers: trainers.count ?? 0,
        students: students.count ?? 0,
        plans: plans.count ?? 0,
        notices: notices.count ?? 0,
      };
    },
    enabled: !!user,
  });

  const rawFirstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "José";
  const firstName = /^(dono|propriet[aá]rio)$/i.test(rawFirstName) ? "José" : rawFirstName;
  const ownerStats: DashboardStat[] = [
    { icon: Users, label: "Professores", value: String(dashboard?.trainers ?? 0), hint: "Ativos" },
    { icon: User, label: "Alunos", value: String(dashboard?.students ?? 0), hint: "Matriculados" },
    { icon: ClipboardList, label: "Planos", value: String(dashboard?.plans ?? 0), hint: "Ativos" },
  ];

  return (
    <AppShell hideHeader>
      <DashboardHome
        name={firstName}
        roleLabel=""
        modeLabel="Modo gestor"
        subtitle="Tenha controle total do seu negócio."
        avatarUrl={profile?.avatar_url || avatarOwnerAsset.url}
        heroImageUrl={heroOwnerAsset.url}
        
        searchPlaceholder="Buscar módulos, usuários, produtos..."
        stats={ownerStats}
        modules={ownerModules}
        notifCount={dashboard?.notices ?? 0}
        beforeStats={<RolePreviewLinks />}
      />
    </AppShell>
  );
}

function RolePreviewLinks() {
  const items = [
    { to: "/trainer", label: "Professor", hint: "Tela do personal", Icon: Users },
    { to: "/student", label: "Aluno", hint: "Tela do treino", Icon: GraduationCap },
  ] as const;
  return (
    <section className="grid grid-cols-2 gap-2.5">
      {items.map(({ to, label, hint, Icon }) => (
        <Link
          key={to}
          to={to}
          className="vrum-stat-card group relative flex items-center gap-3 overflow-hidden rounded-[18px] p-3 transition active:scale-[0.98]"
        >
          <div className="vrum-mini-ring grid size-10 shrink-0 place-items-center rounded-2xl text-primary">
            <Icon className="size-[18px]" strokeWidth={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-primary">
              <Eye className="size-3" strokeWidth={2.2} />
              <span className="text-[8.5px] font-black uppercase tracking-[0.18em]">Ver como</span>
            </div>
            <p className="mt-0.5 truncate text-[15px] font-black leading-none text-foreground">{label}</p>
            <p className="mt-1 truncate text-[10px] leading-tight text-muted-foreground">{hint}</p>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" strokeWidth={2.2} />
        </Link>
      ))}
    </section>
  );
}
