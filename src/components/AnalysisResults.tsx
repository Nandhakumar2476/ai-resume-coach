import { ResumeAnalysis } from "@/types/analysis";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Tag,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Target,
} from "lucide-react";

interface Props {
  analysis: ResumeAnalysis;
}

const scoreColor = (s: number) => {
  if (s >= 80) return "text-success";
  if (s >= 60) return "text-warning";
  return "text-destructive";
};

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="glass p-6">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary-foreground" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
    </div>
    {children}
  </Card>
);

const Bullets = ({ items, tone = "default" }: { items: string[]; tone?: "default" | "good" | "bad" }) => (
  <ul className="space-y-2">
    {items.map((it, i) => (
      <li key={i} className="flex gap-2 text-sm leading-relaxed">
        <span
          className={
            tone === "good"
              ? "text-success mt-1"
              : tone === "bad"
              ? "text-destructive mt-1"
              : "text-accent mt-1"
          }
        >
          ●
        </span>
        <span className="text-foreground/90">{it}</span>
      </li>
    ))}
  </ul>
);

const AnalysisResults = ({ analysis }: Props) => {
  return (
    <div className="space-y-6">
      {/* ATS Score */}
      <Card className="glass p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
        <div className="relative grid md:grid-cols-[auto_1fr] gap-6 items-center">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(analysis.ats_score / 100) * 326.7} 326.7`}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(263 85% 65%)" />
                    <stop offset="100%" stopColor="hsl(190 95% 60%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${scoreColor(analysis.ats_score)}`}>
                  {analysis.ats_score}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium">ATS Score</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted-foreground">Detected role</span>
              <Badge variant="secondary" className="bg-secondary">{analysis.detected_role}</Badge>
            </div>
            <h2 className="text-2xl font-bold mb-2">Score breakdown</h2>
            <p className="text-muted-foreground leading-relaxed">{analysis.score_explanation}</p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Section icon={CheckCircle2} title="Strengths">
          <Bullets items={analysis.strengths} tone="good" />
        </Section>
        <Section icon={AlertTriangle} title="Weaknesses & Gaps">
          <Bullets items={analysis.weaknesses} tone="bad" />
        </Section>
      </div>

      <Section icon={Lightbulb} title="Suggested Improvements">
        <Bullets items={analysis.improvements} />
      </Section>

      <div className="grid md:grid-cols-2 gap-6">
        <Section icon={Tag} title="Missing Keywords">
          <div className="flex flex-wrap gap-2">
            {analysis.missing_keywords.map((k, i) => (
              <Badge
                key={i}
                variant="outline"
                className="border-destructive/40 text-destructive bg-destructive/10"
              >
                {k}
              </Badge>
            ))}
          </div>
        </Section>
        <Section icon={Tag} title="Keywords to Add">
          <div className="flex flex-wrap gap-2">
            {analysis.keywords_to_add.map((k, i) => (
              <Badge
                key={i}
                className="bg-gradient-primary text-primary-foreground border-0"
              >
                {k}
              </Badge>
            ))}
          </div>
        </Section>
      </div>

      <Section icon={Briefcase} title="Recommended Roles">
        <div className="grid sm:grid-cols-2 gap-4">
          {analysis.recommended_roles.map((r, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-secondary/40">
              <h4 className="font-semibold mb-1">{r.role}</h4>
              <p className="text-sm text-muted-foreground mb-3">{r.fit_reason}</p>
              <div className="flex flex-wrap gap-1.5">
                {r.keywords.map((k, j) => (
                  <Badge
                    key={j}
                    variant="outline"
                    className="text-xs border-accent/40 text-accent bg-accent/10"
                  >
                    {k}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={GraduationCap} title="Skill Improvements">
        <Bullets items={analysis.skill_improvements} />
      </Section>

      <Section icon={MessageSquare} title="Likely Interview Questions">
        <div className="space-y-4">
          {analysis.interview_questions.map((q, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-secondary/40">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium mb-1">{q.question}</p>
                  <Badge variant="outline" className="mb-2 text-xs">
                    {q.focus_area}
                  </Badge>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <span className="text-accent font-medium">Tip:</span> {q.tip}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default AnalysisResults;
