import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
    if (user) {
      fetchEnrollments();
      fetchFavorites();
    }
  }, [user]);

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
    return matchesCategory && matchesSearch;
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
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
            <Button variant="outline" size="lg">
              <Filter className="w-5 h-5" />
              فلترة
            </Button>
          </div>

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
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
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
                          src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop"}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
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
                          onClick={() => toggleFavorite(course.id)}
                          className="absolute top-3 left-3 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                        >
                          {isFavorite ? (
                            <Heart className="w-4 h-4 text-destructive fill-destructive" />
                          ) : (
                            <Heart className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>

                        {/* Play Button */}
                        {isEnrolled && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {course.instructor?.charAt(0) || 'م'}
                          </div>
                          <span className="text-sm text-muted-foreground">{course.instructor}</span>
                        </div>

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
                              استأنف الدورة
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
    </div>
  );
}
