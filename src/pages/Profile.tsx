import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  User, Coins, Star, Award, Briefcase, BookOpen, HelpCircle, Calendar, MapPin,
  Link as LinkIcon, Settings, TrendingUp, CheckCircle, Clock, FileText, ExternalLink,
  Github, Linkedin, Twitter, Globe, Code2, Target, Flame, Trophy, Heart, MessageCircle,
  Eye, Zap, Medal, Crown, Rocket, Camera, Loader2 as UploadLoader, Lock
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BadgeDisplay } from "@/components/badges/BadgeSystem";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getUserAvatarSrc } from "@/lib/media/userAvatars";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { ActivityGraph } from "@/components/profile/ActivityGraph";
import { PointsLedger } from "@/components/profile/PointsLedger";
import { CoverUpload } from "@/components/profile/CoverUpload";
import { ShareProfileButton } from "@/components/profile/ShareProfileButton";
import { UpcomingAchievements } from "@/components/profile/UpcomingAchievements";
import { Link } from "react-router-dom";
import { LevelBadge, LevelAvatarFrame, StyledUsername } from "@/components/levels/LevelBadge";
import { getLevelPerk, getNextLevelPerk, LEVEL_PERKS } from "@/lib/levelPerks";
import { computeLevelInfo } from "@/lib/leveling";
import { SEOHead } from "@/components/seo/SEOHead";

const tabs = ["نظرة عامة", "الشارات", "المشاريع", "الأسئلة", "الدورات", "النقاط", "الفواتير"];

