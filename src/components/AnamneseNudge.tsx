import { Link } from "@tanstack/react-router";
import { useStudentContext } from "@/lib/student-context";

/**
 * Banner discreto que aparece quando faltam dados-chave do aluno
 * (sexo, idade, peso, altura, nível de atividade).
 * Leva direto para a /anamnese.
 */
export function AnamneseNudge() {
  const { ctx, isLoading } = useStudentContext();
  if (isLoading) return null;
  const missing: string[] = [];
  if (!ctx.sex) missing.push("sexo");
  if (!ctx.age) missing.push("idade");
  if (!ctx.weightKg) missing.push("peso");
  if (!ctx.heightCm) missing.push("altura");
  if (!ctx.activityFactor) missing.push("nível de atividade");
  if (missing.length === 0) return null;
  return (
    <Link
      to="/anamnese"
      className="block rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-[12px] hover:bg-primary/15 transition"
    >
      <p className="font-bold text-primary">Complete sua anamnese</p>
      <p className="text-muted-foreground mt-0.5">
        Faltam: <span className="text-foreground">{missing.join(", ")}</span>. Seu plano fica mais preciso. →
      </p>
    </Link>
  );
}
