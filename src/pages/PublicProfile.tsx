import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFollows } from "@/hooks/useFollows";
import { useMessages } from "@/hooks/useMessages";
import { getUserAvatarSrc } from "@/lib/media/userAvatars";
import { motion } from "framer-motion";
import { 
  MapPin, Calendar, Globe, Github, Linkedin, Twitter, Code2, Flame, Trophy, 
  Medal, Star, Zap, Crown, Coins, Award, Lock, Loader2, MessageSquare, UserPlus, UserCheck, Users
} from "lucide-react";
import { BadgeDisplay } from "@/components/badges/BadgeSystem";
import { toast } from "@/hooks/use-toast";

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { isFollowing, followersCount, followingCount, toggleFollow, loading: followLoading } = useFollows(userId);
  const { getOrCreateConversation } = useMessages();

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId!)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
    } else if (!(data as any).is_public) {
      setNotFound(true);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!user) return navigate("/auth");
    if (!userId || user.id === userId) return;
    const convId = await getOrCreateConversation(userId);
    if (convId) {
      navigate(`/messages?conversation=${convId}`);
    } else {
      toast({ title: "خطأ", description: "فشل بدء المحادثة", variant: "destructive" });
    }
  };

  function getLevelRank(level: number): string {
    if (level >= 10) return "أسطورة البرمجة";
    if (level >= 7) return "مبرمج محترف";
    if (level >= 5) return "مبرمج متميز";
    if (level >= 3) return "مبرمج متقدم";
    return "مبرمج مبتدئ";
  }

  function getLevelIcon(level: number) {
    if (level >= 10) return Crown;
    if (level >= 7) return Trophy;
    if (level >= 5) return Medal;
    if (level >= 3) return Star;
    return Zap;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-2xl font-bold text-foreground mb-2">هذا الملف الشخصي غير متاح</h2>
            <p className="text-muted-foreground">قد يكون خاصاً أو غير موجود</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const LevelIcon = getLevelIcon(profile.level || 1);
  const avatarSrc = profile.avatar_url || getUserAvatarSrc(profile.user_id);
  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl overflow-hidden">
            {/* Cover */}
            <div className="relative w-full h-48 md:h-56">
              {profile.cover_url ? (
                <img src={profile.cover_url} alt="غلاف" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-accent/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>

            <div className="glass border-border/30 p-8 -mt-16 mx-4 rounded-2xl">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="relative -mt-20">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-primary p-1 shadow-glow">
                    <img src={avatarSrc} alt={profile.full_name} className="w-full h-full rounded-3xl object-cover bg-card" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center">
                    <LevelIcon className="w-5 h-5 text-accent-foreground" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-black text-foreground">{profile.full_name || "مستخدم"}</h1>
                      <span className="px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-sm font-bold">
                        {getLevelRank(profile.level || 1)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    {!isOwnProfile && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant={isFollowing ? "outline" : "default"}
                          size="sm"
                          onClick={toggleFollow}
                          disabled={followLoading}
                        >
                          {isFollowing ? <UserCheck className="w-4 h-4 ml-1" /> : <UserPlus className="w-4 h-4 ml-1" />}
                          {isFollowing ? "متابَع" : "متابعة"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSendMessage}>
                          <MessageSquare className="w-4 h-4 ml-1" />
                          إرسال رسالة
                        </Button>
                      </div>
                    )}
                  </div>

                  {profile.bio && <p className="text-foreground/80 mb-4 text-lg">{profile.bio}</p>}

                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-4">
                    {profile.location && <span className="flex items-center gap-2"><MapPin className="w-4 h-4" />{profile.location}</span>}
                    {profile.website_url && (
                      <a href={profile.website_url.startsWith("http") ? profile.website_url : `https://${profile.website_url}`} target="_blank" rel="noopener"
                        className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Globe className="w-4 h-4" />{profile.website_url.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="font-bold text-foreground">{followersCount}</span> متابع
                      <span className="mx-1">·</span>
                      <span className="font-bold text-foreground">{followingCount}</span> يتابع
                    </span>
                  </div>

                  {/* Social */}
                  <div className="flex items-center gap-3 mb-6">
                    {profile.github_url && <a href={`https://github.com/${profile.github_url}`} target="_blank" rel="noopener" className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center"><Github className="w-5 h-5 text-foreground" /></a>}
                    {profile.linkedin_url && <a href={`https://linkedin.com/in/${profile.linkedin_url}`} target="_blank" rel="noopener" className="w-10 h-10 rounded-xl bg-secondary hover:bg-blue-600/20 flex items-center justify-center"><Linkedin className="w-5 h-5 text-foreground" /></a>}
                    {profile.twitter_url && <a href={`https://twitter.com/${profile.twitter_url}`} target="_blank" rel="noopener" className="w-10 h-10 rounded-xl bg-secondary hover:bg-sky-500/20 flex items-center justify-center"><Twitter className="w-5 h-5 text-foreground" /></a>}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-accent" />
                      <span className="font-bold text-foreground">{(profile.points || 0).toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">نقطة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <span className="font-bold text-foreground">{profile.current_streak || 0}</span>
                      <span className="text-sm text-muted-foreground">يوم متتالي</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {profile.skills?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-primary" /> المهارات
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s: string) => (
                      <span key={s} className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Badges */}
              {profile.badges?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" /> الشارات
                  </h3>
                  <BadgeDisplay badges={profile.badges} showAll={false} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
