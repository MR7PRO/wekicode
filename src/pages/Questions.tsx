import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  MessageSquare, 
  ThumbsUp, 
  Eye, 
  Clock, 
  Tag,
  Search,
  Filter,
  Plus,
  CheckCircle,
  TrendingUp,
  ThumbsDown,
  Send,
  Loader2,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { SEOHead } from "@/components/seo/SEOHead";
import { ar } from "date-fns/locale";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";
import { PostImageUploader } from "@/components/posts/PostImageUploader";

const categories = [
  "الكل", "JavaScript", "Python", "React", "Node.js", "قواعد البيانات", "DevOps", "TypeScript", "CSS", "أخرى"
];

interface Question {
  id: string;
  title: string;
  content: string;
  tags: string[];
  votes: number;
  answers_count: number;
  views: number;
  is_solved: boolean;
  user_id: string;
  created_at: string;
  accepted_answer_id?: string | null;
  image_url?: string | null;
  updated_at?: string;
  author?: {
    full_name: string;
    avatar_url: string | null;
  };
}

// Sample demo questions to show community activity
const demoQuestions: Question[] = [
  {
    id: 'demo-q1',
    title: 'كيف أتعامل مع الـ async/await في JavaScript؟',
    content: 'أواجه مشكلة في فهم كيفية استخدام async/await مع الـ promises. هل يمكن لأحد شرح الفرق بينهما ومتى أستخدم كل واحدة؟',
    tags: ['JavaScript', 'async', 'promises'],
    votes: 45,
    answers_count: 8,
    views: 234,
    is_solved: true,
    user_id: 'accd141b-a6e9-4f48-867c-01a0d1e9623a',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    author: { full_name: 'احمد اسعد', avatar_url: null }
  },
  {
    id: 'demo-q2',
    title: 'ما هي أفضل طريقة لتنظيم مشروع React كبير؟',
    content: 'أعمل على مشروع React كبير وأحتاج نصائح حول بنية المجلدات وتنظيم الـ components والـ hooks.',
    tags: ['React', 'architecture', 'best-practices'],
    votes: 38,
    answers_count: 12,
    views: 456,
    is_solved: true,
    user_id: '0b4ff60f-0c64-4ef9-b749-049539941898',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    author: { full_name: 'خالد اسعد', avatar_url: null }
  },
  {
    id: 'demo-q3',
    title: 'مشكلة في اتصال قاعدة البيانات PostgreSQL',
    content: 'أحاول الاتصال بقاعدة بيانات PostgreSQL من Node.js لكن أحصل على خطأ connection timeout. ما الحل؟',
    tags: ['Node.js', 'قواعد البيانات', 'PostgreSQL'],
    votes: 22,
    answers_count: 5,
    views: 178,
    is_solved: false,
    user_id: '8809d810-7568-4bf1-a13e-1c7c766442bc',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    author: { full_name: 'محمد اسماعيل', avatar_url: null }
  },
  {
    id: 'demo-q4',
    title: 'كيف أضيف TypeScript لمشروع React موجود؟',
    content: 'لدي مشروع React قديم بـ JavaScript وأريد تحويله تدريجياً إلى TypeScript. ما الخطوات؟',
    tags: ['TypeScript', 'React', 'migration'],
    votes: 31,
    answers_count: 7,
    views: 289,
    is_solved: true,
    user_id: '2d4eeb92-8fab-4b38-be86-5fb601f3118b',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    author: { full_name: 'محمود عالم', avatar_url: null }
  },
  {
    id: 'demo-q5',
    title: 'شرح الفرق بين CSS Grid و Flexbox',
    content: 'متى أستخدم Grid ومتى أستخدم Flexbox؟ أحياناً أشعر بالحيرة في الاختيار بينهما.',
    tags: ['CSS', 'Flexbox', 'Grid'],
    votes: 56,
    answers_count: 15,
    views: 612,
    is_solved: true,
    user_id: 'd3f0c9b5-e95b-474e-a0b1-e20d06ae950f',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    author: { full_name: 'محمود سعيد', avatar_url: null }
  },
  {
    id: 'demo-q6',
    title: 'كيف أحمي API من هجمات الـ CORS؟',
    content: 'أريد فهم كيفية إعداد CORS بشكل صحيح في Express.js لحماية الـ API الخاص بي.',
    tags: ['Node.js', 'security', 'CORS'],
    votes: 28,
    answers_count: 6,
    views: 198,
    is_solved: false,
    user_id: '3b0ad300-98f8-4984-9fe6-6ff1372399b7',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    author: { full_name: 'حسام الخالدي', avatar_url: null }
  },
  {
    id: 'demo-q7',
    title: 'ما هي أفضل مكتبة لإدارة الـ State في React 2024؟',
    content: 'Redux vs Zustand vs Jotai vs Context API - أيهم أفضل للمشاريع المتوسطة والكبيرة؟',
    tags: ['React', 'state-management', 'Redux'],
    votes: 67,
    answers_count: 21,
    views: 834,
    is_solved: true,
    user_id: '02818ce2-3bbd-4b24-a9f5-99544d2ae0ac',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    author: { full_name: 'مازن كندا', avatar_url: null }
  },
  {
    id: 'demo-q8',
    title: 'مشكلة في Docker مع Node.js',
    content: 'الـ container يعمل لكن التطبيق لا يستجيب على المنفذ المحدد. ما المشكلة؟',
    tags: ['DevOps', 'Docker', 'Node.js'],
    votes: 19,
    answers_count: 4,
    views: 145,
    is_solved: false,
    user_id: '9d0929d3-2861-46ab-a314-540da12f549a',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    author: { full_name: 'ايهم الهور', avatar_url: null }
  },
];

