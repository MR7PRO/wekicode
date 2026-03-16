import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Gift, 
  Coins, 
  Zap, 
  Wifi,
  CreditCard,
  Coffee,
  Monitor,
  Star,
  Clock,
  CheckCircle,
  ShoppingBag,
  Smartphone,
  Headphones,
  Ticket,
  PartyPopper,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DailyCheckinCalendar } from "@/components/rewards/DailyCheckin";
import { WeeklyChallenges } from "@/components/rewards/WeeklyChallenges";

const categories = ["الكل", "اشتراكات", "قسائم مالية", "خدمات", "هدايا", "أجهزة"];

// Icon mapping for rewards
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'zap': Zap,
  'credit-card': CreditCard,
  'coffee': Coffee,
  'monitor': Monitor,
  'wifi': Wifi,
  'star': Star,
  'headphones': Headphones,
  'smartphone': Smartphone,
  'ticket': Ticket,
};

// Color mapping for categories
const categoryColorMap: Record<string, string> = {
  'اشتراكات': 'primary',
  'قسائم مالية': 'success',
  'خدمات': 'accent',
  'هدايا': 'warning',
  'أجهزة': 'primary'
};

interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
  stock: number;
}

interface Redemption {
  id: string;
  reward_id: string;
  points_spent: number;
  redemption_code: string;
  status: string;
  created_at: string;
  reward?: Reward;
}

