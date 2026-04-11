import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  DollarSign, 
  Clock, 
  MapPin,
  Search,
  Filter,
  Star,
  Users,
  Calendar,
  ArrowLeft,
  CheckCircle,
  Bookmark,
  BookmarkCheck,
  Plus,
  Send,
  X,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import avatarPlaceholder from "@/assets/avatar-placeholder.jpg";
import { getUserAvatarSrc, getUserAvatarByName } from "@/lib/media/userAvatars";

const jobTypes = ["الكل", "عمل عن بُعد", "عقد", "مشروع واحد", "دوام جزئي"];

interface Job {
  id: string;
  title: string;
  description: string;
  company: string | null;
  job_type: string;
  skills: string[];
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  applications_count: number;
  user_id: string;
  created_at: string;
}

export default function Jobs() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [budgetFilter, setBudgetFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // New job form
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    budgetMin: "",
    budgetMax: "",
    duration: "",
    skills: "",
    type: "مشروع واحد"
  });

  // Apply form
  const [applyForm, setApplyForm] = useState({
    coverLetter: "",
    portfolio: "",
    expectedBudget: ""
  });

  useEffect(() => {
    fetchJobs();
    if (user) {
      fetchUserFavorites();
      fetchUserApplications();
    }
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
      return;
    }

    setJobs(data || []);
    setLoading(false);
  };

  const fetchUserFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_favorites')
      .select('job_id')
      .eq('user_id', user.id)
      .not('job_id', 'is', null);

    if (data) {
      setSavedJobs(data.map(f => f.job_id!));
    }
  };

  const fetchUserApplications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('job_applications')
      .select('job_id')
      .eq('user_id', user.id);

    if (data) {
      setAppliedJobs(data.map(a => a.job_id));
    }
  };

  const filteredJobs = jobs.filter(j => {
    const matchesType = selectedType === "الكل" || j.job_type === selectedType;
    const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (j.skills && j.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesBudget = budgetFilter === "all" ||
      (budgetFilter === "low" && (j.budget_max ?? 0) <= 100) ||
      (budgetFilter === "mid" && (j.budget_min ?? 0) >= 100 && (j.budget_max ?? Infinity) <= 500) ||
      (budgetFilter === "high" && (j.budget_min ?? 0) >= 500);
    return matchesType && matchesSearch && matchesBudget;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === "budget_high") return (b.budget_max ?? 0) - (a.budget_max ?? 0);
    if (sortBy === "budget_low") return (a.budget_min ?? 0) - (b.budget_min ?? 0);
    if (sortBy === "applications") return (b.applications_count ?? 0) - (a.applications_count ?? 0);
    return 0;
  });

  const handlePostJob = async () => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول لنشر مشروع",
        variant: "destructive"
      });
      return;
    }

    if (!newJob.title || !newJob.description) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        title: newJob.title,
        description: newJob.description,
        job_type: newJob.type,
        skills: newJob.skills.split(",").map(s => s.trim()).filter(Boolean),
        budget_min: newJob.budgetMin ? parseInt(newJob.budgetMin) : null,
        budget_max: newJob.budgetMax ? parseInt(newJob.budgetMax) : null,
        company: "شركتك"
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء نشر المشروع",
        variant: "destructive"
      });
      setSubmitting(false);
      return;
    }

    toast({
      title: "تم نشر المشروع! 🎉",
      description: "سيظهر مشروعك للمستقلين الآن",
    });

    setNewJob({ title: "", description: "", budgetMin: "", budgetMax: "", duration: "", skills: "", type: "مشروع واحد" });
    setIsPostDialogOpen(false);
    setSubmitting(false);
    fetchJobs();
  };

  const handleApply = async () => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول للتقديم",
        variant: "destructive"
      });
      return;
    }

    if (!applyForm.coverLetter) {
      toast({
        title: "خطأ",
        description: "يرجى كتابة رسالة التقديم",
        variant: "destructive"
      });
      return;
    }

    if (!selectedJob) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('job_applications')
      .insert({
        user_id: user.id,
        job_id: selectedJob.id,
        cover_letter: applyForm.coverLetter
      });

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التقديم",
        variant: "destructive"
      });
      setSubmitting(false);
      return;
    }

    setAppliedJobs([...appliedJobs, selectedJob.id]);
    setApplyForm({ coverLetter: "", portfolio: "", expectedBudget: "" });
    setIsApplyDialogOpen(false);
    setSelectedJob(null);
    setSubmitting(false);
    
    toast({
      title: "تم إرسال طلبك! 🎉",
      description: "ستحصل على إشعار عند قبول طلبك",
    });
  };

  const toggleSaveJob = async (jobId: string) => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول لحفظ المشاريع",
        variant: "destructive"
      });
      return;
    }

    if (savedJobs.includes(jobId)) {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('job_id', jobId);
      
      setSavedJobs(savedJobs.filter(id => id !== jobId));
      toast({ title: "تم إزالة المشروع من المحفوظات" });
    } else {
      await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, job_id: jobId });
      
      setSavedJobs([...savedJobs, jobId]);
      toast({ title: "تم حفظ المشروع ⭐" });
    }
  };

  const openApplyDialog = (job: Job) => {
    setSelectedJob(job);
    setIsApplyDialogOpen(true);
  };

  const getBudgetString = (job: Job) => {
    if (job.budget_min && job.budget_max) {
      return `$${job.budget_min} - $${job.budget_max}`;
    } else if (job.budget_min) {
      return `$${job.budget_min}+`;
    } else if (job.budget_max) {
      return `حتى $${job.budget_max}`;
    }
    return "غير محدد";
  };

  // Stable, bundled avatars (different per job) using company name + job id for variety
  const getJobAvatar = (job: Job) => getUserAvatarByName(job.company, job.id);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="text-foreground">فرص</span>
                {" "}
                <span className="text-gradient-primary">العمل الحر</span>
              </h1>
              <p className="text-muted-foreground">
                تصفح المشاريع وقدم على العمل الذي يناسب مهاراتك
              </p>
            </div>
            
            <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="accent" size="lg">
                  <Briefcase className="w-5 h-5" />
                  انشر مشروعاً
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="text-xl">انشر مشروعك</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">عنوان المشروع *</label>
                    <Input
                      placeholder="مثال: تطوير تطبيق ويب باستخدام React"
                      value={newJob.title}
                      onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">وصف المشروع *</label>
                    <Textarea
                      placeholder="اشرح تفاصيل المشروع والمتطلبات..."
                      rows={4}
                      value={newJob.description}
                      onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">الميزانية الدنيا ($)</label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={newJob.budgetMin}
                        onChange={(e) => setNewJob({...newJob, budgetMin: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">الميزانية القصوى ($)</label>
                      <Input
                        type="number"
                        placeholder="500"
                        value={newJob.budgetMax}
                        onChange={(e) => setNewJob({...newJob, budgetMax: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">نوع العمل</label>
                      <select
                        className="w-full h-10 rounded-lg bg-secondary border border-border px-3"
                        value={newJob.type}
                        onChange={(e) => setNewJob({...newJob, type: e.target.value})}
                      >
                        {jobTypes.filter(t => t !== "الكل").map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">المهارات المطلوبة</label>
                      <Input
                        placeholder="React, Node.js..."
                        value={newJob.skills}
                        onChange={(e) => setNewJob({...newJob, skills: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button className="w-full" variant="hero" onClick={handlePostJob} disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        نشر المشروع
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-4 border-border/50">
              <Briefcase className="w-6 h-6 text-primary mb-2" />
              <div className="text-2xl font-bold text-foreground">{jobs.length}</div>
              <div className="text-sm text-muted-foreground">فرصة متاحة</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50">
              <DollarSign className="w-6 h-6 text-success mb-2" />
              <div className="text-2xl font-bold text-foreground">$45K+</div>
              <div className="text-sm text-muted-foreground">إجمالي المدفوعات</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50">
              <Users className="w-6 h-6 text-accent mb-2" />
              <div className="text-2xl font-bold text-foreground">234</div>
              <div className="text-sm text-muted-foreground">فريلانسر نشط</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50">
              <CheckCircle className="w-6 h-6 text-warning mb-2" />
              <div className="text-2xl font-bold text-foreground">+50</div>
              <div className="text-sm text-muted-foreground">نقاط لكل مشروع</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث عن مشروع أو مهارة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pr-12 pl-4 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <Button variant={showFilters ? "default" : "outline"} size="lg" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-5 h-5" />
              فلترة
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="glass rounded-xl p-4 mb-6 border-border/50 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">الميزانية</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "الكل" },
                      { value: "low", label: "أقل من $100" },
                      { value: "mid", label: "$100 - $500" },
                      { value: "high", label: "أكثر من $500" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setBudgetFilter(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          budgetFilter === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">ترتيب حسب</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "newest", label: "الأحدث" },
                      { value: "oldest", label: "الأقدم" },
                      { value: "budget_high", label: "الأعلى ميزانية" },
                      { value: "budget_low", label: "الأقل ميزانية" },
                      { value: "applications", label: "الأكثر تقديماً" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          sortBy === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {(budgetFilter !== "all" || sortBy !== "newest" || selectedType !== "الكل" || searchQuery) && (
                <button
                  onClick={() => { setBudgetFilter("all"); setSortBy("newest"); setSelectedType("الكل"); setSearchQuery(""); }}
                  className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  إعادة تعيين الفلاتر
                </button>
              )}
            </div>
          )}

          {/* Job Types */}
          <div className="flex flex-wrap gap-2 mb-8">
            {jobTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedType === type
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {type}
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
              {/* Results Counter */}
              {filteredJobs.length !== jobs.length && (
                <div className="text-sm text-muted-foreground mb-4">
                  عرض <span className="font-bold text-foreground">{filteredJobs.length}</span> من <span className="font-bold text-foreground">{jobs.length}</span> نتيجة
                </div>
              )}
              {/* Jobs List */}
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`glass rounded-2xl p-6 border-border/50 hover:border-primary/30 hover-lift transition-all ${
                      appliedJobs.includes(job.id) ? "border-success/30 bg-success/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-3">
                      {appliedJobs.includes(job.id) && (
                        <span className="px-2 py-1 rounded-md bg-success/10 text-success text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          تم التقديم
                        </span>
                      )}
                      <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                        {job.job_type}
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Company Avatar */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-primary shrink-0 shadow-glow">
                        <img 
                          src={getJobAvatar(job)} 
                          alt={job.company || 'شركة'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== avatarPlaceholder) target.src = avatarPlaceholder;
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-1">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <span>{job.company || 'شركة'}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            عن بُعد
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {job.description}
                        </p>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.skills?.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills && job.skills.length > 4 && (
                            <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">
                              +{job.skills.length - 4}
                            </span>
                          )}
                        </div>

                        {/* Meta & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 font-bold text-success">
                              <DollarSign className="w-4 h-4" />
                              <span>{getBudgetString(job)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{job.applications_count || 0} عرض</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDistanceToNow(new Date(job.created_at), { locale: ar, addSuffix: true })}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSaveJob(job.id)}
                              className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            >
                              {savedJobs.includes(job.id) ? (
                                <BookmarkCheck className="w-5 h-5 text-primary" />
                              ) : (
                                <Bookmark className="w-5 h-5 text-muted-foreground" />
                              )}
                            </button>
                            {appliedJobs.includes(job.id) ? (
                              <Button variant="secondary" size="sm" disabled>
                                <CheckCircle className="w-4 h-4" />
                                تم التقديم
                              </Button>
                            ) : (
                              <Button variant="hero" size="sm" onClick={() => openApplyDialog(job)}>
                                <Send className="w-4 h-4" />
                                قدم الآن
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredJobs.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">لا توجد مشاريع مطابقة للبحث</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Apply Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">التقديم على المشروع</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-xl bg-secondary/50">
                <h3 className="font-bold text-foreground mb-1">{selectedJob.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedJob.company}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">رسالة التقديم *</label>
                <Textarea
                  placeholder="اشرح لماذا أنت مناسب لهذا المشروع..."
                  rows={4}
                  value={applyForm.coverLetter}
                  onChange={(e) => setApplyForm({...applyForm, coverLetter: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">رابط معرض أعمالك</label>
                <Input
                  placeholder="https://..."
                  value={applyForm.portfolio}
                  onChange={(e) => setApplyForm({...applyForm, portfolio: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">الميزانية المتوقعة</label>
                <Input
                  placeholder="$300"
                  value={applyForm.expectedBudget}
                  onChange={(e) => setApplyForm({...applyForm, expectedBudget: e.target.value})}
                />
              </div>
              <Button className="w-full" variant="hero" onClick={handleApply} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    إرسال الطلب
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <BottomNav />
    </div>
  );
}
