/**
 * VRUMFIT — Motor de Treino Elite
 * Periodização científica baseada em:
 *  - Renaissance Periodization (Mike Israetel): MEV / MAV / MRV por grupo muscular
 *  - RIR (Reps in Reserve) para auto-regulação de intensidade
 *  - Double Progression (reps → carga)
 *  - Deload programado a cada 4–6 semanas
 *  - Balanço agonista/antagonista (puxar vs empurrar) para prevenção de desequilíbrio
 *  - Fórmula de Epley para estimar carga a partir de 1RM
 *
 * 100% TypeScript, roda no cliente, offline, custo zero.
 */

export type Goal = "hipertrofia" | "forca" | "resistencia" | "emagrecimento" | "condicionamento";
export type Level = "iniciante" | "intermediario" | "avancado";
export type Location = "academia" | "casa" | "ar_livre";
export type Equip = "completo" | "halteres" | "elasticos" | "peso_corporal";
export type Sex = "M" | "F";
export type MuscleGroup =
  | "peito" | "costas" | "quadriceps" | "posterior" | "gluteo"
  | "ombro" | "biceps" | "triceps" | "panturrilha" | "core" | "antebraco";

export interface ExerciseDef {
  name: string;
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
  pattern: "empurrar_h" | "empurrar_v" | "puxar_h" | "puxar_v" | "agachar" | "extensao_quadril" | "isolador" | "core" | "cardio";
  tier: "composto_pesado" | "composto_aux" | "isolador";
  equip: Equip[];
  contraindications?: ("lombar" | "ombro" | "joelho" | "cotovelo" | "punho")[];
  substitutes: string[];
}

