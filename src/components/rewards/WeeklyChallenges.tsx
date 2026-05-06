import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  Zap, Target, Flame, Star, Trophy, Award, Coins, 
  CheckCircle, Clock, Loader2, Swords 
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap, target: Target, flame: Flame, star: Star,
  trophy: Trophy, award: Award, swords: Swords,
};

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_count: number;
  reward_points: number;
  icon: string;
  week_start: string;
  week_end: string;
}

interface ChallengeProgress {
  challenge_id: string;
  current_progress: number;
  is_completed: boolean;
  points_awarded: boolean;
}

export function WeeklyChallenges() {
  const { user, profile, refreshProfile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<Record<string, ChallengeProgress>>({});
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const fetchChallenges = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const { data: challengeData } = await supabase
      .from('weekly_challenges')
      .select('*')
      .eq('is_active', true)
      .lte('week_start', today)
      .gte('week_end', today);

    setChallenges(challengeData || []);

    if (user && challengeData?.length) {
      // Refresh progress server-side (secure) for each active challenge
      await Promise.all(
        challengeData.map(c => supabase.rpc('refresh_challenge_progress', { p_challenge_id: c.id }))
      );

      const { data: progressData } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('challenge_id', challengeData.map(c => c.id));

      const progressMap: Record<string, ChallengeProgress> = {};
      progressData?.forEach(p => {
        progressMap[p.challenge_id] = p;
      });

      setProgress(progressMap);
    }
    setLoading(false);
  };

  const calculateProgress = async (challenge: Challenge): Promise<number> => {
    if (!user) return 0;
    const weekStart = challenge.week_start;
    const weekEnd = challenge.week_end + 'T23:59:59';

    switch (challenge.challenge_type) {
      case 'answers': {
        const { count } = await supabase
          .from('answers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', weekStart)
          .lte('created_at', weekEnd);
        return count || 0;
      }
      case 'questions': {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', weekStart)
          .lte('created_at', weekEnd);
        return count || 0;
      }
      case 'courses': {
        const { count } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', weekStart)
          .lte('created_at', weekEnd);
        return count || 0;
      }
      case 'streak': {
        return profile?.current_streak || 0;
      }
      default:
        return 0;
    }
  };

  const claimReward = async (challenge: Challenge) => {
    if (!user) return;
    setClaiming(challenge.id);

    const { data, error } = await supabase.rpc('complete_challenge', {
      p_challenge_id: challenge.id,
    });

    if (error || !(data as any)?.success) {
      toast({
        title: "خطأ",
        description: (data as any)?.error || "حدث خطأ أثناء استلام المكافأة",
        variant: "destructive",
      });
    } else {
      toast({
        title: "🎉 تهانينا!",
        description: `حصلت على ${challenge.reward_points} نقطة إضافية!`,
      });
      await refreshProfile();
      await fetchChallenges();
    }
    setClaiming(null);
  };

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!challenges.length) return 0;
    const end = new Date(challenges[0].week_end + 'T23:59:59');
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border-border/50 mb-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!challenges.length) return null;

  const daysLeft = getDaysRemaining();
  const completedCount = Object.values(progress).filter(p => p.is_completed).length;

  return (
    <div className="glass rounded-2xl p-6 border-primary/20 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Swords className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">تحديات الأسبوع</h2>
            <p className="text-sm text-muted-foreground">
              أكمل التحديات واكسب نقاط إضافية
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {daysLeft > 0 ? `متبقي ${daysLeft} يوم` : 'ينتهي اليوم'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            {completedCount}/{challenges.length}
          </span>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {challenges.map((challenge, i) => {
            const Icon = iconMap[challenge.icon] || Target;
            const prog = progress[challenge.id];
            const currentProgress = prog?.current_progress || 0;
            const isCompleted = prog?.is_completed || false;
            const isAwarded = prog?.points_awarded || false;
            const progressPercent = Math.min((currentProgress / challenge.target_count) * 100, 100);

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-4 rounded-xl border transition-all ${
                  isAwarded
                    ? "bg-success/5 border-success/30"
                    : isCompleted
                    ? "bg-accent/5 border-accent/30"
                    : "bg-secondary/30 border-border/50"
                }`}
              >
                {/* Completed badge */}
                {isAwarded && (
                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-success flex items-center justify-center shadow-md">
                    <CheckCircle className="w-4 h-4 text-success-foreground" />
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isAwarded ? "bg-success/20" : isCompleted ? "bg-accent/20" : "bg-primary/10"
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isAwarded ? "text-success" : isCompleted ? "text-accent" : "text-primary"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm">{challenge.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <Progress value={progressPercent} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {currentProgress} / {challenge.target_count}
                    </span>
                    <div className="flex items-center gap-1 font-bold text-accent">
                      <Coins className="w-3 h-3" />
                      +{challenge.reward_points}
                    </div>
                  </div>
                </div>

                {/* Claim button */}
                {isCompleted && !isAwarded && (
                  <Button
                    size="sm"
                    variant="hero"
                    className="w-full mt-3"
                    onClick={() => claimReward(challenge)}
                    disabled={claiming === challenge.id}
                  >
                    {claiming === challenge.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        استلم المكافأة
                      </>
                    )}
                  </Button>
                )}

                {isAwarded && (
                  <div className="mt-3 text-center text-xs font-bold text-success">
                    ✓ تم استلام المكافأة
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
