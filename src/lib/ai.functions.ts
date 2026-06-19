import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const WorkoutInput = z.object({
  goal: z.string(),
  level: z.string(),
  days: z.number().int().min(1).max(7),
  split: z.string(),
  notes: z.string().optional().default(""),
});

const WorkoutSchema = z.object({
  days: z.array(
    z.object({
      name: z.string(),
      focus: z.string(),
      exercises: z.array(
        z.object({
          name: z.string(),
          sets: z.number(),
          reps: z.string(),
          rest: z.string(),
          tip: z.string(),
        }),
      ),
    }),
  ),
});

export const generateWorkoutAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => WorkoutInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");
    const gateway = createLovableAiGatewayProvider(key);

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: WorkoutSchema }),
      system:
        "Você é um personal trainer experiente. Gere planos de treino seguros, eficazes e progressivos em português do Brasil. Use exercícios comuns de academia.",
      prompt: `Crie um plano de treino com ${data.days} dias por semana.
Divisão: ${data.split}
Objetivo: ${data.goal}
Nível: ${data.level}
Observações: ${data.notes || "nenhuma"}

Para cada dia retorne 5-7 exercícios com séries, repetições, descanso e uma dica curta de execução.`,
    });

    return output;
  });

const DietInput = z.object({
  goal: z.string(), // emagrecimento | hipertrofia | manutencao
  weightKg: z.number(),
  heightCm: z.number(),
  age: z.number(),
  sex: z.enum(["m", "f"]),
  activity: z.string(),
  restrictions: z.string().optional().default(""),
});

const DietSchema = z.object({
  totalKcal: z.number(),
  macros: z.object({
    protein_g: z.number(),
    carbs_g: z.number(),
    fat_g: z.number(),
  }),
  meals: z.array(
    z.object({
      name: z.string(),
      time: z.string(),
      items: z.array(
        z.object({
          food: z.string(),
          portion: z.string(),
          kcal: z.number(),
        }),
      ),
    }),
  ),
  hydration_liters: z.number(),
  tips: z.array(z.string()),
});

export const generateDietAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DietInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");
    const gateway = createLovableAiGatewayProvider(key);

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: DietSchema }),
      system:
        "Você é um nutricionista esportivo. Gere planos alimentares brasileiros, equilibrados, com alimentos acessíveis. Calcule kcal/macros de forma realista.",
      prompt: `Monte um plano alimentar diário.
Objetivo: ${data.goal}
Peso: ${data.weightKg}kg, Altura: ${data.heightCm}cm, Idade: ${data.age}, Sexo: ${data.sex}
Nível de atividade: ${data.activity}
Restrições: ${data.restrictions || "nenhuma"}

Retorne 5-6 refeições com horário, itens (alimento, porção, kcal), além de macros totais, hidratação em litros e 3 dicas curtas.`,
    });

    return output;
  });