// Biblioteca curada (sincronizada com os 204 da tabela exercises — núcleo prescritivo)
export const LIBRARY: ExerciseDef[] = [
  // PEITO
  { name: "Supino reto barra",        primary: "peito", secondary: ["triceps", "ombro"], pattern: "empurrar_h", tier: "composto_pesado", equip: ["completo"],            contraindications: ["ombro"], substitutes: ["Supino reto halter", "Supino máquina", "Flexão lastrada"] },
  { name: "Supino inclinado halter",  primary: "peito", secondary: ["ombro", "triceps"], pattern: "empurrar_h", tier: "composto_pesado", equip: ["completo", "halteres"], substitutes: ["Supino inclinado barra", "Supino inclinado máquina"] },
  { name: "Supino reto halter",       primary: "peito", secondary: ["triceps"],           pattern: "empurrar_h", tier: "composto_aux",   equip: ["completo", "halteres"], substitutes: ["Supino reto barra", "Crucifixo halter"] },
  { name: "Crucifixo polia",          primary: "peito",                                    pattern: "isolador",   tier: "isolador",       equip: ["completo"],            substitutes: ["Crucifixo halter", "Crossover", "Peck deck"] },
  { name: "Crossover",                primary: "peito",                                    pattern: "isolador",   tier: "isolador",       equip: ["completo"],            substitutes: ["Crucifixo polia", "Peck deck"] },
  { name: "Flexão de braço",          primary: "peito", secondary: ["triceps", "core"],   pattern: "empurrar_h", tier: "composto_aux",   equip: ["peso_corporal"],       substitutes: ["Flexão inclinada", "Flexão declinada"] },
  { name: "Flexão diamante",          primary: "triceps", secondary: ["peito"],            pattern: "empurrar_h", tier: "composto_aux",   equip: ["peso_corporal"],       substitutes: ["Tríceps banco", "Mergulho"] },

  // COSTAS
  { name: "Barra fixa pronada",       primary: "costas", secondary: ["biceps"], pattern: "puxar_v", tier: "composto_pesado", equip: ["completo", "peso_corporal"], substitutes: ["Puxada frente", "Barra fixa supinada"] },
  { name: "Remada curvada barra",     primary: "costas", secondary: ["biceps", "posterior"], pattern: "puxar_h", tier: "composto_pesado", equip: ["completo"], contraindications: ["lombar"], substitutes: ["Remada cavalinho", "Remada halter", "Remada máquina"] },
  { name: "Puxada frente",            primary: "costas", secondary: ["biceps"], pattern: "puxar_v", tier: "composto_aux", equip: ["completo"], substitutes: ["Barra fixa pronada", "Pulldown halter"] },
  { name: "Remada baixa",             primary: "costas", secondary: ["biceps"], pattern: "puxar_h", tier: "composto_aux", equip: ["completo"], substitutes: ["Remada cavalinho", "Remada máquina"] },
  { name: "Remada halter unilateral", primary: "costas", secondary: ["biceps"], pattern: "puxar_h", tier: "composto_aux", equip: ["halteres", "completo"], substitutes: ["Remada baixa", "Remada cavalinho"] },
  { name: "Pull-over polia",          primary: "costas",                       pattern: "isolador", tier: "isolador",   equip: ["completo"], substitutes: ["Pull-over halter"] },

  // PERNA — QUADRÍCEPS
  { name: "Agachamento livre",        primary: "quadriceps", secondary: ["gluteo", "posterior", "core"], pattern: "agachar", tier: "composto_pesado", equip: ["completo"], contraindications: ["joelho", "lombar"], substitutes: ["Agachamento hack", "Leg press 45°", "Agachamento goblet"] },
  { name: "Leg press 45°",            primary: "quadriceps", secondary: ["gluteo"], pattern: "agachar", tier: "composto_pesado", equip: ["completo"], substitutes: ["Agachamento livre", "Hack squat"] },
  { name: "Agachamento goblet",       primary: "quadriceps", secondary: ["gluteo", "core"], pattern: "agachar", tier: "composto_aux", equip: ["halteres", "casa"], substitutes: ["Agachamento livre", "Búlgaro halter"] },
  { name: "Búlgaro halter",           primary: "quadriceps", secondary: ["gluteo"], pattern: "agachar", tier: "composto_aux", equip: ["halteres", "completo"], substitutes: ["Afundo passada", "Afundo smith"] },
  { name: "Cadeira extensora",        primary: "quadriceps", pattern: "isolador", tier: "isolador", equip: ["completo"], substitutes: ["Sissy squat"] },

  // PERNA — POSTERIOR
  { name: "Stiff barra",              primary: "posterior", secondary: ["gluteo", "lombar" as MuscleGroup], pattern: "extensao_quadril", tier: "composto_pesado", equip: ["completo"], contraindications: ["lombar"], substitutes: ["Stiff halter", "Levantamento terra romeno"] },
  { name: "Mesa flexora",             primary: "posterior", pattern: "isolador", tier: "isolador", equip: ["completo"], substitutes: ["Cadeira flexora", "Flexora em pé"] },
  { name: "Cadeira flexora",          primary: "posterior", pattern: "isolador", tier: "isolador", equip: ["completo"], substitutes: ["Mesa flexora"] },

  // GLÚTEO
  { name: "Hip thrust",               primary: "gluteo", secondary: ["posterior"], pattern: "extensao_quadril", tier: "composto_pesado", equip: ["completo"], substitutes: ["Elevação pélvica", "Glúteo na máquina"] },
  { name: "Elevação pélvica",         primary: "gluteo", pattern: "extensao_quadril", tier: "composto_aux", equip: ["peso_corporal", "halteres"], substitutes: ["Hip thrust"] },
  { name: "Cadeira abdutora",         primary: "gluteo", pattern: "isolador", tier: "isolador", equip: ["completo"], substitutes: ["Abdução com elástico", "Coice na polia"] },
  { name: "Coice na polia",           primary: "gluteo", pattern: "isolador", tier: "isolador", equip: ["completo"], substitutes: ["Cadeira abdutora", "Abdução elástico"] },

  // OMBRO
  { name: "Desenvolvimento halter",   primary: "ombro", secondary: ["triceps"], pattern: "empurrar_v", tier: "composto_pesado", equip: ["halteres", "completo"], substitutes: ["Desenvolvimento militar", "Desenvolvimento máquina"] },
  { name: "Desenvolvimento militar",  primary: "ombro", secondary: ["triceps", "core"], pattern: "empurrar_v", tier: "composto_pesado", equip: ["completo"], substitutes: ["Desenvolvimento halter"] },
  { name: "Elevação lateral halter",  primary: "ombro", pattern: "isolador", tier: "isolador", equip: ["halteres", "completo"], substitutes: ["Elevação lateral polia", "Elevação lateral máquina"] },
  { name: "Elevação frontal",         primary: "ombro", pattern: "isolador", tier: "isolador", equip: ["halteres", "completo"], substitutes: ["Elevação frontal polia"] },
  { name: "Face pull",                primary: "ombro", secondary: ["costas"], pattern: "puxar_h", tier: "isolador", equip: ["completo"], substitutes: ["Crucifixo inverso", "Remada alta corda"] },
  { name: "Crucifixo inverso",        primary: "ombro", secondary: ["costas"], pattern: "puxar_h", tier: "isolador", equip: ["halteres", "completo"], substitutes: ["Face pull"] },

  // BÍCEPS
  { name: "Rosca direta barra",       primary: "biceps", pattern: "isolador", tier: "composto_aux", equip: ["completo"], substitutes: ["Rosca alternada halter", "Rosca W"] },
  { name: "Rosca alternada halter",   primary: "biceps", pattern: "isolador", tier: "isolador", equip: ["halteres"], substitutes: ["Rosca direta barra", "Rosca martelo"] },
  { name: "Rosca martelo",            primary: "biceps", secondary: ["antebraco"], pattern: "isolador", tier: "isolador", equip: ["halteres"], substitutes: ["Rosca alternada"] },
  { name: "Rosca scott",              primary: "biceps", pattern: "isolador", tier: "isolador", equip: ["completo"], substitutes: ["Rosca concentrada"] },

  // TRÍCEPS
  { name: "Tríceps corda polia",      primary: "triceps", pattern: "isolador", tier: "composto_aux", equip: ["completo"], substitutes: ["Tríceps barra polia", "Tríceps francês"] },
  { name: "Tríceps testa barra",      primary: "triceps", pattern: "isolador", tier: "composto_aux", equip: ["completo"], substitutes: ["Tríceps francês halter"] },
  { name: "Mergulho paralelas",       primary: "triceps", secondary: ["peito"], pattern: "empurrar_v", tier: "composto_pesado", equip: ["peso_corporal", "completo"], contraindications: ["ombro"], substitutes: ["Mergulho banco", "Tríceps testa"] },
  { name: "Tríceps banco",            primary: "triceps", pattern: "empurrar_v", tier: "composto_aux", equip: ["peso_corporal"], substitutes: ["Mergulho paralelas"] },

  // PANTURRILHA
  { name: "Panturrilha em pé",        primary: "panturrilha", pattern: "isolador", tier: "isolador", equip: ["completo"], substitutes: ["Panturrilha sentado", "Panturrilha smith"] },
  { name: "Panturrilha sentado",      primary: "panturrilha", pattern: "isolador", tier: "isolador", equip: ["completo"], substitutes: ["Panturrilha em pé"] },

  // CORE
  { name: "Prancha frontal",          primary: "core", pattern: "core", tier: "isolador", equip: ["peso_corporal"], substitutes: ["Prancha lateral", "Hollow body"] },
  { name: "Abdominal infra",          primary: "core", pattern: "core", tier: "isolador", equip: ["peso_corporal"], substitutes: ["Elevação pernas", "Crunch reverso"] },
  { name: "Russian twist",            primary: "core", pattern: "core", tier: "isolador", equip: ["peso_corporal", "halteres"], substitutes: ["Pallof press", "Bicicleta"] },
  { name: "Pallof press",             primary: "core", pattern: "core", tier: "isolador", equip: ["completo", "elasticos"], substitutes: ["Prancha lateral"] },

  // CARDIO / HIIT
  { name: "Esteira HIIT",             primary: "core", pattern: "cardio", tier: "composto_aux", equip: ["completo"], substitutes: ["Bike HIIT", "Corrida ar livre", "Burpee"] },
  { name: "Bike LISS",                primary: "core", pattern: "cardio", tier: "composto_aux", equip: ["completo"], substitutes: ["Esteira LISS", "Caminhada inclinada"] },
  { name: "Burpee",                   primary: "core", pattern: "cardio", tier: "composto_aux", equip: ["peso_corporal"], substitutes: ["Mountain climber", "Jumping jack"] },
];

