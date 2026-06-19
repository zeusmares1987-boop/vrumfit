import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ChevronRight, Plus, Dumbbell } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca VrumFit — Execução" }] }),
  component: () => (
    <RequireAuth>
      <BibliotecaPage />
    </RequireAuth>
  ),
});

function BibliotecaPage() {
  const { role } = useAuth();
  const [q, setQ] = useState("");
  const [catSlug, setCatSlug] = useState<string | null>(null);

  const { data: cats } = useQuery({
    queryKey: ["ex-cats"],
    queryFn: async () => (await supabase.from("exercise_categories").select("*").order("sort_order")).data ?? [],
  });

  const { data: exercises } = useQuery({
    queryKey: ["exercises", q, catSlug],
    queryFn: async () => {
      let qry = supabase.from("exercises").select("id,name,target_muscle,level,image_start,category_id,exercise_categories(slug,name)").order("name");
      if (catSlug && cats) {
        const cat = cats.find((c) => c.slug === catSlug);
        if (cat) qry = qry.eq("category_id", cat.id);
      }
      if (q) qry = qry.ilike("name", `%${q}%`);
      const { data } = await qry;
      return data ?? [];
    },
  });

  return (
    <AppShell title="Execução" subtitle="Biblioteca VrumFit">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-white/55" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar exercício..."
          className="w-full h-12 rounded-2xl bg-black/60 border border-white/10 pl-12 pr-4 text-[13px] outline-none placeholder:text-white/45 focus:border-primary/60 transition" />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        <Chip active={catSlug === null} onClick={() => setCatSlug(null)}>Todos</Chip>
        {cats?.map((c) => (
          <Chip key={c.id} active={catSlug === c.slug} onClick={() => setCatSlug(c.slug)}>{c.name}</Chip>
        ))}
      </div>

      {role === "dono" && (
        <Link to="/biblioteca" className="mt-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-primary/40 text-primary text-[12px] font-semibold hover:bg-primary/10">
          <Plus className="size-3.5" /> Novo exercício
        </Link>
      )}

      <section className="mt-3 grid grid-cols-2 gap-2.5 pb-4">
        {(exercises ?? []).map((e: any) => (
          <Link key={e.id} to="/biblioteca/$id" params={{ id: e.id }} className="rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 bg-black/40 transition group">
            <div className="aspect-[4/3] bg-gradient-to-br from-white/5 to-black grid place-items-center relative">
              {e.image_start ? (
                <img src={e.image_start} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <Dumbbell className="size-12 text-primary/40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-[12px] font-extrabold leading-tight truncate">{e.name}</p>
                <p className="text-[10px] text-primary truncate">{e.target_muscle ?? e.exercise_categories?.name}</p>
              </div>
            </div>
          </Link>
        ))}
        {exercises && exercises.length === 0 && (
          <div className="col-span-2 text-center py-10 text-white/50 text-sm">
            Nenhum exercício cadastrado ainda.
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 h-9 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition ${active ? "bg-primary/15 border border-primary text-primary" : "bg-transparent border border-white/12 text-white/75"}`}>
      {children}
    </button>
  );
}
