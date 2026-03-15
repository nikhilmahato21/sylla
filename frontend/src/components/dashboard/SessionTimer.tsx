import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Timer } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { emitSessionChanged, onSessionChanged } from "@/lib/sessionEvents";

interface ActiveSession {
  id: string;
  topicId: string;
  topicName: string;
  startedAt: Date;
}

export function SessionTimer() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const loadPersistedSession = useCallback(() => {
    const raw = sessionStorage.getItem("sylla_active_session");
    if (!raw) {
      setSession(null);
      setElapsed(0);
      setExpanded(false);
      return;
    }

    try {
      const nextSession = JSON.parse(raw);
      nextSession.startedAt = new Date(nextSession.startedAt);
      setSession(nextSession);
      setElapsed(Math.floor((Date.now() - nextSession.startedAt.getTime()) / 1000));
    } catch {
      sessionStorage.removeItem("sylla_active_session");
      setSession(null);
      setElapsed(0);
      setExpanded(false);
    }
  }, []);

  useEffect(() => {
    loadPersistedSession();
    return onSessionChanged(loadPersistedSession);
  }, [loadPersistedSession]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - session.startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const stopSession = useCallback(async () => {
    if (!session) return;
    try {
      await api.patch(`/sessions/${session.id}/end`, {});
      sessionStorage.removeItem("sylla_active_session");
      setSession(null);
      setElapsed(0);
      setExpanded(false);
      emitSessionChanged("ended");
      toast({ title: `Session ended — ${formatTime(elapsed)} studied` });
    } catch {
      toast({ title: "Failed to end session", variant: "destructive" });
    }
  }, [session, elapsed, toast]);

  if (!session) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
      >
        <div
          className={cn(
            "flex items-center gap-3 bg-card border border-primary/30 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.15)] cursor-pointer transition-all",
            expanded ? "px-5 py-3" : "px-4 py-2.5"
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {/* Pulsing dot */}
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
          </div>

          {expanded && (
            <div className="text-xs text-muted-foreground max-w-[160px] truncate">
              {session.topicName}
            </div>
          )}

          <div className="font-mono text-sm font-semibold text-primary">
            {formatTime(elapsed)}
          </div>

          {expanded && (
            <button
              onClick={(e) => { e.stopPropagation(); stopSession(); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary rounded-lg px-2.5 py-1.5 transition-colors border border-border"
            >
              <Square size={10} className="text-destructive" />
              End
            </button>
          )}

          {!expanded && (
            <Timer size={13} className="text-muted-foreground" />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Exported helper to start a session from anywhere
export async function startStudySession(topicId: string, topicName: string) {
  const { data } = await api.post("/sessions/start", { topicId });
  const session = { id: data.id, topicId, topicName, startedAt: new Date(data.startedAt) };
  sessionStorage.setItem("sylla_active_session", JSON.stringify(session));
  emitSessionChanged("started");
  return session;
}
