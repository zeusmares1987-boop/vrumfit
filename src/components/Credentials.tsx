import { Check, Copy, X, KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type CredentialsInfo = { name: string; email: string; password: string };

export function CredentialsModal({ info, onClose }: { info: CredentialsInfo; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const message =
    `Olá ${info.name}! Seu acesso ao VRUMFIT:\n` +
    `E-mail: ${info.email}\n` +
    `Senha: ${info.password}\n` +
    `Acesse o app e faça login. Recomendamos trocar a senha depois.`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-primary/40 bg-background p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-primary/15 border border-primary/40 grid place-items-center text-primary">
              <KeyRound className="size-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Acesso criado</p>
              <p className="text-sm font-extrabold">{info.name}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="size-8 rounded-lg glass grid place-items-center text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <p className="text-[12px] text-muted-foreground mb-3">
          Copie e envie para o usuário. Esta senha não será mostrada novamente.
        </p>

        <CredRow label="E-mail" value={info.email} copied={copied === "email"} onCopy={() => copy("email", info.email)} />
        <CredRow label="Senha"  value={info.password} copied={copied === "senha"} onCopy={() => copy("senha", info.password)} mono />

        <button
          onClick={() => copy("msg", message)}
          className="mt-4 w-full h-11 rounded-xl bg-primary text-primary-foreground text-[12px] font-bold flex items-center justify-center gap-2"
        >
          {copied === "msg" ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied === "msg" ? "MENSAGEM COPIADA" : "COPIAR MENSAGEM PRONTA"}
        </button>
      </div>
    </div>
  );
}

function CredRow({ label, value, copied, onCopy, mono }: { label: string; value: string; copied: boolean; onCopy: () => void; mono?: boolean }) {
  return (
    <div className="mb-2 glass rounded-2xl p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={`text-[14px] font-bold truncate ${mono ? "font-mono tracking-wide text-primary" : ""}`}>{value}</p>
      </div>
      <button onClick={onCopy} className="shrink-0 size-9 rounded-lg bg-primary/15 border border-primary/40 grid place-items-center text-primary">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