export default function Questions() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialTag = searchParams.get("tag") || "الكل";
  const [selectedCategory, setSelectedCategory] = useState(initialTag);
  const [searchQuery, setSearchQuery] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ total: 0, answers: 0, solved: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    content: "",
    category: "JavaScript",
    tags: ""
  });
  const [newImage, setNewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    const t = searchParams.get("tag");
    if (t && t !== selectedCategory) setSelectedCategory(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setCategory = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === "الكل") { searchParams.delete("tag"); setSearchParams(searchParams, { replace: true }); }
    else { searchParams.set("tag", cat); setSearchParams(searchParams, { replace: true }); }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
      setLoading(false);
      return;
    }

    // Fetch author profiles
    const questionsWithAuthors = await Promise.all(
      data.map(async (question) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', question.user_id)
          .maybeSingle();
        
        return {
          ...question,
          author: profile || { full_name: 'مستخدم', avatar_url: null }
        };
      })
    );

    // Merge real questions with demo questions
    const allQuestions: Question[] = [...questionsWithAuthors];
    demoQuestions.forEach(demo => {
      if (!allQuestions.some(q => q.title === demo.title)) {
        allQuestions.push(demo as Question);
      }
    });
    
    // Sort by created_at descending
    allQuestions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setQuestions(allQuestions);
    
    // Calculate stats including demo questions
    const totalAnswers = allQuestions.reduce((acc, q) => acc + (q.answers_count || 0), 0);
    const solvedCount = allQuestions.filter(q => q.is_solved).length;
    setStats({
      total: allQuestions.length,
      answers: totalAnswers,
      solved: allQuestions.length > 0 ? Math.round((solvedCount / allQuestions.length) * 100) : 0
    });
    
    setLoading(false);
  };

  const filteredQuestions = questions.filter(q => {
    const matchesCategory = selectedCategory === "الكل" || (q.tags || []).some(t => t.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "solved" && q.is_solved) ||
      (statusFilter === "unsolved" && !q.is_solved);
    return matchesCategory && matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === "votes") return (b.votes || 0) - (a.votes || 0);
    if (sortBy === "views") return (b.views || 0) - (a.views || 0);
    if (sortBy === "answers") return (b.answers_count || 0) - (a.answers_count || 0);
    return 0;
  });

  const handleAddQuestion = async () => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول لطرح سؤال",
        variant: "destructive"
      });
      return;
    }

    if (!newQuestion.title || !newQuestion.content) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    const tags = [newQuestion.category, ...newQuestion.tags.split(",").map(t => t.trim()).filter(Boolean)];

    const { data, error } = await supabase
      .from('questions')
      .insert({
        user_id: user.id,
        title: newQuestion.title,
        content: newQuestion.content,
        tags: tags,
        image_url: newImage,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating question:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء نشر السؤال",
        variant: "destructive"
      });
      setSubmitting(false);
      return;
    }

    // Points are now awarded automatically by database trigger when question is created

    toast({
      title: "تم نشر السؤال! 🎉",
      description: "حصلت على +5 نقاط",
    });

    setNewQuestion({ title: "", content: "", category: "JavaScript", tags: "" });
    setNewImage(null);
    setIsDialogOpen(false);
    setSubmitting(false);
    fetchQuestions();
    
    // Refresh profile to get updated points
    await refreshProfile();
  };
  const handleVote = async (questionId: string, type: 'up' | 'down') => {
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول للتصويت",
        variant: "destructive"
      });
      return;
    }

    const voteType = type === 'up' ? 1 : -1;
    
    const { error: voteError } = await supabase
      .from('votes')
      .upsert({
        user_id: user.id,
        question_id: questionId,
        vote_type: voteType
      }, { onConflict: 'user_id,question_id' });

    if (voteError) {
      console.error('Vote error:', voteError);
      return;
    }

    // Update local state
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, votes: q.votes + voteType }
        : q
    ));

    toast({
      title: type === 'up' ? "تم التصويت بالإيجاب ✓" : "تم التصويت بالسلب",
      description: `حصلت على +1 نقطة للمشاركة`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead
        title="الأسئلة والأجوبة — wekicode"
        description="مجتمع أسئلة وأجوبة تقني للمبرمجين العرب. اطرح سؤالك، شارك معرفتك، واكسب النقاط في wekicode."
        path="/questions"
        jsonLd={{ "@context": "https://schema.org", "@type": "QAPage", "name": "أسئلة وأجوبة wekicode", "url": "https://wekicode.lovable.app/questions" }}
      />
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                <span className="text-foreground">الأسئلة</span>
                {" "}
                <span className="text-gradient-primary">والأجوبة</span>
              </h1>
              <p className="text-muted-foreground">
                اطرح سؤالك أو ساعد الآخرين واكسب النقاط
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="lg">
                  <Plus className="w-5 h-5" />
                  اطرح سؤالاً جديداً
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="text-xl">اطرح سؤالك</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">عنوان السؤال *</label>
                    <Input
                      placeholder="ما هو سؤالك بإيجاز؟"
                      value={newQuestion.title}
                      onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">تفاصيل السؤال *</label>
                    <Textarea
                      placeholder="اشرح سؤالك بالتفصيل..."
                      rows={5}
                      value={newQuestion.content}
                      onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">التصنيف</label>
                      <select
                        className="w-full h-10 rounded-lg bg-secondary border border-border px-3"
                        value={newQuestion.category}
                        onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                      >
                        {categories.filter(c => c !== "الكل").map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">الوسوم</label>
                      <Input
                        placeholder="React, JavaScript..."
                        value={newQuestion.tags}
                        onChange={(e) => setNewQuestion({...newQuestion, tags: e.target.value})}
                      />
                    </div>
                  </div>
                  <PostImageUploader value={newImage} onChange={setNewImage} folder="questions" />
                  <Button 
                    className="w-full" 
                    variant="hero" 
                    onClick={handleAddQuestion}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        نشر السؤال
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
              <HelpCircle className="w-6 h-6 text-primary mb-2" />
              <div className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">سؤال</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50">
              <MessageSquare className="w-6 h-6 text-accent mb-2" />
              <div className="text-2xl font-bold text-foreground">{stats.answers.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">إجابة</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50">
              <CheckCircle className="w-6 h-6 text-success mb-2" />
              <div className="text-2xl font-bold text-foreground">{stats.solved}%</div>
              <div className="text-sm text-muted-foreground">نسبة الحل</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50">
              <TrendingUp className="w-6 h-6 text-warning mb-2" />
              <div className="text-2xl font-bold text-foreground">+10</div>
              <div className="text-sm text-muted-foreground">نقاط للإجابة</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث عن سؤال..."
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
                  <label className="text-sm font-medium text-foreground mb-2 block">الحالة</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all", label: "الكل" },
                      { value: "solved", label: "محلولة ✓" },
                      { value: "unsolved", label: "غير محلولة" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setStatusFilter(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          statusFilter === opt.value
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
                      { value: "votes", label: "الأكثر تصويتاً" },
                      { value: "views", label: "الأكثر مشاهدة" },
                      { value: "answers", label: "الأكثر إجابات" },
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
              {(statusFilter !== "all" || sortBy !== "newest" || selectedCategory !== "الكل" || searchQuery) && (
                <button
                  onClick={() => { setStatusFilter("all"); setSortBy("newest"); setSelectedCategory("الكل"); setSearchQuery(""); }}
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
                onClick={() => setCategory(cat)}
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
              {/* Results Counter */}
              {filteredQuestions.length !== questions.length && (
                <div className="text-sm text-muted-foreground mb-4">
                  عرض <span className="font-bold text-foreground">{filteredQuestions.length}</span> من <span className="font-bold text-foreground">{questions.length}</span> نتيجة
                </div>
              )}
              {/* Questions List */}
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="glass rounded-2xl p-6 border-border/50 hover:border-primary/30 hover-lift transition-all"
                  >
                    <div className="flex gap-4">
                      {/* Vote Column */}
                      <div className="hidden md:flex flex-col items-center gap-2 min-w-[80px]">
                        <button 
                          onClick={() => handleVote(question.id, 'up')}
                          className="p-2 rounded-lg hover:bg-success/10 transition-colors group"
                        >
                          <ThumbsUp className="w-5 h-5 text-muted-foreground group-hover:text-success" />
                        </button>
                        <span className="text-xl font-bold text-foreground">{question.votes}</span>
                        <button 
                          onClick={() => handleVote(question.id, 'down')}
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors group"
                        >
                          <ThumbsDown className="w-5 h-5 text-muted-foreground group-hover:text-destructive" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          {question.is_solved && (
                            <span className="px-2 py-1 rounded-md bg-success/10 text-success text-xs font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              تم الحل
                            </span>
                          )}
                          {question.tags?.[0] && (
                            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                              {question.tags[0]}
                            </span>
                          )}
                        </div>

                        {question.id.startsWith('demo-') ? (
                          <h3 className="text-lg font-bold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer">
                            {question.title}
                          </h3>
                        ) : (
                          <Link to={`/questions/${question.id}`}>
                            <h3 className="text-lg font-bold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer">
                              {question.title}
                            </h3>
                          </Link>
                        )}
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {question.content}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {question.tags?.slice(0, 4).map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCategory(tag); }}
                              className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs hover:bg-primary/20 hover:text-primary transition"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <Link to={`/u/${question.user_id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                              {question.author?.avatar_url ? (
                                <img 
                                  src={question.author.avatar_url} 
                                  alt={question.author.full_name || 'مستخدم'}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                                  {question.author?.full_name?.charAt(0) || 'م'}
                                </div>
                              )}
                              <span>{question.author?.full_name || 'مستخدم'}</span>
                            </Link>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{question.answers_count} إجابة</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{question.views} مشاهدة</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDistanceToNow(new Date(question.created_at), { locale: ar, addSuffix: true })}</span>
                            </div>
                          </div>
                          
                          {question.id.startsWith('demo-') ? (
                            <Button variant="outline" size="sm" disabled className="opacity-60">
                              سؤال تجريبي
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <BookmarkButton itemId={question.id} itemType="question" variant="icon" />
                              <Link to={`/questions/${question.id}`}>
                                <Button variant="outline" size="sm">
                                  عرض التفاصيل
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredQuestions.length === 0 && !loading && (
                  <div className="text-center py-20 glass rounded-2xl border-border/50">
                    <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">لا توجد أسئلة</h3>
                    <p className="text-muted-foreground mb-6">كن أول من يطرح سؤالاً!</p>
                    <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
                      <Plus className="w-5 h-5" />
                      اطرح سؤالاً جديداً
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