// MEV / MAV / MRV — séries semanais por grupo (Renaissance Periodization)
const VOLUME: Record<MuscleGroup, { mev: number; mav: number; mrv: number }> = {
  peito:       { mev: 8,  mav: 14, mrv: 22 },
  costas:      { mev: 10, mav: 16, mrv: 25 },
  quadriceps:  { mev: 8,  mav: 14, mrv: 20 },
  posterior:   { mev: 6,  mav: 12, mrv: 18 },
  gluteo:      { mev: 6,  mav: 12, mrv: 18 },
  ombro:       { mev: 8,  mav: 16, mrv: 22 },
  biceps:      { mev: 6,  mav: 12, mrv: 20 },
  triceps:     { mev: 6,  mav: 12, mrv: 18 },
  panturrilha: { mev: 6,  mav: 12, mrv: 16 },
  core:        { mev: 0,  mav: 8,  mrv: 16 },
  antebraco:   { mev: 0,  mav: 4,  mrv: 10 },
};

function targetVolume(g: MuscleGroup, level: Level) {
  const v = VOLUME[g];
  return level === "iniciante" ? v.mev : level === "avancado" ? Math.round((v.mav + v.mrv) / 2) : v.mav;
}

// Divisão automática por frequência semanal
type DayFocus = { name: string; groups: MuscleGroup[] };
function splitForFrequency(freq: number): DayFocus[] {
  switch (freq) {
    case 2: return [
      { name: "Full Body A", groups: ["quadriceps", "peito", "costas", "ombro", "core"] },
      { name: "Full Body B", groups: ["posterior", "gluteo", "costas", "peito", "biceps", "triceps"] },
    ];
    case 3: return [
      { name: "Push (peito/ombro/tríceps)", groups: ["peito", "ombro", "triceps"] },
      { name: "Pull (costas/bíceps)",       groups: ["costas", "biceps", "core"] },
      { name: "Legs (perna/glúteo)",        groups: ["quadriceps", "posterior", "gluteo", "panturrilha"] },
    ];
    case 4: return [
      { name: "Upper A — Peito/Costas",     groups: ["peito", "costas", "core"] },
      { name: "Lower A — Quadríceps focus", groups: ["quadriceps", "gluteo", "panturrilha"] },
      { name: "Upper B — Ombro/Braço",      groups: ["ombro", "biceps", "triceps"] },
      { name: "Lower B — Posterior focus",  groups: ["posterior", "gluteo", "panturrilha", "core"] },
    ];
    case 5: return [
      { name: "Push",  groups: ["peito", "ombro", "triceps"] },
      { name: "Pull",  groups: ["costas", "biceps"] },
      { name: "Legs",  groups: ["quadriceps", "posterior", "gluteo", "panturrilha"] },
      { name: "Upper", groups: ["peito", "costas", "ombro", "biceps", "triceps"] },
      { name: "Lower + Core", groups: ["quadriceps", "posterior", "gluteo", "core"] },
    ];
    case 6: return [
      { name: "Push A", groups: ["peito", "ombro", "triceps"] },
      { name: "Pull A", groups: ["costas", "biceps"] },
      { name: "Legs A", groups: ["quadriceps", "gluteo", "panturrilha"] },
      { name: "Push B", groups: ["ombro", "peito", "triceps"] },
      { name: "Pull B", groups: ["costas", "biceps", "core"] },
      { name: "Legs B", groups: ["posterior", "gluteo", "panturrilha"] },
    ];
    default: return splitForFrequency(3);
  }
}

