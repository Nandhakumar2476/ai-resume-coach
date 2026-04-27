import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, Target, Brain, MessageSquare, TrendingUp, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  { icon: Target, title: "ATS Score", desc: "See exactly how Applicant Tracking Systems rank your resume." },
  { icon: Brain, title: "Smart Keywords", desc: "AI-suggested keywords tailored to your target role." },
  { icon: TrendingUp, title: "Career Roadmap", desc: "Get role recommendations and skill-building guidance." },
  { icon: MessageSquare, title: "Interview Coach", desc: "Practice with questions generated from your resume." },
];

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">ResumeIQ</span>
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard">
              <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold">
                Open Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-smooth">
                Sign in
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 pt-12 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs text-muted-foreground">AI-powered resume analysis</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              Land your next role with{" "}
              <span className="gradient-text">AI-powered insight</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Upload your resume and get an instant ATS score, keyword recommendations,
              tailored job matches, and interview prep — all in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={user ? "/dashboard" : "/auth"}>
                <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold shadow-glow">
                  <Upload className="w-4 h-4 mr-2" />
                  Analyze My Resume
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
            <img
              src={heroImg}
              alt="AI resume analysis illustration"
              width={1536}
              height={1024}
              className="relative rounded-2xl border border-border shadow-glow animate-float"
            />
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">Everything you need to stand out</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From ATS optimization to interview practice, ResumeIQ covers your entire job search.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass rounded-xl p-6 transition-smooth hover:shadow-ring">
                <div className="w-11 h-11 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 shadow-glow">
                  <f.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-10 text-center text-sm text-muted-foreground border-t border-border mt-10">
        © {new Date().getFullYear()} ResumeIQ — built with AI.
      </footer>
    </div>
  );
};

export default Landing;
