import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { VrumExercisePoster } from "@/components/VrumExercisePoster";
import { getExercisePosterUrl } from "@/lib/exercisePosters";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/biblioteca/")({
  head: () => ({ meta: [{ title: "Biblioteca VrumFit — Execução" }] }),
  component: BibliotecaPage,
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
      let qry = supabase
        .from("exercises")
        .select("id,name,target_muscle,level,default_sets,default_reps,default_rest,image_start,image_end,execution_steps,category_id,exercise_categories(slug,name)")
        .order("name");
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
        {(exercises ?? []).map((e: any) => {
          const posterUrl = getExercisePosterUrl(e.id);
          return (
            <Link key={e.id} to="/biblioteca/$id" params={{ id: e.id }} className="block overflow-hidden rounded-2xl border border-white/10 bg-background transition hover:border-primary/60">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={`Pôster do exercício ${e.name}`}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0">
                    <VrumExercisePoster exercise={e} compact />
                  </div>
                )}
              </div>
              <div className="px-2.5 py-2">
                <p className="text-[12px] font-semibold text-white truncate">{e.name}</p>
                <p className="text-[10px] text-white/55 truncate uppercase tracking-wide">{e.target_muscle}</p>
              </div>
            </Link>
          );
        })}
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
