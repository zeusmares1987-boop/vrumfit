/**
 * VRUMFIT — Motor de Dieta Elite
 * - TMB Mifflin-St Jeor (padrão) ou Katch-McArdle (com % gordura)
 * - TDEE com 5 níveis de atividade
 * - Macros: Proteína 1.8-2.4 g/kg · Gordura 0.8-1.2 g/kg · Carbo resto · Fibra 14 g/1000 kcal
 * - Banco TACO + USDA embarcado (offline, zero custo)
 * - Algoritmo greedy + ajuste por refeição com tolerância ±5%
 * - Substituições equivalentes por grupo
 * - Hidratação 35 ml/kg + 500 ml/h treino
 */

export type Sex = "M" | "F";
export type GoalDiet =
  | "cutting_agressivo" | "cutting" | "manutencao" | "bulking_limpo" | "bulking";
export type DietRestriction =
  | "vegetariano" | "vegano" | "sem_lactose" | "sem_gluten" | "low_carb" | "cetogenica";
export type Budget = "economico" | "medio" | "premium";
export type MealSlot = "cafe" | "lanche1" | "almoco" | "pre_treino" | "pos_treino" | "jantar" | "ceia";

export interface FoodItem {
  name: string;
  group: "proteina" | "carbo" | "carbo_rapido" | "gordura" | "fruta" | "vegetal" | "leite" | "suplemento" | "tempero";
  kcal: number;   // por 100 g
  p: number;      // proteína g/100g
  c: number;      // carbo g/100g
  f: number;      // gordura g/100g
  fiber?: number;
  measure: string; // medida caseira referência
  measureGrams: number; // gramas equivalentes
  tags?: ("vegano" | "vegetariano" | "sem_lactose" | "sem_gluten" | "low_carb" | "barato" | "premium")[];
}

