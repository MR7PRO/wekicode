import { useState, useEffect } from "react";
import { Calendar, Gift, Check, Coins, Loader2, Flame, Trophy, Zap, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { streakBadges, getNewlyEarnedBadge, BadgeUnlockModal, Badge } from "@/components/badges/BadgeSystem";

interface DailyCheckin {
  id: string;
  checkin_date: string;
  points_earned: number;
}

interface StreakInfo {
  current_streak: number;
  longest_streak: number;
}

const STREAK_MILESTONES = [
  { days: 7, bonus: 25, label: "أسبوع" },
  { days: 14, bonus: 50, label: "أسبوعين" },
  { days: 30, bonus: 100, label: "شهر" },
  { days: 60, bonus: 200, label: "شهرين" },
  { days: 90, bonus: 300, label: "3 أشهر" },
  { days: 100, bonus: 500, label: "100 يوم" },
];

export function DailyCheckinCalendar() {
  const { user, refreshProfile, profile } = useAuth();
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({ current_streak: 0, longest_streak: 0 });
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth, year, month };
  };

  const { daysInMonth, firstDayOfMonth, year, month } = getDaysInMonth(currentMonth);

  // Check if a specific day has been checked in
  const isCheckedIn = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return checkins.some(c => c.checkin_date === dateStr);
  };

  // Check if today can be checked in
  const today = new Date();
  const isToday = (day: number) => {
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
  };

  const todayCheckedIn = isCheckedIn(today.getDate()) && 
    today.getFullYear() === year && 
    today.getMonth() === month;

  useEffect(() => {
    if (user) {
      fetchCheckins();
      fetchStreakInfo();
    } else {
      setLoading(false);
    }
  }, [user, currentMonth]);

  const fetchStreakInfo = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!error && data) {
      setStreakInfo({
        current_streak: data.current_streak || 0,
        longest_streak: data.longest_streak || 0
      });
    }
  };

  const fetchCheckins = async () => {
    if (!user) return;
    
    setLoading(true);
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`;

    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('checkin_date', startDate)
      .lte('checkin_date', endDate);

    if (error) {
      console.error('Error fetching checkins:', error);
    } else {
      setCheckins(data || []);
    }
    setLoading(false);
  };

  const handleCheckin = async () => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول للحصول على نقاط الحضور اليومي",
        variant: "destructive"
      });
      return;
    }

    setCheckingIn(true);

    const { error } = await supabase
      .from('daily_checkins')
      .insert({
        user_id: user.id,
        checkin_date: new Date().toISOString().split('T')[0],
        points_earned: 5
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "تم تسجيل الحضور مسبقاً",
          description: "لقد سجلت حضورك اليوم بالفعل!",
          variant: "destructive"
        });
      } else {
        console.error('Error checking in:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تسجيل الحضور",
          variant: "destructive"
        });
      }
    } else {
      await fetchCheckins();
      await fetchStreakInfo();
      await refreshProfile();
      
      // Check for streak milestone
      const newStreak = streakInfo.current_streak + 1;
      const milestone = STREAK_MILESTONES.find(m => m.days === newStreak);
      
      // Check for new badge earned
      const existingBadges = profile?.badges || [];
      const newBadge = getNewlyEarnedBadge(newStreak, existingBadges);
      
      if (newBadge) {
        // Award the badge
        const updatedBadges = [...existingBadges, newBadge.id];
        await supabase.rpc('update_profile_info', {
          p_full_name: null,
          p_bio: null,
          p_skills: null,
          p_avatar_url: null
        });
        
        // Update badges separately using direct update (we need a new function or direct update)
        // For now, show the badge modal
        setUnlockedBadge(newBadge);
        setShowBadgeModal(true);
        await refreshProfile();
      } else if (milestone) {
        toast({
          title: `🔥 إنجاز ${milestone.label}!`,
          description: `حصلت على ${milestone.bonus} نقطة إضافية لسلسلة ${milestone.days} يوم!`,
        });
      } else {
        toast({
          title: "🎉 تم تسجيل الحضور!",
          description: "حصلت على 5 نقاط مجانية!",
        });
      }
    }

    setCheckingIn(false);
  };

  // Get next milestone
  const getNextMilestone = () => {
    return STREAK_MILESTONES.find(m => m.days > streakInfo.current_streak);
  };

  const nextMilestone = getNextMilestone();

  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const dayNames = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const totalPointsThisMonth = checkins.reduce((sum, c) => sum + c.points_earned, 0);

  return (
    <>
    <BadgeUnlockModal 
      badge={unlockedBadge} 
      isOpen={showBadgeModal} 
      onClose={() => setShowBadgeModal(false)} 
    />
    <div className="glass rounded-2xl p-6 border-primary/30 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          الحضور اليومي
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <Gift className="w-4 h-4 text-accent" />
          <span className="text-muted-foreground">+5 نقاط يومياً</span>
        </div>
      </div>

      {/* Streak Stats */}
      {user && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">السلسلة الحالية</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{streakInfo.current_streak} <span className="text-sm font-normal text-muted-foreground">يوم</span></div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl p-4 border border-yellow-500/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">أطول سلسلة</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{streakInfo.longest_streak} <span className="text-sm font-normal text-muted-foreground">يوم</span></div>
          </motion.div>
        </div>
      )}

      {/* Next Milestone */}
      {user && nextMilestone && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl p-4 mb-4 border border-primary/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">الهدف التالي: {nextMilestone.label}</div>
                <div className="text-sm text-muted-foreground">
                  متبقي <span className="text-primary font-bold">{nextMilestone.days - streakInfo.current_streak}</span> يوم
                </div>
              </div>
            </div>
            <div className="text-accent font-bold text-lg">+{nextMilestone.bonus}</div>
          </div>
          <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(streakInfo.current_streak / nextMilestone.days) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            />
          </div>
        </motion.div>
      )}

      {/* Welcome bonus info */}
      <div className="bg-gradient-to-r from-success/20 to-success/5 rounded-xl p-4 mb-4 border border-success/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-success" />
          </div>
          <div>
            <div className="font-medium text-foreground">هدية الترحيب</div>
            <div className="text-sm text-muted-foreground">كل مستخدم جديد يحصل على <span className="text-success font-bold">10 نقاط</span> مجاناً!</div>
          </div>
        </div>
      </div>

      {/* Streak Milestones Info */}
      <div className="bg-secondary/30 rounded-xl p-4 mb-4 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-medium text-foreground">مكافآت السلاسل</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {STREAK_MILESTONES.slice(0, 6).map((milestone) => (
            <div 
              key={milestone.days}
              className={`text-center p-2 rounded-lg transition-all ${
                streakInfo.current_streak >= milestone.days 
                  ? "bg-success/20 border border-success/50" 
                  : "bg-secondary/50 border border-border/30"
              }`}
            >
              <div className={`text-xs font-medium ${streakInfo.current_streak >= milestone.days ? "text-success" : "text-muted-foreground"}`}>
                {milestone.label}
              </div>
              <div className={`text-sm font-bold ${streakInfo.current_streak >= milestone.days ? "text-success" : "text-foreground"}`}>
                +{milestone.bonus}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          ←
        </button>
        <span className="font-medium text-foreground">
          {monthNames[month]} {year}
        </span>
        <button 
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          →
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const checked = isCheckedIn(day);
              const isTodayCell = isToday(day);
              const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

              return (
                <motion.div
                  key={day}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium relative transition-all ${
                    checked
                      ? "bg-gradient-to-br from-success to-success/80 text-success-foreground shadow-lg"
                      : isTodayCell
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : isPast
                      ? "bg-secondary/30 text-muted-foreground"
                      : "bg-secondary/50 text-foreground"
                  }`}
                >
                  {checked ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    day
                  )}
                  {isTodayCell && !checked && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 mb-4">
            <div className="text-sm text-muted-foreground">
              أيام الحضور هذا الشهر: <span className="text-foreground font-bold">{checkins.length}</span>
            </div>
            <div className="flex items-center gap-1 text-accent font-bold">
              <Coins className="w-4 h-4" />
              <span>+{totalPointsThisMonth}</span>
            </div>
          </div>

          {/* Check-in button */}
          {user ? (
            <Button
              onClick={handleCheckin}
              disabled={todayCheckedIn || checkingIn}
              className="w-full"
              variant={todayCheckedIn ? "secondary" : "hero"}
            >
              {checkingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التسجيل...
                </>
              ) : todayCheckedIn ? (
                <>
                  <Check className="w-4 h-4" />
                  تم تسجيل حضور اليوم ✓
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  سجّل حضورك واحصل على 5 نقاط!
                </>
              )}
            </Button>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-2">
              سجّل دخولك للحصول على نقاط الحضور اليومي
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
