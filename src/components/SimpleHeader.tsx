import { Bell } from "lucide-react";

type Props = {
  greeting: string;
  subtitle?: string;
  notifCount?: number;
};

/** Header simples estilo MFit: marca centralizada + sino, depois saudação grande. */
export function SimpleHeader({ greeting, subtitle, notifCount = 0 }: Props) {
  return (
    <header className="-mx-4 -mt-4 bg-surface px-4 pt-5 pb-6 border-b border-white/5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <span />
        <div className="text-center leading-tight">
          <div className="text-[20px] font-black tracking-tight">
            <span className="text-white">Vrum</span><span className="text-primary">Fit</span>
            <span className="ml-1 text-[10px] font-bold tracking-[0.3em] text-white/70 align-middle">PERSONAL</span>
          </div>
        </div>
        <div className="justify-self-end">
          <button aria-label="Notificações" className="relative size-10 grid place-items-center rounded-full bg-white text-primary">
            <Bell className="size-[18px]" />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-[10px] font-extrabold text-white grid place-items-center">
                {notifCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <h1 className="mt-6 text-[24px] font-extrabold text-white leading-tight">{greeting}</h1>
      {subtitle && <p className="mt-1 text-[13px] text-white/60">{subtitle}</p>}
    </header>
  );
}
