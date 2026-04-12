import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Trophy, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  points: number;
  sort_order: number;
}

interface QuizPlayerProps {
  quizId: string;
  quizTitle: string;
  onClose: () => void;
}

export function QuizPlayer({ quizId, quizTitle, onClose }: QuizPlayerProps) {
  const { user, refreshProfile } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    setLoading(true);
    const [questionsRes, attemptRes] = await Promise.all([
      supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("sort_order"),
      user
        ? supabase
            .from("quiz_attempts")
            .select("*")
            .eq("quiz_id", quizId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (questionsRes.data) {
      setQuestions(
        questionsRes.data.map((q: any) => ({
          ...q,
          options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
        }))
      );
    }

    if (attemptRes.data) {
      setAlreadyTaken(true);
      setPreviousScore(attemptRes.data.score);
    }

    setLoading(false);
  };

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);

    const correct = questions[currentIndex].correct_answer;
    if (index === correct) {
      setScore((s) => s + 1);
      setTotalPoints((p) => p + questions[currentIndex].points);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setFinished(true);
    if (!user || alreadyTaken) return;

    const finalScore = score;
    const finalPoints = totalPoints;

    const { error } = await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      quiz_id: quizId,
      score: finalScore,
      total_questions: questions.length,
      points_earned: finalPoints,
    });

    if (!error) {
      await refreshProfile();
      toast({
        title: `🎉 أحسنت! حصلت على ${finalPoints} نقطة`,
        description: `نتيجتك: ${finalScore}/${questions.length}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">لا توجد أسئلة في هذا الاختبار بعد</p>
          <Button variant="outline" className="mt-4" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            رجوع
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card className="text-center overflow-hidden">
          <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-8">
            <Trophy className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">اكتمل الاختبار!</h2>
            <p className="text-muted-foreground">{quizTitle}</p>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-secondary">
                <div className="text-3xl font-bold text-primary">{score}</div>
                <div className="text-sm text-muted-foreground">إجابة صحيحة</div>
              </div>
              <div className="p-4 rounded-xl bg-secondary">
                <div className="text-3xl font-bold text-foreground">{questions.length}</div>
                <div className="text-sm text-muted-foreground">إجمالي الأسئلة</div>
              </div>
              <div className="p-4 rounded-xl bg-secondary">
                <div className="text-3xl font-bold text-accent">
                  {alreadyTaken ? 0 : totalPoints}
                </div>
                <div className="text-sm text-muted-foreground">نقاط مكتسبة</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>النتيجة</span>
                <span>{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-3" />
            </div>

            {alreadyTaken && (
              <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                ℹ️ سبق أن أكملت هذا الاختبار (نتيجتك السابقة: {previousScore}/{questions.length}). لا يتم منح نقاط إضافية.
              </p>
            )}

            {percentage >= 80 && !alreadyTaken && (
              <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 p-3 rounded-lg">
                <Sparkles className="w-4 h-4" />
                ممتاز! أداء رائع
              </div>
            )}

            <Button variant="hero" className="w-full" onClick={onClose}>
              رجوع للدورة
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 ml-1" />
            رجوع
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <CardTitle className="text-lg mt-3">{quizTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-lg font-medium text-foreground mb-4">{q.question_text}</p>

            <div className="space-y-3">
              {q.options.map((option, idx) => {
                let variant = "outline" as const;
                let extraClass = "hover:border-primary/50 cursor-pointer";

                if (isAnswered) {
                  if (idx === q.correct_answer) {
                    extraClass = "border-green-500 bg-green-500/10 text-green-600";
                  } else if (idx === selectedAnswer && idx !== q.correct_answer) {
                    extraClass = "border-destructive bg-destructive/10 text-destructive";
                  } else {
                    extraClass = "opacity-50";
                  }
                } else if (idx === selectedAnswer) {
                  extraClass = "border-primary bg-primary/10";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={isAnswered}
                    className={`w-full text-right p-4 rounded-xl border transition-all ${extraClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold shrink-0">
                        {String.fromCharCode(1571 + idx)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isAnswered && idx === q.correct_answer && (
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      )}
                      {isAnswered && idx === selectedAnswer && idx !== q.correct_answer && (
                        <XCircle className="w-5 h-5 text-destructive shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {isAnswered && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="hero" className="w-full mt-4" onClick={handleNext}>
              {currentIndex < questions.length - 1 ? "السؤال التالي" : "عرض النتيجة"}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