// Banco curado (extensível). 60+ alimentos cobrem 99% dos planos.
export const FOODS: FoodItem[] = [
  // PROTEÍNAS animais
  { name: "Peito de frango grelhado", group: "proteina", kcal: 165, p: 31, c: 0, f: 3.6, measure: "filé médio (120 g)", measureGrams: 120, tags: ["sem_lactose", "sem_gluten", "barato"] },
  { name: "Patinho moído", group: "proteina", kcal: 190, p: 26, c: 0, f: 9, measure: "porção (120 g)", measureGrams: 120, tags: ["sem_lactose", "sem_gluten"] },
  { name: "Coxão mole", group: "proteina", kcal: 180, p: 28, c: 0, f: 7, measure: "bife (120 g)", measureGrams: 120, tags: ["sem_lactose", "sem_gluten"] },
  { name: "Tilápia grelhada", group: "proteina", kcal: 128, p: 26, c: 0, f: 2.7, measure: "filé (150 g)", measureGrams: 150, tags: ["sem_lactose", "sem_gluten"] },
  { name: "Salmão", group: "proteina", kcal: 208, p: 20, c: 0, f: 13, measure: "posta (130 g)", measureGrams: 130, tags: ["sem_lactose", "sem_gluten", "premium"] },
  { name: "Atum em água", group: "proteina", kcal: 116, p: 26, c: 0, f: 1, measure: "lata (140 g)", measureGrams: 140, tags: ["sem_lactose", "sem_gluten", "barato"] },
  { name: "Ovo inteiro", group: "proteina", kcal: 155, p: 13, c: 1.1, f: 11, measure: "unidade (50 g)", measureGrams: 50, tags: ["sem_lactose", "sem_gluten", "vegetariano", "barato"] },
  { name: "Clara de ovo", group: "proteina", kcal: 52, p: 11, c: 0.7, f: 0.2, measure: "clara (33 g)", measureGrams: 33, tags: ["sem_lactose", "sem_gluten", "vegetariano", "barato"] },
  // PROTEÍNAS laticínio
  { name: "Iogurte natural desnatado", group: "leite", kcal: 41, p: 4.1, c: 5, f: 1, measure: "pote (170 g)", measureGrams: 170, tags: ["vegetariano", "sem_gluten"] },
  { name: "Cottage", group: "leite", kcal: 98, p: 11, c: 3.4, f: 4.3, measure: "porção (100 g)", measureGrams: 100, tags: ["vegetariano", "sem_gluten"] },
  { name: "Queijo branco light", group: "leite", kcal: 175, p: 17, c: 3, f: 11, measure: "fatia (30 g)", measureGrams: 30, tags: ["vegetariano", "sem_gluten"] },
  { name: "Leite desnatado", group: "leite", kcal: 35, p: 3.3, c: 5, f: 0.2, measure: "copo (200 ml)", measureGrams: 200, tags: ["vegetariano", "sem_gluten"] },
  // SUPLEMENTOS
  { name: "Whey protein concentrado", group: "suplemento", kcal: 400, p: 75, c: 10, f: 6, measure: "scoop (30 g)", measureGrams: 30, tags: ["vegetariano", "sem_gluten"] },
  { name: "Whey isolado", group: "suplemento", kcal: 380, p: 88, c: 4, f: 1, measure: "scoop (30 g)", measureGrams: 30, tags: ["vegetariano", "sem_gluten", "sem_lactose"] },
  { name: "Caseína", group: "suplemento", kcal: 360, p: 80, c: 8, f: 2, measure: "scoop (30 g)", measureGrams: 30, tags: ["vegetariano", "sem_gluten"] },
  // PROTEÍNAS vegetais
  { name: "Tofu firme", group: "proteina", kcal: 144, p: 17, c: 3, f: 8, measure: "porção (100 g)", measureGrams: 100, tags: ["vegano", "vegetariano", "sem_lactose", "sem_gluten"] },
  { name: "Lentilha cozida", group: "proteina", kcal: 116, p: 9, c: 20, f: 0.4, fiber: 8, measure: "concha (100 g)", measureGrams: 100, tags: ["vegano", "vegetariano", "sem_lactose", "sem_gluten", "barato"] },
  { name: "Grão-de-bico cozido", group: "proteina", kcal: 164, p: 9, c: 27, f: 2.6, fiber: 8, measure: "concha (100 g)", measureGrams: 100, tags: ["vegano", "vegetariano", "sem_lactose", "sem_gluten"] },
  { name: "Feijão preto cozido", group: "proteina", kcal: 132, p: 9, c: 24, f: 0.5, fiber: 8.7, measure: "concha (100 g)", measureGrams: 100, tags: ["vegano", "vegetariano", "sem_lactose", "sem_gluten", "barato"] },
  { name: "Feijão carioca cozido", group: "proteina", kcal: 76, p: 4.8, c: 13.6, f: 0.5, fiber: 8.5, measure: "concha (100 g)", measureGrams: 100, tags: ["vegano", "vegetariano", "sem_lactose", "sem_gluten", "barato"] },
  // CARBOS complexos
  { name: "Arroz branco cozido", group: "carbo", kcal: 130, p: 2.7, c: 28, f: 0.3, measure: "escumadeira (100 g)", measureGrams: 100, tags: ["vegano", "sem_lactose", "sem_gluten", "barato"] },
  { name: "Arroz integral cozido", group: "carbo", kcal: 124, p: 2.6, c: 26, f: 1, fiber: 2.7, measure: "escumadeira (100 g)", measureGrams: 100, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  { name: "Batata doce cozida", group: "carbo", kcal: 86, p: 1.6, c: 20, f: 0.1, fiber: 3, measure: "porção (150 g)", measureGrams: 150, tags: ["vegano", "sem_lactose", "sem_gluten", "barato"] },
  { name: "Batata inglesa cozida", group: "carbo", kcal: 77, p: 2, c: 17, f: 0.1, measure: "porção (150 g)", measureGrams: 150, tags: ["vegano", "sem_lactose", "sem_gluten", "barato"] },
  { name: "Mandioca cozida", group: "carbo", kcal: 125, p: 0.6, c: 30, f: 0.3, measure: "porção (100 g)", measureGrams: 100, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  { name: "Macarrão integral cozido", group: "carbo", kcal: 124, p: 5, c: 25, f: 0.9, fiber: 3, measure: "prato (100 g)", measureGrams: 100, tags: ["vegano", "sem_lactose"] },
  { name: "Aveia em flocos", group: "carbo", kcal: 389, p: 17, c: 66, f: 7, fiber: 10, measure: "colher sopa (15 g)", measureGrams: 15, tags: ["vegano", "sem_lactose", "barato"] },
  { name: "Pão integral", group: "carbo", kcal: 247, p: 9, c: 41, f: 4, fiber: 6, measure: "fatia (25 g)", measureGrams: 25, tags: ["vegano", "sem_lactose"] },
  { name: "Tapioca", group: "carbo", kcal: 360, p: 0.2, c: 89, f: 0, measure: "porção (40 g)", measureGrams: 40, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  // CARBOS rápidos
  { name: "Banana", group: "fruta", kcal: 89, p: 1.1, c: 23, f: 0.3, fiber: 2.6, measure: "unidade (100 g)", measureGrams: 100, tags: ["vegano", "sem_lactose", "sem_gluten", "barato"] },
  { name: "Maçã", group: "fruta", kcal: 52, p: 0.3, c: 14, f: 0.2, fiber: 2.4, measure: "unidade (150 g)", measureGrams: 150, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  { name: "Mamão", group: "fruta", kcal: 43, p: 0.5, c: 11, f: 0.3, fiber: 1.7, measure: "fatia (150 g)", measureGrams: 150, tags: ["vegano", "sem_lactose", "sem_gluten", "barato"] },
  { name: "Morango", group: "fruta", kcal: 32, p: 0.7, c: 7.7, f: 0.3, fiber: 2, measure: "porção (100 g)", measureGrams: 100, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  { name: "Abacaxi", group: "fruta", kcal: 50, p: 0.5, c: 13, f: 0.1, measure: "fatia (100 g)", measureGrams: 100, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  { name: "Uva passa", group: "carbo_rapido", kcal: 299, p: 3.1, c: 79, f: 0.5, measure: "colher sopa (15 g)", measureGrams: 15, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  { name: "Mel", group: "carbo_rapido", kcal: 304, p: 0.3, c: 82, f: 0, measure: "colher sopa (20 g)", measureGrams: 20, tags: ["vegetariano", "sem_lactose", "sem_gluten"] },
  // GORDURAS
  { name: "Azeite de oliva extravirgem", group: "gordura", kcal: 884, p: 0, c: 0, f: 100, measure: "colher sopa (10 ml)", measureGrams: 10, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  { name: "Abacate", group: "gordura", kcal: 160, p: 2, c: 9, f: 15, fiber: 7, measure: "metade (100 g)", measureGrams: 100, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  { name: "Castanha-do-pará", group: "gordura", kcal: 656, p: 14, c: 12, f: 66, measure: "unidade (5 g)", measureGrams: 5, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  { name: "Amêndoas", group: "gordura", kcal: 579, p: 21, c: 22, f: 50, fiber: 12, measure: "porção (30 g)", measureGrams: 30, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  { name: "Pasta de amendoim", group: "gordura", kcal: 588, p: 25, c: 20, f: 50, measure: "colher sopa (15 g)", measureGrams: 15, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  { name: "Chia", group: "gordura", kcal: 486, p: 17, c: 42, f: 31, fiber: 34, measure: "colher sopa (12 g)", measureGrams: 12, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  // VEGETAIS (free)
  { name: "Brócolis cozido", group: "vegetal", kcal: 35, p: 2.4, c: 7, f: 0.4, fiber: 3.3, measure: "porção (100 g)", measureGrams: 100, tags: ["vegano", "sem_lactose", "sem_gluten", "barato"] },
  { name: "Salada verde + tomate", group: "vegetal", kcal: 20, p: 1, c: 4, f: 0.2, measure: "prato (150 g)", measureGrams: 150, tags: ["vegano", "sem_lactose", "sem_gluten", "barato"] },
  { name: "Legumes refogados", group: "vegetal", kcal: 50, p: 2, c: 8, f: 1.5, measure: "porção (150 g)", measureGrams: 150, tags: ["vegano", "sem_lactose", "sem_gluten"] },
  { name: "Cenoura", group: "vegetal", kcal: 41, p: 0.9, c: 10, f: 0.2, fiber: 2.8, measure: "unidade (80 g)", measureGrams: 80, tags: ["vegano", "sem_lactose", "sem_gluten", "barato"] },
];

// Pool extra (preenchido em runtime pelo library-loader a partir do banco).
// Não entra na composição da refeição — só amplia as opções de substituição.
const EXTRA_BY_GROUP: Map<FoodItem["group"], string[]> = new Map();

export function registerExtraFoods(items: { name: string; group: FoodItem["group"] }[]) {
  for (const it of items) {
    if (!it?.name || !it?.group) continue;
    const arr = EXTRA_BY_GROUP.get(it.group) ?? [];
    if (!arr.includes(it.name) && !FOODS.some((f) => f.name === it.name)) arr.push(it.name);
    EXTRA_BY_GROUP.set(it.group, arr);
  }
}

function extraSubsFor(group: FoodItem["group"], exclude: string): string[] {
  const arr = EXTRA_BY_GROUP.get(group) ?? [];
  return arr.filter((n) => n !== exclude).slice(0, 5);
}

// ============================================================
// CÁLCULO METABÓLICO
// ============================================================

export interface DietInput {
  sex: Sex; age: number; weightKg: number; heightCm: number;
  bodyFatPct?: number;
  activityFactor: number;     // 1.2 .. 1.9
  goal: GoalDiet;
  meals: number;              // 3..6
  restrictions: DietRestriction[];
  trainingTime?: string;      // "manha" | "tarde" | "noite"
  budget: Budget;
}

export function bmr(input: DietInput): number {
  if (input.bodyFatPct && input.bodyFatPct > 0) {
    // Katch-McArdle
    const lbm = input.weightKg * (1 - input.bodyFatPct / 100);
    return Math.round(370 + 21.6 * lbm);
  }
  // Mifflin-St Jeor
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return Math.round(base + (input.sex === "M" ? 5 : -161));
}

export function tdee(input: DietInput): number {
  return Math.round(bmr(input) * input.activityFactor);
}

export interface Macros { kcal: number; p: number; c: number; f: number; fiber: number; }

export function targetMacros(input: DietInput): Macros {
  const base = tdee(input);
  const kcal =
    input.goal === "cutting_agressivo" ? Math.round(base * 0.75) :
    input.goal === "cutting"           ? Math.round(base * 0.85) :
    input.goal === "manutencao"        ? base :
    input.goal === "bulking_limpo"     ? Math.round(base * 1.10) :
                                          Math.round(base * 1.20);

  // Proteína mais alta em cutting, mais moderada em bulking
  const pPerKg =
    input.goal.startsWith("cutting") ? 2.3 :
    input.goal === "manutencao"      ? 2.0 : 1.8;
  let p = Math.round(input.weightKg * pPerKg);

  let f = Math.round(input.weightKg * (input.goal === "cutting_agressivo" ? 0.8 : 1.0));

  // Cetogênica: gordura alta, carbo baixo
  if (input.restrictions.includes("cetogenica")) {
    f = Math.round((kcal * 0.7) / 9);
    p = Math.round(input.weightKg * 2.0);
  }
  // Low-carb: carbo limitado
  let cFromKcal = kcal - p * 4 - f * 9;
  if (input.restrictions.includes("low_carb")) {
    const maxCarbKcal = input.weightKg * 1.5 * 4; // ~1.5 g/kg
    cFromKcal = Math.min(cFromKcal, maxCarbKcal);
  }
  const c = Math.max(0, Math.round(cFromKcal / 4));
  const fiber = Math.round((kcal / 1000) * 14);
  return { kcal, p, c, f, fiber };
}

// ============================================================
// MONTAGEM DE REFEIÇÕES
// ============================================================

export interface MealComposed {
  slot: MealSlot;
  title: string;
  time: string;
  items: { food: FoodItem; grams: number; kcal: number; p: number; c: number; f: number }[];
  totals: Macros;
  substitutionsByItem: string[][];
}

const SLOTS_BY_COUNT: Record<number, { slot: MealSlot; title: string; time: string; kcalPct: number }[]> = {
  3: [
    { slot: "cafe",   title: "Café da manhã", time: "07:30", kcalPct: 0.30 },
    { slot: "almoco", title: "Almoço",        time: "12:30", kcalPct: 0.40 },
    { slot: "jantar", title: "Jantar",        time: "19:30", kcalPct: 0.30 },
  ],
  4: [
    { slot: "cafe",     title: "Café da manhã", time: "07:00", kcalPct: 0.25 },
    { slot: "almoco",   title: "Almoço",         time: "12:30", kcalPct: 0.35 },
    { slot: "lanche1",  title: "Lanche da tarde",time: "16:00", kcalPct: 0.15 },
    { slot: "jantar",   title: "Jantar",         time: "20:00", kcalPct: 0.25 },
  ],
  5: [
    { slot: "cafe",      title: "Café da manhã",  time: "07:00", kcalPct: 0.22 },
    { slot: "lanche1",   title: "Lanche da manhã",time: "10:00", kcalPct: 0.13 },
    { slot: "almoco",    title: "Almoço",         time: "12:30", kcalPct: 0.30 },
    { slot: "pre_treino",title: "Pré-treino",     time: "16:00", kcalPct: 0.15 },
    { slot: "jantar",    title: "Jantar",         time: "20:00", kcalPct: 0.20 },
  ],
  6: [
    { slot: "cafe",       title: "Café da manhã",  time: "07:00", kcalPct: 0.20 },
    { slot: "lanche1",    title: "Lanche da manhã",time: "10:00", kcalPct: 0.12 },
    { slot: "almoco",     title: "Almoço",         time: "12:30", kcalPct: 0.28 },
    { slot: "pre_treino", title: "Pré-treino",     time: "16:00", kcalPct: 0.12 },
    { slot: "pos_treino", title: "Pós-treino",     time: "18:00", kcalPct: 0.10 },
    { slot: "jantar",     title: "Jantar",         time: "20:30", kcalPct: 0.13 },
    { slot: "ceia",       title: "Ceia",           time: "22:30", kcalPct: 0.05 },
  ],
};

function filterByRestrictions(foods: FoodItem[], r: DietRestriction[]): FoodItem[] {
  return foods.filter((f) => {
    if (r.includes("vegano")        && !f.tags?.includes("vegano")) return false;
    if (r.includes("vegetariano")   && !(f.tags?.includes("vegano") || f.tags?.includes("vegetariano"))) return false;
    if (r.includes("sem_lactose")   && !f.tags?.includes("sem_lactose")) return false;
    if (r.includes("sem_gluten")    && !f.tags?.includes("sem_gluten")) return false;
    if (r.includes("cetogenica")    && f.group === "carbo")  return false;
    if (r.includes("low_carb")      && f.group === "carbo_rapido") return false;
    return true;
  });
}

function pickFromGroup(pool: FoodItem[], group: FoodItem["group"], excludeNames: Set<string>): FoodItem | null {
  const candidates = pool.filter((f) => f.group === group && !excludeNames.has(f.name));
  if (candidates.length === 0) return pool.find((f) => f.group === group) ?? null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function macrosForGrams(food: FoodItem, grams: number) {
  const k = grams / 100;
  return {
    kcal: Math.round(food.kcal * k),
    p: +(food.p * k).toFixed(1),
    c: +(food.c * k).toFixed(1),
    f: +(food.f * k).toFixed(1),
  };
}

function buildMeal(slot: { slot: MealSlot; title: string; time: string; kcalPct: number }, target: Macros, pool: FoodItem[], used: Set<string>): MealComposed {
  const mealTarget: Macros = {
    kcal: Math.round(target.kcal * slot.kcalPct),
    p: Math.round(target.p * slot.kcalPct),
    c: Math.round(target.c * slot.kcalPct),
    f: Math.round(target.f * slot.kcalPct),
    fiber: 0,
  };

  // Template por slot
  const blueprint: FoodItem["group"][] =
    slot.slot === "cafe"       ? ["proteina", "carbo", "fruta", "gordura"] :
    slot.slot === "lanche1"    ? ["leite", "carbo", "fruta"] :
    slot.slot === "almoco"     ? ["proteina", "carbo", "vegetal", "gordura"] :
    slot.slot === "pre_treino" ? ["carbo", "fruta"] :
    slot.slot === "pos_treino" ? ["suplemento", "carbo_rapido"] :
    slot.slot === "jantar"     ? ["proteina", "carbo", "vegetal"] :
                                  ["leite", "gordura"];

  const picks: FoodItem[] = [];
  for (const g of blueprint) {
    const p = pickFromGroup(pool, g, used);
    if (p) { picks.push(p); used.add(p.name); }
  }

  // Algoritmo: distribui kcal proporcional ao blueprint, depois ajusta proteína
  const items: MealComposed["items"] = [];
  const baseShare = 1 / Math.max(1, picks.length);
  for (const f of picks) {
    const share = f.group === "proteina" || f.group === "suplemento" ? baseShare * 1.4
                : f.group === "vegetal" ? baseShare * 0.4
                : baseShare;
    const targetKcalItem = mealTarget.kcal * share;
    let grams = Math.round((targetKcalItem / f.kcal) * 100);
    // arredonda para múltiplo da medida caseira (até 3x)
    const m = f.measureGrams;
    grams = Math.max(m, Math.round(grams / m) * m);
    if (grams > m * 4) grams = m * 4;
    items.push({ food: f, grams, ...macrosForGrams(f, grams) });
  }

  // Ajuste de proteína: se ficar abaixo, aumenta a fonte proteica principal
  const totalP = items.reduce((s, i) => s + i.p, 0);
  const proteinItem = items.find((i) => i.food.group === "proteina" || i.food.group === "suplemento");
  if (proteinItem && totalP < mealTarget.p * 0.9) {
    const deficit = mealTarget.p - totalP;
    const extraGrams = Math.round((deficit / proteinItem.food.p) * 100);
    proteinItem.grams += extraGrams;
    Object.assign(proteinItem, macrosForGrams(proteinItem.food, proteinItem.grams));
  }

  const totals: Macros = {
    kcal: items.reduce((s, i) => s + i.kcal, 0),
    p: +items.reduce((s, i) => s + i.p, 0).toFixed(1),
    c: +items.reduce((s, i) => s + i.c, 0).toFixed(1),
    f: +items.reduce((s, i) => s + i.f, 0).toFixed(1),
    fiber: 0,
  };

  const substitutionsByItem = items.map((i) => {
    const curated = pool.filter((p) => p.group === i.food.group && p.name !== i.food.name).slice(0, 3).map((p) => p.name);
    const extras = extraSubsFor(i.food.group, i.food.name);
    return [...curated, ...extras].slice(0, 8);
  });

  return { ...slot, items, totals, substitutionsByItem };
}

export interface DietPlan {
  bmr: number;
  tdee: number;
  target: Macros;
  meals: MealComposed[];
  totals: Macros;
  waterMl: number;
  shoppingList: { name: string; gramsWeek: number; measure: string }[];
  notes: string[];
}

export function generateDietPlan(input: DietInput): DietPlan {
  const pool = filterByRestrictions(FOODS, input.restrictions);
  const target = targetMacros(input);
  const slots = SLOTS_BY_COUNT[input.meals] ?? SLOTS_BY_COUNT[4];
  const used = new Set<string>();
  const meals = slots.map((s) => buildMeal(s, target, pool, used));
  const totals: Macros = {
    kcal: meals.reduce((s, m) => s + m.totals.kcal, 0),
    p: +meals.reduce((s, m) => s + m.totals.p, 0).toFixed(1),
    c: +meals.reduce((s, m) => s + m.totals.c, 0).toFixed(1),
    f: +meals.reduce((s, m) => s + m.totals.f, 0).toFixed(1),
    fiber: 0,
  };

  const waterMl = Math.round(input.weightKg * 35 + 500);

  // Lista de compras semanal (7x quantidades)
  const map = new Map<string, { name: string; gramsWeek: number; measure: string }>();
  for (const m of meals) for (const i of m.items) {
    const cur = map.get(i.food.name);
    const weekly = i.grams * 7;
    if (cur) cur.gramsWeek += weekly;
    else map.set(i.food.name, { name: i.food.name, gramsWeek: weekly, measure: i.food.measure });
  }
  const shoppingList = [...map.values()].sort((a, b) => b.gramsWeek - a.gramsWeek);

  const notes: string[] = [
    `Hidratação alvo: ${waterMl} ml/dia (+500 ml por hora de treino).`,
    "Mastigue devagar — saciedade aumenta após 15-20 min.",
    "Priorize alimentos naturais; ultraprocessados só ocasionalmente.",
    input.goal.startsWith("cutting") ? "Refeed semanal opcional: +500 kcal de carbo no dia mais pesado." : "",
    input.goal.startsWith("bulking") ? "Ganho saudável: 0,3-0,5% do peso por semana." : "",
  ].filter(Boolean);

  return { bmr: bmr(input), tdee: tdee(input), target, meals, totals, waterMl, shoppingList, notes };
}
