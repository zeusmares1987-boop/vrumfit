import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Field, inputCls, btnPrimary } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/avaliacoes")({
  head: () => ({ meta: [{ title: "Avaliação Física — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <AvaliacaoPage />
    </RequireAuth>
  ),
});

function AvaliacaoPage() {
  const [sex, setSex] = useState<"M" | "F">("M");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(80);
  const [height, setHeight] = useState(175);
  const [waist, setWaist] = useState(85);
  const [neck, setNeck] = useState(40);
  const [hip, setHip] = useState(95);
  const [result, setResult] = useState<{ imc: number; classe: string; bf: number; mm: number; rcq: number } | null>(null);

  const calc = (e: React.FormEvent) => {
    e.preventDefault();
    const imc = +(weight / Math.pow(height / 100, 2)).toFixed(1);
    const classe = imc < 18.5 ? "Abaixo do peso" : imc < 25 ? "Peso ideal" : imc < 30 ? "Sobrepeso" : "Obesidade";
    // US Navy BF
    const bf = sex === "M"
      ? +(495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450).toFixed(1)
      : +(495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450).toFixed(1);
    const mm = +(weight * (1 - bf / 100)).toFixed(1);
    const rcq = +(waist / hip).toFixed(2);
    setResult({ imc, classe, bf, mm, rcq });
  };

  return (
    <AppShell title="Avaliação Física" subtitle="IMC · % Gordura (Navy) · RCQ">
      <Card>
        <form onSubmit={calc} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sexo">
              <div className="flex gap-2">
                {(["M", "F"] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setSex(s)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold ${sex === s ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                    {s === "M" ? "Masc." : "Fem."}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Idade"><input type="number" value={age} onChange={(e) => setAge(+e.target.value)} className={inputCls} /></Field>
            <Field label="Peso (kg)"><input type="number" value={weight} onChange={(e) => setWeight(+e.target.value)} className={inputCls} /></Field>
            <Field label="Altura (cm)"><input type="number" value={height} onChange={(e) => setHeight(+e.target.value)} className={inputCls} /></Field>
            <Field label="Cintura (cm)"><input type="number" value={waist} onChange={(e) => setWaist(+e.target.value)} className={inputCls} /></Field>
            <Field label="Pescoço (cm)"><input type="number" value={neck} onChange={(e) => setNeck(+e.target.value)} className={inputCls} /></Field>
            {sex === "F" && (
              <Field label="Quadril (cm)"><input type="number" value={hip} onChange={(e) => setHip(+e.target.value)} className={inputCls} /></Field>
            )}
          </div>
          <button type="submit" className={btnPrimary}>CALCULAR</button>
        </form>
      </Card>

      {result && (
        <Card>
          <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Resultado</h3>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Box label="IMC" value={result.imc.toString()} hint={result.classe} />
            <Box label="% Gordura" value={`${result.bf}%`} hint="Método US Navy" />
            <Box label="Massa magra" value={`${result.mm} kg`} hint="Estimada" />
            <Box label="RCQ" value={result.rcq.toString()} hint="Cintura/Quadril" />
          </div>
        </Card>
      )}
    </AppShell>
  );
}

function Box({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xl font-extrabold text-primary mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>
    </div>
  );
}
