import { Share2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  title?: string;
  text?: string;
  className?: string;
};

export function ShareProgressButton({
  title = "VrumFit",
  text = "Treinei hoje 💪 — VrumFit",
  className = "",
}: Props) {
  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const data = { title, text: `${text}\n${url}`, url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Texto copiado! Cole no WhatsApp ou Instagram.");
    } catch {
      // usuário cancelou
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-[13px] font-bold text-primary transition hover:bg-primary/20 ${className}`}
    >
      <Share2 className="size-4" />
      Compartilhar meu treino
    </button>
  );
}
