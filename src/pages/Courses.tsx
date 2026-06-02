import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  PlayCircle, 
  Clock, 
  Users,
  Search,
  Filter,
  Star,
  Award,
  FileText,
  Video,
  Coins,
  Plus,
  CheckCircle,
  Play,
  Heart,
  HeartOff,
  Send,
  Loader2,
  X,
  Brain
} from "lucide-react";
import { useState, useEffect } from "react";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import coursePlaceholder from "@/assets/course-placeholder.jpg";
import avatarPlaceholder from "@/assets/avatar-placeholder.jpg";
import { getUserAvatarByName } from "@/lib/media/userAvatars";
import { getCourseThumbnailById } from "@/lib/media/courseThumbnails";
import { SEOHead } from "@/components/seo/SEOHead";
import { CertificateDialog } from "@/components/courses/CertificateDialog";

const categories = ["الكل", "تطوير الويب", "تطوير الموبايل", "علم البيانات", "DevOps", "تصميم", "ذكاء اصطناعي"];

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  duration: string | null;
  lessons_count: number;
  students_count: number;
  rating: number | null;
  image_url: string | null;
  is_free: boolean;
  price: number | null;
  user_id: string;
  created_at: string;
}

interface Enrollment {
  course_id: string;
  progress: number;
  completed_lessons: number[];
}

interface CourseQuiz {
  id: string;
  course_id: string;
  title: string;
}

