import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Push in-app + browser Notification:
 * - aluno escuta inserts em notices (do seu personal) e appointments
 * - personal escuta novas anamneses dos alunos e cancelamentos
 * Mostra toast + Notification se permissão concedida.
 */
export function useRealtimePush() {
  const { user, role } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        // Pede sem bloquear (usuário pode ignorar)
        setTimeout(() => Notification.requestPermission().catch(() => {}), 1500);
      }
    }

    const notify = (title: string, body?: string) => {
      toast(title, { description: body });
      try {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body, icon: "/favicon.ico" });
        }
      } catch {}
    };

    const channel = supabase
      .channel(`push-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notices" }, (payload: any) => {
        const n = payload.new;
        if (role === "aluno") {
          notify(`Novo aviso: ${n.title}`, n.message?.slice(0, 120));
          qc.invalidateQueries({ queryKey: ["notices"] });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "appointments" }, (payload: any) => {
        const a = payload.new;
        if (role === "aluno" && a.student_id === user.id) {
          const d = new Date(a.starts_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
          notify("Novo horário agendado", `${a.title} · ${d}`);
          qc.invalidateQueries({ queryKey: ["appointments"] });
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "appointments" }, (payload: any) => {
        const a = payload.new;
        if (role === "aluno" && a.student_id === user.id && a.status === "cancelado") {
          notify("Horário cancelado", a.title);
          qc.invalidateQueries({ queryKey: ["appointments"] });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, role, qc]);
}
