import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2, ArrowRight, Award, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/seo/SEOHead";
import { CertificateDialog } from "@/components/courses/CertificateDialog";

interface Course {
  id: string; title: string; description: string; instructor: string;
  lessons_count: number; user_id: string;
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  const focusLesson = Number(params.get("lesson")) || null;

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: c } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
      if (c) setCourse(c as Course);
      if (user) {
        const { data: e } = await supabase
          .from("course_enrollments")
          .select("completed_lessons, progress")
          .eq("user_id", user.id).eq("course_id", id).maybeSingle();
        if (e) {
          setEnrolled(true);
          setCompleted(e.completed_lessons || []);
        }
      }
      setLoading(false);
    })();
  }, [id, user]);

  useEffect(() => {
    if (focusLesson) {
      setTimeout(() => {
        document.getElementById(`lesson-${focusLesson}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
    }
  }, [focusLesson, loading]);

  const total = course?.lessons_count || 0;
  const progress = useMemo(
    () => (total > 0 ? Math.min(100, Math.floor((completed.length / total) * 100)) : 0),
    [completed, total],
  );
  const firstIncomplete = useMemo(() => {
    for (let i = 1; i <= total; i++) if (!completed.includes(i)) return i;
    return null;
  }, [completed, total]);

  const toggleLesson = async (n: number) => {
    if (!user || !course) {
      toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" });
      return;
    }
    if (!enrolled) {
      toast({ title: "سجّل في الدورة أولاً", description: "ارجع لصفحة الدورات وانضمّ للدورة", variant: "destructive" });
      return;
    }
    setSaving(n);
    const next = completed.includes(n) ? completed.filter(x => x !== n) : [...completed, n].sort((a, b) => a - b);
    const newProgress = total > 0 ? Math.min(100, Math.floor((next.length / total) * 100)) : 0;
    const wasComplete = progress >= 100;
    const { error } = await supabase
      .from("course_enrollments")
      .update({ completed_lessons: next, progress: newProgress })
      .eq("user_id", user.id).eq("course_id", course.id);
    setSaving(null);
    if (error) { toast({ title: "تعذّر حفظ التقدّم", variant: "destructive" }); return; }
    setCompleted(next);
    if (newProgress >= 100 && !wasComplete) {
      toast({ title: "مبروك! أنهيت الدورة 🎓", description: "يمكنك تنزيل شهادة الإتمام الآن" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!course) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <main className="pt-24 container mx-auto px-4 text-center">
          <p className="text-muted-foreground">الدورة غير موجودة.</p>
          <Link to="/courses"><Button variant="outline" className="mt-4">العودة للدورات</Button></Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <SEOHead title={`${course.title} — wekicode`} description={course.description} path={`/courses/${course.id}`} />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowRight className="w-4 h-4" /> كل الدورات
          </Link>

          <div className="glass rounded-2xl p-6 mb-6 border border-border/50">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-muted-foreground mb-4">{course.description}</p>
            <p className="text-sm text-muted-foreground mb-4">المدرّب: <span className="text-foreground font-medium">{course.instructor}</span></p>

            {enrolled ? (
              <>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">التقدّم ({completed.length}/{total})</span>
                  <span className="text-primary font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex flex-wrap gap-2 mt-4">
                  {firstIncomplete && (
                    <Button variant="hero" onClick={() => {
                      setParams({ lesson: String(firstIncomplete) });
                      document.getElementById(`lesson-${firstIncomplete}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}>
                      <PlayCircle className="w-4 h-4" /> تابع من حيث توقفت (الدرس {firstIncomplete})
                    </Button>
                  )}
                  {progress >= 100 && (
                    <CertificateDialog
                      courseId={course.id}
                      courseTitle={course.title}
                      instructor={course.instructor}
                      studentName={profile?.full_name || user?.email?.split("@")[0] || "متعلّم"}
                      trigger={<Button variant="outline"><Award className="w-4 h-4" /> شهادة الإتمام</Button>}
                    />
                  )}
                </div>
              </>
            ) : (
              <Button variant="hero" onClick={() => navigate("/courses")}>سجّل في الدورة للبدء</Button>
            )}
          </div>

          <div className="space-y-2">
            {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
              const done = completed.includes(n);
              const isFocus = focusLesson === n;
              return (
                <div
                  key={n}
                  id={`lesson-${n}`}
                  className={`glass rounded-xl p-4 border flex items-center justify-between gap-3 transition-all ${
                    isFocus ? "border-primary shadow-glow" : "border-border/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold shrink-0">{n}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">الدرس {n}</p>
                      <p className="text-xs text-muted-foreground">{done ? "مكتمل" : "لم يكتمل بعد"}</p>
                    </div>
                  </div>
                  <Button
                    variant={done ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleLesson(n)}
                    disabled={saving === n || !enrolled}
                  >
                    {saving === n ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : done ? (
                      <><CheckCircle2 className="w-4 h-4 text-success" /> تم</>
                    ) : (
                      <><Circle className="w-4 h-4" /> أنهيت الدرس</>
                    )}
                  </Button>
                </div>
              );
            })}
            {total === 0 && <p className="text-center text-muted-foreground py-8">لا توجد دروس بعد لهذه الدورة.</p>}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}