export default function Courses() {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [favoriteCourses, setFavoriteCourses] = useState<string[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [quizzes, setQuizzes] = useState<CourseQuiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<{ id: string; title: string } | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  
  // New course form
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "تطوير الويب",
    level: "مبتدئ",
    duration: "",
    type: "فيديو",
    link: ""
  });

  useEffect(() => {
    fetchCourses();
    fetchQuizzes();
    if (user) {
      fetchEnrollments();
      fetchFavorites();
    }
  }, [user]);

  const fetchQuizzes = async () => {
    const { data } = await supabase.from("course_quizzes").select("*");
    if (data) setQuizzes(data as CourseQuiz[]);
  };

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('students_count', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      setLoading(false);
      return;
    }

    setCourses(data || []);
    setLoading(false);
  };

  const fetchEnrollments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('course_enrollments')
      .select('course_id, progress, completed_lessons')
      .eq('user_id', user.id);

    if (data) {
      setEnrollments(data.map(e => ({
        course_id: e.course_id,
        progress: e.progress || 0,
        completed_lessons: e.completed_lessons || []
      })));
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_favorites')
      .select('course_id')
      .eq('user_id', user.id)
      .not('course_id', 'is', null);

    if (data) {
      setFavoriteCourses(data.map(f => f.course_id!));
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchesCategory = selectedCategory === "الكل" || c.category === selectedCategory;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || c.level === levelFilter;
    const matchesPrice = priceFilter === "all" ||
      (priceFilter === "free" && c.is_free) ||
      (priceFilter === "paid" && !c.is_free);
    const matchesFavorites = !showOnlyFavorites || favoriteCourses.includes(c.id);
    return matchesCategory && matchesSearch && matchesLevel && matchesPrice && matchesFavorites;
  }).sort((a, b) => {
    if (sortBy === "popular") return (b.students_count || 0) - (a.students_count || 0);
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "price_low") return (a.price || 0) - (b.price || 0);
    if (sortBy === "price_high") return (b.price || 0) - (a.price || 0);
    return 0;
  });

  const handleEnroll = async (course: Course) => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول للتسجيل في الدورة",
        variant: "destructive"
      });
      return;
    }

    const isEnrolled = enrollments.some(e => e.course_id === course.id);
    
    if (isEnrolled) {
      toast({
        title: "استئناف الدورة 📚",
        description: `جاري تحميل ${course.title}...`,
      });
      return;
    }

    // Database trigger handles points deduction atomically (prevents race conditions)
    const { error } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: user.id,
        course_id: course.id,
        progress: 0,
        completed_lessons: []
      });

    if (error) {
      // Handle insufficient points error from database trigger
      if (error.message?.includes('Insufficient points')) {
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('points')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const currentPoints = freshProfile?.points ?? 0;
        const neededPoints = course.price ?? 0;
        
        toast({
          title: "نقاط غير كافية",
          description: `لديك ${currentPoints} نقطة وتحتاج ${neededPoints} نقطة`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء التسجيل",
          variant: "destructive"
        });
      }
      return;
    }

    setEnrollments([...enrollments, { course_id: course.id, progress: 0, completed_lessons: [] }]);
    
    // Refresh profile to update points in navbar
    await refreshProfile();
    
    toast({
      title: "تم التسجيل بنجاح! 🎉",
      description: course.is_free ? "ستحصل على نقاط عند إكمال الدورة" : `تم خصم ${course.price} نقطة`,
    });
  };

  const toggleFavorite = async (courseId: string) => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول لإضافة للمفضلة",
        variant: "destructive"
      });
      return;
    }

    if (favoriteCourses.includes(courseId)) {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', courseId);
      
      setFavoriteCourses(favoriteCourses.filter(id => id !== courseId));
      toast({ title: "تم إزالة الدورة من المفضلة" });
    } else {
      await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, course_id: courseId });
      
      setFavoriteCourses([...favoriteCourses, courseId]);
      toast({ title: "تم إضافة الدورة للمفضلة ❤️" });
    }
  };

  const handleShareCourse = async () => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول لمشاركة محتوى",
        variant: "destructive"
      });
      return;
    }

    if (!newCourse.title || !newCourse.description) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        title: newCourse.title,
        description: newCourse.description,
        instructor: "أنت",
        category: newCourse.category,
        level: newCourse.level,
        duration: newCourse.duration || null,
        is_free: true,
        lessons_count: 10
      });

    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء نشر المحتوى",
        variant: "destructive"
      });
      setSubmitting(false);
      return;
    }

    toast({
      title: "تم نشر المحتوى! 🎉",
      description: "حصلت على +25 نقطة للمشاركة",
    });

    setNewCourse({ title: "", description: "", category: "تطوير الويب", level: "مبتدئ", duration: "", type: "فيديو", link: "" });
    setIsShareDialogOpen(false);
    setSubmitting(false);
    fetchCourses();
    
    // Refresh profile to get updated points
    await refreshProfile();
  };

  const getEnrollment = (courseId: string) => {
    return enrollments.find(e => e.course_id === courseId);
  };

  if (activeQuiz) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <QuizPlayer
              quizId={activeQuiz.id}
              quizTitle={activeQuiz.title}
              onClose={() => setActiveQuiz(null)}
            />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <SEOHead
        title="الدورات التعليمية في البرمجة — wekicode"
        description="دورات ومواد تعليمية في البرمجة باللغة العربية. تعلّم لغات وأطر جديدة على منصة wekicode."
        path="/courses"
      />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="text-foreground">المواد</span>
                {" "}
                <span className="text-gradient-primary">التعليمية</span>
              </h1>
              <p className="text-muted-foreground">
                تعلم من دورات ومقالات مشتركة من مجتمع المبرمجين
              </p>
            </div>
            
            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="success" size="lg">
                  <BookOpen className="w-5 h-5" />
                  شارك محتوى تعليمي
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="text-xl">شارك محتوى تعليمي</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">عنوان المحتوى *</label>
                    <Input
                      placeholder="مثال: دورة تعلم JavaScript"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">الوصف *</label>
                    <Textarea
                      placeholder="اشرح ماذا سيتعلم الطلاب..."
                      rows={3}
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">التصنيف</label>
                      <select
                        className="w-full h-10 rounded-lg bg-secondary border border-border px-3"
                        value={newCourse.category}
                        onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                      >
                        {categories.filter(c => c !== "الكل").map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">المستوى</label>
                      <select
                        className="w-full h-10 rounded-lg bg-secondary border border-border px-3"
                        value={newCourse.level}
                        onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                      >
                        <option value="مبتدئ">مبتدئ</option>
                        <option value="متوسط">متوسط</option>
                        <option value="متقدم">متقدم</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">النوع</label>
                      <select
                        className="w-full h-10 rounded-lg bg-secondary border border-border px-3"
                        value={newCourse.type}
                        onChange={(e) => setNewCourse({...newCourse, type: e.target.value})}
                      >
                        <option value="فيديو">فيديو</option>
                        <option value="مقال">مقال</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">المدة</label>
                      <Input
                        placeholder="مثال: 5 ساعات"
                        value={newCourse.duration}
                        onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">رابط المحتوى</label>
                    <Input
                      placeholder="https://..."
                      value={newCourse.link}
                      onChange={(e) => setNewCourse({...newCourse, link: e.target.value})}
                    />
                  </div>
                  <Button className="w-full" variant="hero" onClick={handleShareCourse} disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        نشر المحتوى (+25 نقاط)
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
              <BookOpen className="w-6 h-6 text-primary mb-2" />
              <div className="text-2xl font-bold text-foreground">{courses.length}</div>
              <div className="text-sm text-muted-foreground">دورة</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50">
              <FileText className="w-6 h-6 text-accent mb-2" />
              <div className="text-2xl font-bold text-foreground">{courses.filter(c => c.is_free).length}</div>
              <div className="text-sm text-muted-foreground">دورة مجانية</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50">
              <Users className="w-6 h-6 text-success mb-2" />
              <div className="text-2xl font-bold text-foreground">{courses.reduce((acc, c) => acc + (c.students_count || 0), 0).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">طالب</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50">
              <Award className="w-6 h-6 text-warning mb-2" />
              <div className="text-2xl font-bold text-foreground">+25</div>
              <div className="text-sm text-muted-foreground">نقاط للمشاركة</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث عن دورة أو موضوع..."
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">المستوى</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "الكل" },
                      { value: "مبتدئ", label: "مبتدئ" },
                      { value: "متوسط", label: "متوسط" },
                      { value: "متقدم", label: "متقدم" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setLevelFilter(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          levelFilter === opt.value
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
                  <label className="text-sm font-medium text-foreground mb-2 block">السعر</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "الكل" },
                      { value: "free", label: "مجاني" },
                      { value: "paid", label: "مدفوع" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setPriceFilter(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          priceFilter === opt.value
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
                      { value: "popular", label: "الأكثر شعبية" },
                      { value: "rating", label: "الأعلى تقييماً" },
                      { value: "newest", label: "الأحدث" },
                      { value: "price_low", label: "الأقل سعراً" },
                      { value: "price_high", label: "الأعلى سعراً" },
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
              {(levelFilter !== "all" || priceFilter !== "all" || sortBy !== "popular" || selectedCategory !== "الكل" || searchQuery) && (
                <button
                  onClick={() => { setLevelFilter("all"); setPriceFilter("all"); setSortBy("popular"); setSelectedCategory("الكل"); setSearchQuery(""); }}
                  className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  إعادة تعيين الفلاتر
                </button>
              )}
            </div>
          )}

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat}
              </button>
            ))}
            {user && (
              <button
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ms-auto ${
                  showOnlyFavorites
                    ? "bg-destructive text-destructive-foreground shadow-glow"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <Heart className={`w-4 h-4 ${showOnlyFavorites ? "fill-current" : ""}`} />
                المفضلة {favoriteCourses.length > 0 && `(${favoriteCourses.length})`}
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Results Counter */}
              {filteredCourses.length !== courses.length && (
                <div className="text-sm text-muted-foreground mb-4">
                  عرض <span className="font-bold text-foreground">{filteredCourses.length}</span> من <span className="font-bold text-foreground">{courses.length}</span> نتيجة
                </div>
              )}
              {/* Courses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => {
                  const enrollment = getEnrollment(course.id);
                  const isEnrolled = !!enrollment;
                  const isFavorite = favoriteCourses.includes(course.id);
                  const userPoints = profile?.points ?? 0;
                  const canAfford = course.is_free || !course.price || userPoints >= course.price;

                  return (
                    <div
                      key={course.id}
                      className="glass rounded-2xl overflow-hidden border-border/50 hover:border-primary/30 hover-lift transition-all group"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                        <img
                          src={getCourseThumbnailById(course.id) ?? course.image_url ?? coursePlaceholder}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== coursePlaceholder) {
                              target.src = coursePlaceholder;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                        
                        {/* Badges */}
                        <div className="absolute top-3 right-3 flex gap-2">
                          {course.is_free && (
                            <span className="px-2 py-1 rounded-md bg-success text-success-foreground text-xs font-bold">
                              مجاني
                            </span>
                          )}
                          <span className="px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-xs font-medium">
                            {course.level}
                          </span>
                        </div>

                        {/* Favorite Button */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleFavorite(course.id); }}
                          aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                          className="absolute top-3 left-3 z-20 p-2 rounded-full bg-background/80 hover:bg-background transition-colors cursor-pointer"
                        >
                          {isFavorite ? (
                            <Heart className="w-4 h-4 text-destructive fill-destructive" />
                          ) : (
                            <Heart className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>

                        {/* Play Button */}
                        {isEnrolled && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <button className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-glow">
                              <Play className="w-6 h-6 text-primary-foreground ml-1" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">
                            {course.category}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 min-h-[3.5rem]">
                          {course.title}
                        </h3>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {course.description}
                        </p>

                        {/* Instructor */}
                        <Link to={`/u/${course.user_id}`} className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity" onClick={e => e.stopPropagation()}>
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-primary shrink-0">
                            <img
                              src={getUserAvatarByName(course.instructor, course.id)}
                              alt={course.instructor || "مدرب"}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== avatarPlaceholder) target.src = avatarPlaceholder;
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground hover:text-primary transition-colors">{course.instructor}</span>
                        </Link>

                        {/* Progress (if enrolled) */}
                        {isEnrolled && enrollment && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">التقدم</span>
                              <span className="text-primary font-medium">{enrollment.progress}%</span>
                            </div>
                            <Progress value={enrollment.progress} className="h-2" />
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{course.students_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration || 'غير محدد'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-warning fill-warning" />
                            <span>{course.rating || 0}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button 
                          variant={isEnrolled ? "secondary" : course.is_free ? "hero" : canAfford ? "outline" : "secondary"} 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleEnroll(course)}
                          disabled={!isEnrolled && !course.is_free && !canAfford}
                        >
                          {isEnrolled ? (
                            <>
                              <Play className="w-4 h-4" />
                              {enrollment && enrollment.progress >= 100 ? "أعد المشاهدة" : enrollment && enrollment.progress > 0 ? "تابع من حيث توقفت" : "ابدأ الدورة"}
                            </>
                          ) : course.is_free ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              ابدأ مجاناً
                            </>
                          ) : canAfford ? (
                            <>
                              <Coins className="w-4 h-4" />
                              {course.price} نقطة
                            </>
                          ) : (
                            <>
                              <Coins className="w-4 h-4" />
                              نقاط غير كافية ({course.price} نقطة)
                            </>
                          )}
                        </Button>

                        {/* Quiz Button */}
                        {(() => {
                          const quiz = quizzes.find(q => q.course_id === course.id);
                          if (!quiz) return null;
                          return (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2 border-accent/50 text-accent hover:bg-accent/10"
                              onClick={() => setActiveQuiz({ id: quiz.id, title: quiz.title })}
                            >
                              <Brain className="w-4 h-4" />
                              اختبر معلوماتك
                            </Button>
                          );
                        })()}

                        {/* Certificate (when course fully completed) */}
                        {isEnrolled && enrollment && enrollment.progress >= 100 && (
                          <CertificateDialog
                            courseId={course.id}
                            courseTitle={course.title}
                            instructor={course.instructor}
                            studentName={profile?.full_name || user?.email?.split("@")[0] || "متعلّم"}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredCourses.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">لا توجد دورات مطابقة للبحث</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
