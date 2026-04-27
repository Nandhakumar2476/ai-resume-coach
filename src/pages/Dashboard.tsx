import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Upload,
  FileText,
  LogOut,
  Loader2,
  Clock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { parseResumeFile } from "@/lib/resumeParser";
import { ResumeAnalysis } from "@/types/analysis";
import AnalysisResults from "@/components/AnalysisResults";

interface AnalysisRow {
  id: string;
  file_name: string | null;
  target_role: string | null;
  ats_score: number | null;
  result: ResumeAnalysis;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [history, setHistory] = useState<AnalysisRow[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from("analyses")
      .select("id, file_name, target_role, ats_score, result, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) {
      setHistory(data as unknown as AnalysisRow[]);
    }
  };

  const handleFile = async (file: File) => {
    try {
      toast.info(`Reading ${file.name}…`);
      const text = await parseResumeFile(file);
      if (text.length < 50) {
        toast.error("Couldn't extract enough text from this file.");
        return;
      }
      setResumeText(text);
      setFileName(file.name);
      toast.success("Resume loaded. Click Analyze to continue.");
    } catch (e: any) {
      toast.error(e.message || "Failed to parse file.");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const analyze = async () => {
    if (resumeText.trim().length < 50) {
      toast.error("Please provide a resume (upload or paste).");
      return;
    }
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-resume", {
        body: { resumeText, targetRole: targetRole || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const result = data.analysis as ResumeAnalysis;
      setAnalysis(result);

      // Save to history
      await supabase.from("analyses").insert({
        user_id: user!.id,
        file_name: fileName || null,
        target_role: targetRole || null,
        resume_text: resumeText.slice(0, 20000),
        ats_score: result.ats_score,
        result: result as any,
      });
      loadHistory();
      toast.success("Analysis complete!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const viewHistory = (h: AnalysisRow) => {
    setAnalysis(h.result);
    setFileName(h.file_name || "");
    setTargetRole(h.target_role || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteHistory = async (id: string) => {
    await supabase.from("analyses").delete().eq("id", id);
    setHistory((h) => h.filter((x) => x.id !== id));
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/60 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">ResumeIQ</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6 min-w-0">
          {/* Upload card */}
          <Card className="glass p-6">
            <h1 className="text-2xl font-bold mb-1">Analyze your resume</h1>
            <p className="text-muted-foreground mb-6">
              Upload a PDF/DOCX or paste your resume text. Add a target role for tailored insights.
            </p>

            <Tabs defaultValue="upload">
              <TabsList className="mb-4 bg-secondary">
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="paste">Paste Text</TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-smooth"
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium mb-1">
                    {fileName ? fileName : "Click or drop your resume here"}
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,application/pdf"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>
              </TabsContent>

              <TabsContent value="paste">
                <Textarea
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setFileName("");
                  }}
                  placeholder="Paste your resume text here…"
                  className="min-h-[260px] bg-secondary/40 border-border resize-y"
                />
              </TabsContent>
            </Tabs>

            <div className="mt-6 grid sm:grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <Label htmlFor="role">Target role (optional)</Label>
                <Input
                  id="role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>
              <Button
                onClick={analyze}
                disabled={analyzing || resumeText.trim().length < 50}
                size="lg"
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold shadow-glow"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Resume
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Results */}
          {analyzing && (
            <Card className="glass p-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Running AI analysis… this usually takes 10–20 seconds.
              </p>
            </Card>
          )}
          {analysis && !analyzing && <AnalysisResults analysis={analysis} />}
        </div>

        {/* History sidebar */}
        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-1">
            <Clock className="w-4 h-4" />
            Recent analyses
          </div>
          {history.length === 0 ? (
            <Card className="glass p-4 text-sm text-muted-foreground text-center">
              No analyses yet.
            </Card>
          ) : (
            history.map((h) => (
              <Card
                key={h.id}
                className="glass p-3 hover:shadow-ring transition-smooth cursor-pointer group"
                onClick={() => viewHistory(h)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {h.file_name || "Pasted resume"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{h.ats_score}/100</span>
                      <span>·</span>
                      <span className="truncate">{h.target_role || "Auto-detected"}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteHistory(h.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-smooth text-muted-foreground hover:text-destructive p-1"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </aside>
      </main>
    </div>
  );
};

export default Dashboard;
