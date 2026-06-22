// Carrega @react-pdf/renderer e os templates apenas sob demanda.
// Mantém o bundle inicial leve (~500KB economizados).

import type { WorkoutPDFData, DietPDFData } from "@/components/pdfs/VrumPDFs";

export async function generateWorkoutPDFBlob(data: WorkoutPDFData): Promise<Blob> {
  const [{ pdf }, { WorkoutPDF }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdfs/VrumPDFs"),
    import("react"),
  ]);
  return pdf(React.createElement(WorkoutPDF, { data })).toBlob();
}

export async function generateDietPDFBlob(data: DietPDFData): Promise<Blob> {
  const [{ pdf }, { DietPDF }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdfs/VrumPDFs"),
    import("react"),
  ]);
  return pdf(React.createElement(DietPDF, { data })).toBlob();
}