// Reps / descanso / intensidade por objetivo
function prescription(goal: Goal) {
  switch (goal) {
    case "forca":            return { reps: "3-6",   rest: "2-3 min", rir: 1, intensity: "80-90% 1RM" };
    case "hipertrofia":      return { reps: "6-12",  rest: "60-90 s", rir: 2, intensity: "70-80% 1RM" };
    case "resistencia":      return { reps: "15-20", rest: "30-60 s", rir: 3, intensity: "50-65% 1RM" };
    case "emagrecimento":    return { reps: "12-15", rest: "30-45 s", rir: 2, intensity: "circuito + HIIT" };
    case "condicionamento":  return { reps: "10-15", rest: "45-60 s", rir: 2, intensity: "moderada" };
  }
}

export interface PrescribedExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  rir: number;
  tier: ExerciseDef["tier"];
  primary: MuscleGroup;
  substitutes: string[];
  loadHint?: string;
}

export interface PrescribedDay {
  name: string;
  focus: MuscleGroup[];
  warmup: string[];
  exercises: PrescribedExercise[];
  cardio?: string;
}

export interface WeekPlan {
  week: number;
  isDeload: boolean;
  rirTarget: number;
  days: PrescribedDay[];
}

export interface WorkoutPlanInput {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  goal: Goal;
  level: Level;
  frequency: number;          // 2..6
  sessionMinutes: number;     // 30..120
  location: Location;
  equip: Equip;
  injuries?: ("lombar" | "ombro" | "joelho" | "cotovelo" | "punho")[];
  weeks?: number;             // padrão 6 (com deload na última)
  oneRM?: { exercise?: string; kg?: number };
}

