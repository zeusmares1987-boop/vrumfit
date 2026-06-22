// Carrega @react-pdf/renderer e os templates apenas sob demanda.
// Mantém o bundle inicial leve (~500KB economizados).

import type { WorkoutPDFData, DietPDFData } from "@/components/pdfs/VrumPDFs";

export async function generateWorkoutPDFBlob(data: WorkoutPDFData): Promise<Blob> {
  const [{ pdf }, { WorkoutPDF }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdfs/VrumPDFs"),
  ]);
  return pdf(<WorkoutPDF data={data} />).toBlob();
}

export async function generateDietPDFBlob(data: DietPDFData): Promise<Blob> {
  const [{ pdf }, { DietPDF }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdfs/VrumPDFs"),
  ]);
  return pdf(<DietPDF data={data} />).toBlob();
}
