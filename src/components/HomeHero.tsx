import { Bell, MoreVertical, Search, SlidersHorizontal } from "lucide-react";
import type { ChangeEvent } from "react";

type Props = {
  /** Foto à direita (atleta/personal) */
  photo: string;
  /** "Bem-vindo," ou "Olá," */
  eyebrow?: string;
  /** Nome em destaque, ex: "Proprietário" / "Aluno" */
  name: string;
  /** Linha de apoio abaixo do nome */
  tagline: string;
  /** Mostrar busca + filtros (padrão true) */
  search?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  onFilters?: () => void;
  filtersActive?: boolean;
  /** Badge de notificação */
  notifCount?: number;
};

export function HomeHero({
  photo,
  eyebrow = "Bem-vindo,",
  name,
  tagline,
  search = true,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar módulos, usuários...",
  onFilters,
  filtersActive,
  notifCount = 0,
}: Props) {
  return (
    <section className="-mx-4 -mt-4">
      <div className="relative overflow-hidden">
        {/* Foto à direita, fade para preto à esquerda */}
        <div className="absolute inset-0">
          <img
            src={photo}
            alt=""
            className="absolute right-0 top-0 h-full w-[72%] object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />
        </div>

        {/* Top bar: marca + sino + menu */}
        <div className="relative flex items-center justify-between px-4 pt-4">
          <div className="leading-tight">
            <div className="text-[18px] font-black tracking-tight">
              <span className="text-white">Vrum</span><span className="text-primary">Fit</span>
            </div>
            <div className="text-[8.5px] font-bold tracking-[0.4em] text-white/70 -mt-0.5">PERSONAL</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Notificações"
              className="relative size-9 grid place-items-center rounded-full border border-primary/40 text-primary bg-black/40 hover:bg-primary/15 transition"
            >
              <Bell className="size-[16px]" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] font-extrabold text-black grid place-items-center">
                  {notifCount}
                </span>
              )}
            </button>
            <button aria-label="Mais" className="size-9 grid place-items-center rounded-full text-white/70 hover:text-white">
              <MoreVertical className="size-[18px]" />
            </button>
          </div>
        </div>

        {/* Saudação */}
        <div className="relative px-4 pt-6 pb-7 max-w-[62%]">
          <h1 className="text-[34px] leading-[0.95] font-black tracking-tight text-white">
            {eyebrow}
          </h1>
          <h2 className="mt-1 text-[34px] leading-[0.95] font-black tracking-tight text-primary">
            {name}
          </h2>
          <p className="mt-3 text-[12.5px] text-white/65 leading-snug max-w-[260px]">
            {tagline}
          </p>
        </div>

        {/* Pulso ECG */}
        <EcgLine />
      </div>

      {/* Busca + filtros */}
      {search && (
        <div className="px-4 mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-[16px] text-white/55" />
            <input
              value={searchValue ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-12 rounded-full bg-black/55 border border-white/12 pl-11 pr-4 text-[13px] outline-none placeholder:text-white/45 focus:border-primary/60 focus:bg-black/75 transition"
            />
          </div>
          <button
            onClick={onFilters}
            className={`h-12 px-5 rounded-full border text-[13px] font-bold flex items-center gap-2 transition ${
              filtersActive
                ? "bg-primary/15 border-primary text-primary"
                : "border-primary/45 text-primary bg-black/40 hover:bg-primary/10"
            }`}
          >
            <SlidersHorizontal className="size-[15px]" /> Filtros
          </button>
        </div>
      )}
    </section>
  );
}

function EcgLine() {
  return (
    <div className="relative px-4 -mt-1 pb-3">
      <svg
        viewBox="0 0 400 28"
        className="w-full h-6 text-primary drop-shadow-[0_0_8px_rgba(46,107,255,0.6)]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        preserveAspectRatio="none"
        aria-hidden
      >
        <line x1="0" y1="14" x2="160" y2="14" />
        <polyline points="160,14 175,14 182,4 192,24 200,14 220,14 232,8 240,20 248,14 400,14" />
      </svg>
    </div>
  );
}
