import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Check, HelpCircle, UserCheck, Hash, Compass, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useOnboarding } from "@/hooks/useOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { PRIMARY_GOALS, EXPERIENCE_LEVELS, TRACKS } from "@/lib/growth/preferences";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const STEPS = ["مرحبًا", "هدفك", "مستواك", "مساراتك", "ملفك", "جاهز"];

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-xl border text-xs transition-all text-right",
        active ? "border-primary bg-primary/10 text-primary font-bold" : "border-border/50 bg-card/40 hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

export function OnboardingFlow() {
  const navigate = useNavigate();
  const { prefs, complete, skip } = useOnboarding();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [goal, setGoal] = useState<string | null>(prefs?.primary_goal ?? null);
  const [level, setLevel] = useState<string | null>(prefs?.experience_level ?? null);
  const [tracks, setTracks] = useState<string[]>(prefs?.preferred_tracks ?? []);
  const [username, setUsername] = useState(prefs?.username ?? "");
  const [fullName, setFullName] = useState(prefs?.full_name ?? "");
  const [bio, setBio] = useState(prefs?.bio ?? "");
  const [skills, setSkills] = useState((prefs?.skills ?? []).join("، "));
  const [portfolio, setPortfolio] = useState(prefs?.portfolio_url ?? "");
  const [github, setGithub] = useState(prefs?.github_url ?? "");
  const [linkedin, setLinkedin] = useState(prefs?.linkedin_url ?? "");

  const toggleTrack = (t: string) => {
    setTracks((prev) => {
      const next = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
      if (!prev.includes(t)) trackEvent("onboarding_track_selected", { track: t });
      return next;
    });
  };

  const finish = async () => {
    setSaving(true); setError(null);
    try {
      await complete({
        primary_goal: goal,
        experience_level: level,
        preferred_tracks: tracks,
        username: username.trim() || null,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        skills: skills.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
        portfolio_url: portfolio.trim() || null,
        github_url: github.trim() || null,
        linkedin_url: linkedin.trim() || null,
      });
      // Attribute an invite code captured at sign-up, if any.
      const code = localStorage.getItem("wk_invite");
      if (code) {
        await supabase.rpc("redeem_invite_code", { _code: code });
        localStorage.removeItem("wk_invite");
      }
      setStep(5);
    } catch {
      setError("تعذر حفظ اختياراتك. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  const doSkip = async () => {
    try { await skip(); } catch { /* non-blocking */ }
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <Card className="glass border-border/50 p-5 md:p-7">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-muted-foreground">الخطوة {Math.min(step + 1, 6)} من 6</span>
          {step < 5 && (
            <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground" onClick={doSkip}>
              تخطي
            </Button>
          )}
        </div>
        <Progress value={((step + 1) / 6) * 100} className="h-1 mb-5" />

        {step === 0 && (
          <div className="space-y-3">
            <h1 className="text-xl md:text-2xl font-black text-foreground">خلينا نجهز تجربتك في WekiCode</h1>
            <p className="text-sm text-muted-foreground">
              اختر اهتماماتك عشان نرتب لك المنتديات، المسارات، والمحتوى المناسب.
            </p>
            <Button variant="hero" onClick={() => { trackEvent("onboarding_started"); setStep(1); }}>
              لنبدأ <ArrowLeft className="w-4 h-4 mr-1" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">ما هدفك الأساسي؟</h2>
            <div className="grid grid-cols-2 gap-2">
              {PRIMARY_GOALS.map((g) => (
                <Chip key={g.value} active={goal === g.value} onClick={() => setGoal(g.value)}>{g.label}</Chip>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">ما مستواك الحالي؟</h2>
            <div className="grid grid-cols-2 gap-2">
              {EXPERIENCE_LEVELS.map((l) => (
                <Chip key={l.value} active={level === l.value} onClick={() => setLevel(l.value)}>{l.label}</Chip>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">اختر مساراتك</h2>
            <p className="text-[11px] text-muted-foreground">يمكنك اختيار أكثر من مسار.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TRACKS.map((t) => (
                <Chip key={t} active={tracks.includes(t)} onClick={() => toggleTrack(t)}>{t}</Chip>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">أساسيات ملفك الشخصي</h2>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="اسم المستخدم (اختياري)" />
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الظاهر" />
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="نبذة قصيرة عنك" rows={3} />
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="مهاراتك مفصولة بفاصلة: React، Supabase" />
            <Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="رابط أعمالك (اختياري)" dir="ltr" />
            <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="GitHub (اختياري)" dir="ltr" />
            <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="LinkedIn (اختياري)" dir="ltr" />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold">جاهز — أهلًا بك في المجتمع</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { icon: HelpCircle, label: "اطرح أول سؤال", href: "/forums/new?type=question" },
                { icon: UserCheck, label: "عرّف عن نفسك", href: "/profile" },
                { icon: Hash, label: "تابع أول وسم", href: "/forums" },
                { icon: BookOpen, label: "تصفح مسارك المقترح", href: "/" },
              ].map((a) => (
                <Link key={a.label} to={a.href}
                  className="flex items-center gap-2 p-3 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-card/60 transition-all text-xs">
                  <a.icon className="w-4 h-4 text-primary" /> {a.label}
                </Link>
              ))}
            </div>
            <Button variant="hero" className="w-full" onClick={() => navigate("/")}>
              <Compass className="w-4 h-4 ml-1" /> ابدأ التصفح
            </Button>
          </div>
        )}

        {step > 0 && step < 5 && (
          <div className="flex items-center justify-between mt-6">
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>رجوع</Button>
            {step < 4 ? (
              <Button size="sm" variant="hero" onClick={() => setStep((s) => s + 1)}>التالي</Button>
            ) : (
              <Button size="sm" variant="hero" onClick={finish} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin ml-1" />} إنهاء
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}