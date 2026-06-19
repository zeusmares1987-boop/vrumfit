import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

// Cores VrumFit
const COLORS = {
  bg: "#0A0A0B",
  card: "#141416",
  border: "#2A2A2D",
  text: "#FFFFFF",
  muted: "#A8A8AD",
  primary: "#FF7A18",
  primaryDim: "#C0470A",
};

// =================================================================
// PDF DE TREINO — padrão "Sugestão de treino – Dia X"
// =================================================================

const wStyles = StyleSheet.create({
  page: { backgroundColor: COLORS.bg, color: COLORS.text, padding: 24, fontFamily: "Helvetica" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  logoBlock: { flexDirection: "row", alignItems: "center" },
  logoText: { fontSize: 16, fontWeight: 700, color: COLORS.text, letterSpacing: 0.5 },
  logoOrange: { color: COLORS.primary, fontWeight: 700 },
  logoSub: { fontSize: 7, color: COLORS.primary, letterSpacing: 2, marginTop: 1, fontWeight: 700 },
  title: { fontSize: 22, fontWeight: 900, color: COLORS.text, textAlign: "center", marginTop: 8, marginBottom: 4 },
  titleAccent: { color: COLORS.primary },
  divider: { height: 2, backgroundColor: COLORS.primary, width: 60, alignSelf: "center", marginBottom: 18, borderRadius: 2 },
  exercise: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 14, marginBottom: 14 },
  exNumber: { width: 28, height: 28, backgroundColor: "#1A1A1D", color: COLORS.text, fontSize: 14, fontWeight: 700, textAlign: "center", paddingTop: 6, borderRadius: 6, marginRight: 10 },
  exImage: { width: 130, height: 100, marginRight: 12, borderRadius: 8 },
  exBody: { flex: 1 },
  exName: { fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 6 },
  exStat: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  exStatIcon: { color: COLORS.primary, fontSize: 11, marginRight: 6, fontWeight: 700 },
  exStatText: { fontSize: 10, color: COLORS.muted },
  exTipsDivider: { height: 1, backgroundColor: COLORS.primary, opacity: 0.4, width: 30, marginVertical: 6 },
  exTip: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
  exTipArrow: { color: COLORS.primary, fontSize: 10, fontWeight: 700, marginRight: 5 },
  exTipText: { fontSize: 9, color: COLORS.muted, flex: 1, lineHeight: 1.35 },
  footer: { marginTop: "auto", flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  footerBox: { flex: 1, backgroundColor: COLORS.card, borderRadius: 8, padding: 10, flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1, borderColor: COLORS.border },
  footerIcon: { width: 22, height: 22, backgroundColor: COLORS.primary, borderRadius: 11, color: "#fff", textAlign: "center", fontSize: 12, fontWeight: 700, paddingTop: 4 },
  footerText: { flex: 1, fontSize: 8.5, color: COLORS.muted, lineHeight: 1.4 },
  footerTitle: { fontSize: 11, color: COLORS.text, fontWeight: 700, marginBottom: 2 },
});

export type WorkoutPDFExercise = {
  name: string;
  imageStart?: string;
  imageEnd?: string;
  sets: string;
  reps: string;
  rest: string;
  tips: string[];
};

export type WorkoutPDFData = {
  studentName: string;
  dayLabel: string; // "DIA 1"
  exercises: WorkoutPDFExercise[];
  tip?: string;
};

export function WorkoutPDF({ data }: { data: WorkoutPDFData }) {
  return (
    <Document>
      <Page size="A4" style={wStyles.page}>
        <View style={wStyles.header}>
          <View style={wStyles.logoBlock}>
            <View>
              <Text style={wStyles.logoText}>
                Vrum<Text style={wStyles.logoOrange}>Fit</Text>
              </Text>
              <Text style={wStyles.logoSub}>PERSONAL</Text>
            </View>
          </View>
        </View>

        <Text style={wStyles.title}>
          SUGESTÃO DE TREINO <Text style={wStyles.titleAccent}>– {data.dayLabel}</Text>
        </Text>
        <View style={wStyles.divider} />

        {data.exercises.map((ex, i) => (
          <View key={i} style={wStyles.exercise} wrap={false}>
            <Text style={wStyles.exNumber}>{i + 1}</Text>
            {ex.imageStart ? (
              <Image src={ex.imageStart} style={wStyles.exImage} />
            ) : (
              <View style={[wStyles.exImage, { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border }]} />
            )}
            <View style={wStyles.exBody}>
              <Text style={wStyles.exName}>{ex.name}</Text>
              <View style={wStyles.exStat}>
                <Text style={wStyles.exStatIcon}>::</Text>
                <Text style={wStyles.exStatText}>{ex.sets} séries de {ex.reps} repetições</Text>
              </View>
              <View style={wStyles.exStat}>
                <Text style={wStyles.exStatIcon}>O</Text>
                <Text style={wStyles.exStatText}>Descanso: {ex.rest}</Text>
              </View>
              <View style={wStyles.exTipsDivider} />
              {ex.tips.map((t, ti) => (
                <View key={ti} style={wStyles.exTip}>
                  <Text style={wStyles.exTipArrow}>›</Text>
                  <Text style={wStyles.exTipText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={wStyles.footer}>
          <View style={wStyles.footerBox}>
            <Text style={wStyles.footerIcon}>i</Text>
            <View style={{ flex: 1 }}>
              <Text style={wStyles.footerTitle}>DICA</Text>
              <Text style={wStyles.footerText}>
                {data.tip ?? "Mantenha alimentação equilibrada, hidratação e 7 a 8 horas de sono para melhores resultados."}
              </Text>
            </View>
          </View>
          <View style={wStyles.footerBox}>
            <Text style={[wStyles.footerIcon, { backgroundColor: COLORS.primary }]}>!</Text>
            <View style={{ flex: 1 }}>
              <Text style={wStyles.footerTitle}>Bons treinos!</Text>
              <Text style={wStyles.footerText}>Foco · Disciplina · Consistência</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// =================================================================
// PDF DE DIETA — padrão "Sugestão de dieta — Dia X"
// =================================================================

const dStyles = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: "#1A1A1D", padding: 24, fontFamily: "Helvetica" },
  header: { marginBottom: 8 },
  logoText: { fontSize: 14, fontWeight: 700, color: "#1A1A1D" },
  logoOrange: { color: COLORS.primary, fontWeight: 700 },
  logoSub: { fontSize: 7, color: COLORS.primary, letterSpacing: 2, marginTop: 1, fontWeight: 700 },
  title: { fontSize: 22, fontWeight: 900, color: "#1A1A1D", marginTop: 6 },
  titleAccent: { color: COLORS.primary },
  underline: { height: 2, backgroundColor: COLORS.primary, width: 220, marginTop: 4, marginBottom: 18, borderRadius: 2 },
  meal: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E5E5E7", paddingBottom: 14, marginBottom: 14 },
  mealImg: { width: 110, height: 110, borderRadius: 8, marginRight: 14, backgroundColor: "#F1F1F3" },
  mealRight: { flex: 1 },
  mealHead: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  mealNum: { width: 22, height: 22, backgroundColor: "#1A1A1D", color: "#FFF", fontSize: 11, fontWeight: 700, textAlign: "center", paddingTop: 5, borderRadius: 4, marginRight: 8 },
  mealTitle: { fontSize: 14, fontWeight: 700, color: "#1A1A1D" },
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
  rowIcon: { color: COLORS.primary, fontSize: 10, fontWeight: 700, width: 14, marginRight: 4 },
  rowLabel: { fontSize: 10, color: "#1A1A1D", fontWeight: 700, marginRight: 4 },
  rowText: { fontSize: 10, color: "#3A3A3D", flex: 1, lineHeight: 1.35 },
  footer: { marginTop: 12, flexDirection: "row", gap: 10 },
  footBox: { flex: 1, backgroundColor: "#FAFAFB", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#E5E5E7" },
  footTitle: { fontSize: 11, fontWeight: 700, color: "#1A1A1D", marginBottom: 4 },
  footText: { fontSize: 9, color: "#4A4A4D", lineHeight: 1.4 },
  motto: { textAlign: "center", marginTop: 14, fontSize: 9, color: "#666" },
  mottoAccent: { color: COLORS.primary, fontWeight: 700 },
});

export type DietPDFMeal = {
  number: number;
  title: string;
  timeRange: string;
  imageUrl?: string;
  foods: string;
  amount: string;
  substitutions: string;
  observation: string;
};

export type DietPDFData = {
  studentName: string;
  dayLabel: string;
  meals: DietPDFMeal[];
  water?: string;
  goldenTip?: string;
};

export function DietPDF({ data }: { data: DietPDFData }) {
  return (
    <Document>
      <Page size="A4" style={dStyles.page}>
        <View style={dStyles.header}>
          <Text style={dStyles.logoText}>
            Vrum<Text style={dStyles.logoOrange}>Fit</Text>
          </Text>
          <Text style={dStyles.logoSub}>PERSONAL</Text>
        </View>

        <Text style={dStyles.title}>
          Sugestão de dieta <Text style={dStyles.titleAccent}>— {data.dayLabel}</Text>
        </Text>
        <View style={dStyles.underline} />

        {data.meals.map((m, i) => (
          <View key={i} style={dStyles.meal} wrap={false}>
            {m.imageUrl ? <Image src={m.imageUrl} style={dStyles.mealImg} /> : <View style={dStyles.mealImg} />}
            <View style={dStyles.mealRight}>
              <View style={dStyles.mealHead}>
                <Text style={dStyles.mealNum}>{m.number}</Text>
                <Text style={dStyles.mealTitle}>{m.title}</Text>
              </View>
              <View style={dStyles.row}>
                <Text style={dStyles.rowIcon}>O</Text>
                <Text style={[dStyles.rowText, { fontWeight: 700 }]}>{m.timeRange}</Text>
              </View>
              <View style={dStyles.row}>
                <Text style={dStyles.rowIcon}>Y</Text>
                <Text style={dStyles.rowLabel}>Alimentos:</Text>
                <Text style={dStyles.rowText}>{m.foods}</Text>
              </View>
              <View style={dStyles.row}>
                <Text style={dStyles.rowIcon}>B</Text>
                <Text style={dStyles.rowLabel}>Quantidade:</Text>
                <Text style={dStyles.rowText}>{m.amount}</Text>
              </View>
              <View style={dStyles.row}>
                <Text style={dStyles.rowIcon}>S</Text>
                <Text style={dStyles.rowLabel}>Substituições:</Text>
                <Text style={dStyles.rowText}>{m.substitutions}</Text>
              </View>
              <View style={dStyles.row}>
                <Text style={dStyles.rowIcon}>›</Text>
                <Text style={dStyles.rowLabel}>Observação:</Text>
                <Text style={dStyles.rowText}>{m.observation}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={dStyles.footer}>
          <View style={dStyles.footBox}>
            <Text style={dStyles.footTitle}>Hidratação</Text>
            <Text style={dStyles.footText}>Meta de água do dia: {data.water ?? "2 a 3 litros"}. Beba ao longo do dia.</Text>
          </View>
          <View style={dStyles.footBox}>
            <Text style={dStyles.footTitle}>Dica de ouro</Text>
            <Text style={dStyles.footText}>{data.goldenTip ?? "Prefira alimentos naturais, evite ultraprocessados e mantenha alimentação equilibrada."}</Text>
          </View>
        </View>

        <Text style={dStyles.motto}>
          Disciplina hoje, <Text style={dStyles.mottoAccent}>resultados amanhã.</Text>
        </Text>
      </Page>
    </Document>
  );
}