export default function Rewards() {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastRedeemed, setLastRedeemed] = useState<Reward | null>(null);

  const userPoints = profile?.points || 0;

  useEffect(() => {
    fetchRewards();
    if (user) {
      fetchRedemptions();
    }
  }, [user]);

  const fetchRewards = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('points_cost', { ascending: true });

    if (error) {
      console.error('Error fetching rewards:', error);
      setLoading(false);
      return;
    }

    setRewards(data || []);
    setLoading(false);
  };

  const fetchRedemptions = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('reward_redemptions')
      .select(`
        *,
        reward:rewards(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setMyRedemptions(data.map(r => ({
        ...r,
        reward: r.reward as Reward | undefined
      })));
    }
  };

  const filteredRewards = rewards.filter(r => 
    selectedCategory === "الكل" || r.category === selectedCategory
  );

  const handleRedeem = async (reward: Reward) => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول لاستبدال المكافآت",
        variant: "destructive"
      });
      return;
    }

    // Refresh profile first to get latest points
    await refreshProfile();
    
    // Get fresh points from database
    const { data: freshProfile } = await supabase
      .from('profiles')
      .select('points')
      .eq('user_id', user.id)
      .single();
    
    const currentPoints = freshProfile?.points ?? 0;

    if (currentPoints < reward.points_cost) {
      toast({
        title: "نقاط غير كافية",
        description: `لديك ${currentPoints} نقطة وتحتاج ${reward.points_cost} نقطة. تحتاج ${reward.points_cost - currentPoints} نقطة إضافية`,
        variant: "destructive"
      });
      return;
    }

    if (reward.stock !== null && reward.stock <= 0) {
      toast({
        title: "نفذت الكمية",
        description: "هذه المكافأة غير متوفرة حالياً",
        variant: "destructive"
      });
      return;
    }

    setSelectedReward(reward);
    setIsRedeeming(true);

    // Generate redemption code
    const redemptionCode = `RD-${Date.now().toString().slice(-6)}`;

    const { error } = await supabase
      .from('reward_redemptions')
      .insert({
        user_id: user.id,
        reward_id: reward.id,
        points_spent: reward.points_cost,
        redemption_code: redemptionCode,
        status: 'pending'
      });

    if (error) {
      // Check if it's an insufficient points error from the trigger
      if (error.message?.includes('Insufficient points')) {
        toast({
          title: "نقاط غير كافية",
          description: "ليس لديك نقاط كافية لهذه المكافأة",
          variant: "destructive"
        });
      } else {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء الاستبدال",
          variant: "destructive"
        });
      }
      setIsRedeeming(false);
      return;
    }

    // Refresh data
    await fetchRedemptions();
    await fetchRewards();
    await refreshProfile(); // Refresh profile to get updated points

    setIsRedeeming(false);
    setLastRedeemed(reward);
    setShowSuccess(true);
  };
  const closeSuccessDialog = () => {
    setShowSuccess(false);
    setSelectedReward(null);
    setLastRedeemed(null);
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Gift;
    return iconMap[iconName] || Gift;
  };

  const getColorClass = (category: string) => {
    const color = categoryColorMap[category] || 'primary';
    return {
      gradient: color === "primary" 
        ? "from-primary/20 to-primary/5 border-primary/30" 
        : color === "success"
        ? "from-success/20 to-success/5 border-success/30"
        : color === "accent"
        ? "from-accent/20 to-accent/5 border-accent/30"
        : "from-warning/20 to-warning/5 border-warning/30",
      iconBg: color === "primary" ? "bg-primary/20" :
              color === "success" ? "bg-success/20" :
              color === "accent" ? "bg-accent/20" : "bg-warning/20",
      iconColor: color === "primary" ? "text-primary" :
                 color === "success" ? "text-success" :
                 color === "accent" ? "text-accent" : "text-warning"
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="text-foreground">المكافآت</span>
                {" "}
                <span className="text-gradient-accent">والجوائز</span>
              </h1>
              <p className="text-muted-foreground">
                استبدل نقاطك بمكافآت حقيقية واشتراكات وقسائم مالية
              </p>
            </div>
            
            {/* User Points Card */}
            <div className="glass rounded-2xl p-6 border-accent/30 shadow-accent min-w-[200px]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-accent flex items-center justify-center">
                  <Coins className="w-8 h-8 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">رصيدك الحالي</div>
                  <div className="text-3xl font-black text-gradient-accent">{userPoints.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">نقطة</div>
                </div>
              </div>
            </div>
          </div>

          {/* How to Earn */}
          <div className="glass rounded-2xl p-6 border-border/50 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Gift className="w-6 h-6 text-primary" />
              كيف تكسب النقاط؟
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <div className="text-2xl font-bold text-gradient-primary mb-1">+10</div>
                <div className="text-sm text-muted-foreground">لكل إجابة</div>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <div className="text-2xl font-bold text-gradient-accent mb-1">+5</div>
                <div className="text-sm text-muted-foreground">لكل سؤال</div>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <div className="text-2xl font-bold text-gradient-primary mb-1">+25</div>
                <div className="text-sm text-muted-foreground">لكل محتوى تعليمي</div>
              </div>
              <div className="p-4 rounded-xl bg-secondary/50 text-center">
                <div className="text-2xl font-bold text-gradient-accent mb-1">+50</div>
                <div className="text-sm text-muted-foreground">لكل مشروع</div>
              </div>
            </div>
          </div>

          {/* Daily Check-in Calendar */}
          <DailyCheckinCalendar />

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-accent text-accent-foreground shadow-accent"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Rewards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {filteredRewards.map((reward) => {
                  const Icon = getIcon(reward.image_url);
                  const canRedeem = userPoints >= reward.points_cost && (reward.stock === null || reward.stock > 0);
                  const colors = getColorClass(reward.category);

                  return (
                    <motion.div
                      key={reward.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`glass rounded-2xl p-5 border hover-lift transition-all relative overflow-hidden bg-gradient-to-b ${colors.gradient} ${
                        reward.stock !== null && reward.stock === 0 ? "opacity-60" : ""
                      }`}
                    >
                      {reward.stock !== null && reward.stock === 0 && (
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-bold">
                            نفذت
                          </span>
                        </div>
                      )}

                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${colors.iconBg}`}>
                        <Icon className={`w-7 h-7 ${colors.iconColor}`} />
                      </div>

                      <h3 className="text-lg font-bold text-foreground mb-2">
                        {reward.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {reward.description}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1 text-lg font-bold text-gradient-accent">
                          <Coins className="w-5 h-5 text-accent" />
                          <span>{reward.points_cost}</span>
                        </div>
                        {reward.stock !== null && (
                          <span className={`text-xs ${reward.stock <= 5 ? "text-destructive" : "text-muted-foreground"}`}>
                            متبقي: {reward.stock}
                          </span>
                        )}
                      </div>

                      <Button 
                        variant={canRedeem ? "hero" : "secondary"} 
                        size="sm" 
                        className="w-full"
                        disabled={!canRedeem || isRedeeming}
                        onClick={() => handleRedeem(reward)}
                      >
                        {isRedeeming && selectedReward?.id === reward.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            جاري الاستبدال...
                          </>
                        ) : canRedeem ? (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            استبدال
                          </>
                        ) : reward.stock !== null && reward.stock === 0 ? (
                          "نفذت الكمية"
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            نقاط غير كافية
                          </>
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              {filteredRewards.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">لا توجد مكافآت في هذا التصنيف</p>
                </div>
              )}

              {/* My Redemptions */}
              <div className="glass rounded-2xl p-6 border-border/50">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-success" />
                  سجل الاستبدالات ({myRedemptions.length})
                </h2>
                
                {myRedemptions.length > 0 ? (
                  <div className="space-y-3">
                    {myRedemptions.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                        <div>
                          <div className="font-medium text-foreground">{item.reward?.title || 'مكافأة'}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('ar-SA')}
                          </div>
                          <div className="text-xs text-primary font-mono mt-1">كود: {item.redemption_code}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-accent font-bold flex items-center gap-1">
                            <Coins className="w-4 h-4" />
                            {item.points_spent}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.status === "completed" 
                              ? "bg-success/10 text-success" 
                              : item.status === "pending"
                              ? "bg-warning/10 text-warning"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {item.status === "completed" ? "مكتمل" : item.status === "pending" ? "قيد المعالجة" : item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لم تقم بأي استبدالات بعد
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={closeSuccessDialog}>
        <DialogContent className="sm:max-w-[400px] text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="mx-auto w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4"
          >
            <PartyPopper className="w-10 h-10 text-success" />
          </motion.div>
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">تهانينا! 🎉</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-muted-foreground">
              تم استبدال <span className="text-foreground font-bold">{lastRedeemed?.title}</span> بنجاح!
            </p>
            <div className="p-4 rounded-xl bg-secondary/50">
              <div className="text-sm text-muted-foreground mb-1">تم خصم</div>
              <div className="text-2xl font-bold text-gradient-accent flex items-center justify-center gap-2">
                <Coins className="w-6 h-6 text-accent" />
                {lastRedeemed?.points_cost} نقطة
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              ستصلك رسالة على بريدك الإلكتروني تحتوي على تفاصيل المكافأة
            </p>
            <Button variant="hero" className="w-full" onClick={closeSuccessDialog}>
              تمام!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