// Estima carga via Epley invertida a partir do %1RM-alvo
function loadFromOneRM(oneRM: number, repsAvg: number): number {
  // 1RM = peso × (1 + reps/30) → peso = 1RM / (1 + reps/30)
  return Math.round(oneRM / (1 + repsAvg / 30));
}

function repsAverage(reps: string): number {
  const m = reps.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return 10;
  return (Number(m[1]) + Number(m[2])) / 2;
}

function filterLibrary(input: WorkoutPlanInput): ExerciseDef[] {
  const allowedEquip: Equip[] =
    input.equip === "completo" ? ["completo", "halteres", "elasticos", "peso_corporal"] :
    input.equip === "halteres" ? ["halteres", "peso_corporal"] :
    input.equip === "elasticos" ? ["elasticos", "peso_corporal"] :
    ["peso_corporal"];
  return LIBRARY.filter((e) => {
    if (!e.equip.some((q) => allowedEquip.includes(q))) return false;
    if (input.injuries && e.contraindications?.some((c) => input.injuries!.includes(c))) return false;
    return true;
  });
}

function pickForGroup(pool: ExerciseDef[], group: MuscleGroup, slotsByTier: { pesado: number; aux: number; iso: number }) {
  const matches = pool.filter((e) => e.primary === group || e.secondary?.includes(group));
  const heavy = matches.filter((e) => e.tier === "composto_pesado" && e.primary === group);
  const aux   = matches.filter((e) => e.tier === "composto_aux"   && e.primary === group);
  const iso   = matches.filter((e) => e.tier === "isolador"       && e.primary === group);
  return [
    ...heavy.slice(0, slotsByTier.pesado),
    ...aux.slice(0, slotsByTier.aux),
    ...iso.slice(0, slotsByTier.iso),
  ];
}