export default function Profile() {
  const [activeTab, setActiveTab] = useState("نظرة عامة");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile, user, refreshProfile } = useAuth();

  // Real data states
  const [myQuestions, setMyQuestions] = useState<any[]>([]);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [myJobApps, setMyJobApps] = useState<any[]>([]);
  const [stats, setStats] = useState({ projects: 0, answers: 0, courses: 0, questions: 0 });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) fetchRealData();
  }, [user]);

  const fetchRealData = async () => {
    if (!user) return;
    setLoadingData(true);

    const [questionsRes, answersRes, coursesRes, enrollmentsRes, jobAppsRes] = await Promise.all([
      supabase.from("questions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("answers").select("id").eq("user_id", user.id),
      supabase.from("courses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("course_enrollments").select("*, courses(title, category, image_url)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("job_applications").select("*, jobs(title, company, budget_min, budget_max, status, skills)").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    setMyQuestions(questionsRes.data || []);
    setMyCourses(enrollmentsRes.data || []);
    setMyJobApps(jobAppsRes.data || []);
    setStats({
      projects: jobAppsRes.data?.length || 0,
      answers: answersRes.data?.length || 0,
      courses: enrollmentsRes.data?.length || 0,
      questions: questionsRes.data?.length || 0,
    });
    setLoadingData(false);
  };

  const profileData = profile as any;

  const userData = {
    name: profileData?.full_name ?? "مستخدم جديد",
    username: user?.email ? `@${user.email.split("@")[0]}` : "",
    bio: profileData?.bio ?? "لم يتم إضافة نبذة بعد",
    location: profileData?.location ?? "غزة، فلسطين 🇵🇸",
    website: profileData?.website_url || "",
    joinDate: user?.created_at ? new Date(user.created_at).toLocaleDateString("ar-EG", { month: "long", year: "numeric" }) : "",
    points: profileData?.points ?? 0,
    level: profileData?.level ?? 1,
    rank: getLevelRank(profileData?.level ?? 1),
    badges: profileData?.badges ?? [],
    skills: profileData?.skills ?? [],
    streak: profileData?.current_streak ?? 0,
    longestStreak: profileData?.longest_streak ?? 0,
    social: {
      github: profileData?.github_url || "",
      linkedin: profileData?.linkedin_url || "",
      twitter: profileData?.twitter_url || "",
    },
    coverUrl: profileData?.cover_url || null,
    isPublic: profileData?.is_public ?? true,
  };

  const avatarSrc = profile?.avatar_url || getUserAvatarSrc(user?.id);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast({ title: "يرجى اختيار صورة صالحة", variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: "حجم الصورة يجب أن يكون أقل من 2MB", variant: "destructive" }); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;
      await supabase.storage.from("avatars").remove([filePath]);
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.rpc("update_profile_info", { p_avatar_url: avatarUrl } as any);
      if (updateError) throw updateError;
      await refreshProfile();
      toast({ title: "تم تحديث صورة الملف الشخصي بنجاح ✅" });
    } catch (err: any) {
      toast({ title: "فشل رفع الصورة", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
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

  const levelInfo = computeLevelInfo(userData.points, userData.level);
  // Keep userData.level in sync with derived level so all downstream UI agrees.
  userData.level = levelInfo.level;
  const LevelIcon = getLevelIcon(userData.level);
  const { progressPercentage, remainingToNext, isMaxLevel } = levelInfo;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      pending: { class: "bg-warning/10 text-warning", label: "قيد المراجعة" },
      accepted: { class: "bg-success/10 text-success", label: "مقبول" },
      rejected: { class: "bg-destructive/10 text-destructive", label: "مرفوض" },
      open: { class: "bg-primary/10 text-primary", label: "مفتوح" },
      closed: { class: "bg-muted text-muted-foreground", label: "مغلق" },
    };
    return map[status] || { class: "bg-secondary text-secondary-foreground", label: status };
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${userData.name} — ملفي على wekicode`}
        description={`ملف ${userData.name} الشخصي على wekicode: المستوى، النقاط، الإنجازات والنشاط.`}
        path="/profile"
      />
      <h1 className="sr-only">{`الملف الشخصي للمستخدم ${userData.name}`}</h1>
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Cover Image */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-3xl overflow-hidden mb-8">
            <CoverUpload coverUrl={userData.coverUrl} />
            
            {/* Profile Content overlapping cover */}
            <div className="relative glass border-border/30 p-8 -mt-16 mx-4 rounded-2xl">
              {/* Privacy Badge */}
              {!userData.isPublic && (
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  خاص
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left - Avatar */}
                <div className="flex flex-col items-center lg:items-start gap-6">
                  <div className="relative group -mt-20">
                    <LevelAvatarFrame level={userData.level}>
                      <div className="w-36 h-36 rounded-3xl bg-gradient-primary p-1">
                        <div className="w-full h-full rounded-3xl bg-card flex items-center justify-center overflow-hidden">
                          <img src={avatarSrc} alt={userData.name} className="w-full h-full rounded-3xl object-cover" />
                        </div>
                      </div>
                    </LevelAvatarFrame>
                    {user && (
                      <>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                          aria-label="تغيير صورة الملف الشخصي"
                          className="absolute inset-0 rounded-3xl bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                          {uploading ? <UploadLoader className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
                        </button>
                      </>
                    )}
                    <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-accent">
                      <div className="text-center">
                        <LevelIcon className="w-5 h-5 text-accent-foreground mx-auto" />
                        <span className="text-xs font-bold text-accent-foreground">Lv.{userData.level}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-success border-2 border-card animate-pulse" />
                  </div>

                  {/* Streak */}
                  <div className="glass rounded-2xl p-4 border-accent/30 w-full max-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                        <Flame className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-foreground">{userData.streak}</div>
                        <div className="text-xs text-muted-foreground">يوم متتالي</div>
                      </div>
                    </div>
                    {userData.longestStreak > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        أطول سلسلة: <strong className="text-foreground">{userData.longestStreak}</strong> يوم
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle - Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <StyledUsername name={userData.name} level={userData.level} className="text-3xl md:text-4xl" />
                    <LevelBadge level={userData.level} points={userData.points} />
                  </div>
                  
                  <p className="text-muted-foreground mb-2">{userData.username}</p>
                  <p className="text-foreground/80 mb-6 max-w-xl text-lg">{userData.bio}</p>
                  
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2 hover:text-primary transition-colors">
                      <MapPin className="w-4 h-4" />
                      <span>{userData.location}</span>
                    </div>
                    {userData.website && (
                      <a href={userData.website.startsWith("http") ? userData.website : `https://${userData.website}`} target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Globe className="w-4 h-4" />
                        <span>{userData.website.replace(/^https?:\/\//, "")}</span>
                      </a>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>انضم في {userData.joinDate}</span>
                    </div>
                  </div>

                  {/* Social */}
                  <div className="flex items-center gap-3 mb-6">
                    {userData.social.github && (
                      <a href={`https://github.com/${userData.social.github}`} target="_blank" rel="noopener"
                         className="w-10 h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                        <Github className="w-5 h-5 text-foreground" />
                      </a>
                    )}
                    {userData.social.linkedin && (
                      <a href={`https://linkedin.com/in/${userData.social.linkedin}`} target="_blank" rel="noopener"
                         className="w-10 h-10 rounded-xl bg-secondary hover:bg-blue-600/20 flex items-center justify-center transition-colors">
                        <Linkedin className="w-5 h-5 text-foreground" />
                      </a>
                    )}
                    {userData.social.twitter && (
                      <a href={`https://twitter.com/${userData.social.twitter}`} target="_blank" rel="noopener"
                         className="w-10 h-10 rounded-xl bg-secondary hover:bg-sky-500/20 flex items-center justify-center transition-colors">
                        <Twitter className="w-5 h-5 text-foreground" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <EditProfileDialog />
                    <Link to="/settings">
                      <Button variant="outline">
                        <Settings className="w-4 h-4" />
                        الإعدادات
                      </Button>
                    </Link>
                    {user && <ShareProfileButton userId={user.id} />}
                  </div>
                </div>

                {/* Right - Points */}
                <div className="lg:w-72 space-y-4">
                  <div className="glass rounded-2xl p-6 border-accent/30">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-accent">
                        <Coins className="w-8 h-8 text-accent-foreground" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-gradient-accent">{userData.points.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">نقطة مكتسبة</div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">المستوى {userData.level}</span>
                        <span className="text-primary font-medium">
                          {isMaxLevel ? "أعلى مستوى" : `المستوى ${userData.level + 1}`}
                        </span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-accent rounded-full" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 text-center">
                        {isMaxLevel
                          ? "لقد وصلت إلى أعلى مستوى 🏆"
                          : `${remainingToNext.toLocaleString()} نقطة للمستوى التالي`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { icon: Briefcase, value: stats.projects, label: "طلب وظيفي", color: "primary" },
                  { icon: MessageCircle, value: stats.answers, label: "إجابة", color: "accent" },
                  { icon: BookOpen, value: stats.courses, label: "دورة مسجل بها", color: "success" },
                  { icon: HelpCircle, value: stats.questions, label: "سؤال مطروح", color: "warning" },
                ].map((stat, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }}
                    className={`glass rounded-2xl p-5 border-${stat.color}/20 hover:border-${stat.color}/40 transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                      </div>
                      <div>
                        <div className="text-2xl font-black text-foreground">{loadingData ? "..." : stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border-border/50">
            
            {activeTab === "نظرة عامة" && (
              <div className="space-y-8">
                {/* Activity Graph */}
                <ActivityGraph />

                {/* Upcoming Achievements */}
                <UpcomingAchievements
                  badges={userData.badges as string[]}
                  currentStreak={userData.streak}
                  stats={{ answers: stats.answers, projects: stats.projects, courses: stats.courses, level: userData.level }}
                  points={userData.points}
                />

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Skills */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-primary" />
                      المهارات
                    </h3>
                    {userData.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {userData.skills.map((skill: string, i: number) => (
                          <motion.span key={skill} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">
                            {skill}
                          </motion.span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">أضف مهاراتك من خلال تعديل الملف الشخصي</p>
                    )}
                  </div>

                  {/* Recent Questions */}
                  <div className="lg:col-span-2">
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-warning" />
                      آخر الأسئلة
                    </h3>
                    {myQuestions.length > 0 ? (
                      <div className="space-y-3">
                        {myQuestions.slice(0, 3).map((q, i) => (
                          <Link to={`/questions/${q.id}`} key={q.id}>
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-all flex items-center gap-4">
                              {q.is_solved && (
                                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                                  <CheckCircle className="w-4 h-4 text-success" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-foreground truncate">{q.title}</h4>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  <span>{q.answers_count || 0} إجابة</span>
                                  <span>{q.votes || 0} صوت</span>
                                  <span>{q.views || 0} مشاهدة</span>
                                </div>
                              </div>
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">لم تطرح أي أسئلة بعد</p>
                    )}
                  </div>
                </div>

                {/* Badges Preview */}
                {userData.badges.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-accent" />
                      الشارات المكتسبة
                    </h3>
                    <BadgeDisplay badges={userData.badges as string[]} showAll={false} currentStreak={userData.streak} stats={{ answers: stats.answers, projects: stats.projects, courses: stats.courses, level: userData.level }} />
                  </div>
                )}
              </div>
            )}

            {activeTab === "الشارات" && (
              <div>
                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  شاراتي وإنجازاتي
                </h3>
                <BadgeDisplay badges={userData.badges as string[]} showAll currentStreak={userData.streak} stats={{ answers: stats.answers, projects: stats.projects, courses: stats.courses, level: userData.level }} />
              </div>
            )}

            {activeTab === "المشاريع" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  طلبات التوظيف ({myJobApps.length})
                </h3>
                {myJobApps.length > 0 ? myJobApps.map((app, i) => {
                  const job = (app as any).jobs;
                  const statusBadge = getStatusBadge(app.status);
                  return (
                    <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-foreground">{job?.title || "وظيفة"}</h4>
                          <p className="text-sm text-muted-foreground">{job?.company || "شركة"}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${statusBadge.class}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      {job?.skills && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {job.skills.slice(0, 5).map((s: string) => (
                            <span key={s} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">{s}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        {job?.budget_min && <span className="text-success font-bold">${job.budget_min} - ${job.budget_max}</span>}
                        <span>{new Date(app.created_at).toLocaleDateString("ar-EG")}</span>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h4 className="text-xl font-bold text-foreground mb-2">لم تقدم على أي وظائف بعد</h4>
                    <p className="text-muted-foreground mb-6">تصفح الوظائف المتاحة وقدم على ما يناسبك</p>
                    <Link to="/jobs">
                      <Button variant="hero" className="shadow-glow">
                        <Briefcase className="w-4 h-4" />
                        تصفح الوظائف
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === "الأسئلة" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-warning" />
                  أسئلتي ({myQuestions.length})
                </h3>
                {myQuestions.length > 0 ? myQuestions.map((q, i) => (
                  <Link to={`/questions/${q.id}`} key={q.id}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-all">
                      <div className="flex items-start gap-4">
                        {q.is_solved && (
                          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5 text-success" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-foreground mb-2">{q.title}</h4>
                          {q.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {q.tags.slice(0, 4).map((t: string) => (
                                <span key={t} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{t}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{q.answers_count || 0} إجابة</span>
                            <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" />{q.votes || 0} صوت</span>
                            <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{q.views || 0} مشاهدة</span>
                            <span>{new Date(q.created_at).toLocaleDateString("ar-EG")}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                )) : (
                  <div className="text-center py-12">
                    <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h4 className="text-xl font-bold text-foreground mb-2">لم تطرح أي أسئلة بعد</h4>
                    <p className="text-muted-foreground mb-6">اطرح سؤالك الأول واحصل على إجابات من المجتمع</p>
                    <Link to="/questions">
                      <Button variant="hero" className="shadow-glow">
                        <HelpCircle className="w-4 h-4" />
                        اطرح سؤالاً
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === "الدورات" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-success" />
                  دوراتي ({myCourses.length})
                </h3>
                {myCourses.length > 0 ? myCourses.map((enrollment, i) => {
                  const course = (enrollment as any).courses;
                  return (
                    <motion.div key={enrollment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-all">
                      <div className="flex items-center gap-4">
                        {course?.image_url && (
                          <img src={course.image_url} alt={course.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-foreground">{course?.title || "دورة"}</h4>
                          <p className="text-sm text-muted-foreground">{course?.category}</p>
                        </div>
                        <div className="text-left">
                          <div className="text-2xl font-black text-primary">{enrollment.progress || 0}%</div>
                          <div className="text-xs text-muted-foreground">التقدم</div>
                        </div>
                      </div>
                      <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${enrollment.progress || 0}%` }} />
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h4 className="text-xl font-bold text-foreground mb-2">لم تسجل في أي دورات بعد</h4>
                    <p className="text-muted-foreground mb-6">تصفح الدورات المتاحة وابدأ التعلم</p>
                    <Link to="/courses">
                      <Button variant="hero" className="shadow-glow">
                        <BookOpen className="w-4 h-4" />
                        تصفح الدورات
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === "النقاط" && <PointsLedger />}

            {activeTab === "الفواتير" && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h4 className="text-xl font-bold text-foreground mb-2">قريباً</h4>
                <p className="text-muted-foreground">نظام الفواتير سيكون متاحاً قريباً</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
