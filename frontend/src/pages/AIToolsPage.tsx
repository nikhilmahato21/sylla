import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, FileText, Check, AlertCircle, Bot } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

interface ParsedTopic {
  name: string;
  description?: string;
  estimatedMinutes: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
  order: number;
}

interface ParseResult {
  topics: ParsedTopic[];
  summary: string;
  pageCount: number;
}

export function AIToolsPage() {
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const { user } = useAuthStore();
  const { toast } = useToast();

  useState(() => {
    api.get("/subjects").then(({ data }) => setSubjects(data)).catch(() => {});
  });

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    if (!selectedSubject) {
      toast({ title: "Select a subject first", variant: "destructive" });
      return;
    }

    setLoading(true);
    setParseResult(null);
    setSaved(false);

    const formData = new FormData();
    formData.append("pdf", files[0]);
    formData.append("subjectId", selectedSubject);

    try {
      const { data } = await api.post("/ai/parse-syllabus", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setParseResult(data);
    } catch (err) {
      toast({ title: "Failed to parse syllabus", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedSubject]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  async function saveTopics() {
    if (!parseResult || !selectedSubject) return;
    setSaving(true);
    try {
      await api.post("/topics/bulk", {
        subjectId: selectedSubject,
        topics: parseResult.topics,
      });
      setSaved(true);
      toast({ title: `${parseResult.topics.length} topics imported!` });
    } catch (err) {
      toast({ title: "Failed to save topics", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function sendChat() {
    if (!chatMsg.trim() || chatLoading) return;
    const msg = chatMsg;
    setChatMsg("");
    setChatHistory((prev) => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);

    try {
      const { data } = await api.post("/ai/chat", { message: msg });
      setChatHistory((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch {
      setChatHistory((prev) => [...prev, { role: "ai", text: "Sorry, I couldn't respond right now." }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <PageHeader
        title="AI Tools"
        subtitle="Parse syllabi, get recommendations, chat with AI"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: PDF Upload */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={15} className="text-primary" />
              <h3 className="font-semibold">Upload Syllabus PDF</h3>
            </div>

            <div className="mb-4">
              <label className="block font-mono text-[11px] text-muted-foreground mb-1.5 tracking-wider">
                SELECT SUBJECT
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Choose a subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-border/80 hover:bg-secondary/50"
              )}
            >
              <input {...getInputProps()} />
              {loading ? (
                <div className="space-y-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Analyzing with AI...</p>
                </div>
              ) : (
                <>
                  <Upload size={24} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-foreground font-medium">Drop PDF here or click to upload</p>
                  <p className="font-mono text-xs text-muted-foreground mt-1">Max 10MB · PDF only</p>
                </>
              )}
            </div>
          </div>

          {/* Parse result */}
          <AnimatePresence>
            {parseResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">
                    {parseResult.topics.length} Topics Found
                  </h4>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {parseResult.pageCount} pages
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  {parseResult.summary}
                </p>

                <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                  {parseResult.topics.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                      <span className="font-mono text-[10px] text-muted-foreground w-5">{i + 1}.</span>
                      <span className="text-xs text-foreground flex-1">{t.name}</span>
                      <span className={cn(
                        "font-mono text-[9px] px-1.5 py-0.5 rounded",
                        t.priority === "HIGH" ? "bg-red-500/10 text-red-400" :
                        t.priority === "MEDIUM" ? "bg-orange-500/10 text-orange-400" :
                        "bg-secondary text-muted-foreground"
                      )}>{t.priority}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{t.estimatedMinutes}m</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={saveTopics}
                  disabled={saving || saved}
                  className={cn(
                    "w-full py-2.5 rounded-lg text-sm font-medium transition-colors",
                    saved
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  )}
                >
                  {saved ? (
                    <span className="flex items-center justify-center gap-2"><Check size={14} /> Imported!</span>
                  ) : saving ? "Saving..." : "Import All Topics"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: AI Chat */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col h-[500px]">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={15} className="text-primary" />
            <h3 className="font-semibold">AI Study Assistant</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles size={24} className="text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Ask me anything about your studies</p>
                <p className="font-mono text-xs text-muted-foreground/60 mt-1">
                  "What should I study today?" · "Explain eigenvalues"
                </p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-xl px-3 py-2.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Ask your AI study assistant..."
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatMsg.trim()}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