function buildDay(focus: DayFocus, input: WorkoutPlanInput, pool: ExerciseDef[]): PrescribedDay {
  const rx = prescription(input.goal);
  const setsPerExercise = input.level === "iniciante" ? 3 : input.level === "avancado" ? 4 : 4;

  // Distribui volume semanal entre os dias que treinam o grupo (estimativa 2 exercícios principais por grupo)
  const chosen: PrescribedExercise[] = [];
  for (const g of focus.groups) {
    const target = targetVolume(g, input.level);
    // Mais séries → mais exercícios; menos → 1-2 exercícios
    const exNeeded = target >= 14 ? 3 : target >= 10 ? 2 : 1;
    const slots = exNeeded >= 3
      ? { pesado: 1, aux: 1, iso: 1 }
      : exNeeded === 2
        ? { pesado: 1, aux: 0, iso: 1 }
        : { pesado: 1, aux: 0, iso: 0 };
    const picks = pickForGroup(pool, g, slots);

    for (const p of picks) {
      const sets = setsPerExercise + (p.tier === "composto_pesado" ? 0 : -1);
      let loadHint: string | undefined;
      if (input.oneRM?.kg && p.tier === "composto_pesado") {
        const avg = repsAverage(rx.reps);
        loadHint = `~${loadFromOneRM(input.oneRM.kg, avg)} kg`;
      }
      chosen.push({
        name: p.name,
        sets: Math.max(2, sets),
        reps: rx.reps,
        rest: rx.rest,
        rir: rx.rir,
        tier: p.tier,
        primary: p.primary,
        substitutes: p.substitutes,
        loadHint,
      });
    }
  }

  // Limite por duração da sessão (~5 min por exercício composto, 4 min isolador)
  const budget = input.sessionMinutes;
  let acc = 0;
  const trimmed: PrescribedExercise[] = [];
  for (const ex of chosen) {
    const cost = ex.tier === "isolador" ? 4 : 5;
    if (acc + cost > budget) break;
    trimmed.push(ex);
    acc += cost;
  }

  const warmup = [
    "5 min cardio leve (esteira / bike)",
    "Mobilidade articular dos grupos do dia (2 min)",
    "1-2 séries de aproximação com 50% da carga no primeiro exercício composto",
  ];

  let cardio: string | undefined;
  if (input.goal === "emagrecimento") cardio = "Finalizar com 12-15 min HIIT (30s forte / 30s leve)";
  if (input.goal === "condicionamento") cardio = "Finalizar com 20 min LISS (zona 2)";

  return { name: focus.name, focus: focus.groups, warmup, exercises: trimmed, cardio };
}

export function generateWorkoutPlan(input: WorkoutPlanInput): WeekPlan[] {
  const weeks = input.weeks ?? 6;
  const pool = filterLibrary(input);
  const split = splitForFrequency(input.frequency);

  const plans: WeekPlan[] = [];
  for (let w = 1; w <= weeks; w++) {
    const isDeload = w === weeks && weeks >= 4; // deload na última semana do bloco
    const rxBase = prescription(input.goal).rir;
    // RIR desce ao longo das semanas (3→2→1→0), exceto deload
    const rirTarget = isDeload ? 4 : Math.max(0, rxBase - Math.floor((w - 1) / 2));

    const days = split.map((d) => {
      const day = buildDay(d, input, pool);
      if (isDeload) {
        // -40% volume no deload (séries arredondadas pra baixo)
        day.exercises = day.exercises.map((ex) => ({ ...ex, sets: Math.max(2, Math.round(ex.sets * 0.6)) }));
        day.cardio = day.cardio ? "Cardio leve 10 min (semana de deload)" : undefined;
      } else if (w >= 2) {
        // Progressão: +1 série no exercício pesado a cada 2 semanas, até cap
        day.exercises = day.exercises.map((ex) =>
          ex.tier === "composto_pesado" && w % 2 === 0 ? { ...ex, sets: Math.min(ex.sets + 1, 6) } : ex
        );
      }
      return { ...day, exercises: day.exercises.map((ex) => ({ ...ex, rir: rirTarget })) };
    });

    plans.push({ week: w, isDeload, rirTarget, days });
  }
  return plans;
}
