import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star, 
  TrendingUp,
  Users,
  Coins,
  Award,
  Loader2,
  Search,
  Filter
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarByName } from "@/lib/media/userAvatars";
import { LevelBadge, StyledUsername } from "@/components/levels/LevelBadge";

interface LeaderboardUser {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  level: number;
  badges: string[] | null;
}

// Sample demo users to show activity
const demoUsers: LeaderboardUser[] = [
  { id: 'demo-1', user_id: 'demo-1', full_name: 'محمد أبو صالح', avatar_url: null, points: 4850, level: 12, badges: ['gold_contributor', 'mentor', 'early_adopter'] },
  { id: 'demo-2', user_id: 'demo-2', full_name: 'سارة الخطيب', avatar_url: null, points: 4320, level: 11, badges: ['silver_contributor', 'helper'] },
  { id: 'demo-3', user_id: 'demo-3', full_name: 'أحمد الشريف', avatar_url: null, points: 3980, level: 10, badges: ['bronze_contributor', 'problem_solver'] },
  { id: 'demo-4', user_id: 'demo-4', full_name: 'فاطمة حسن', avatar_url: null, points: 3650, level: 9, badges: ['helper', 'active_member'] },
  { id: 'demo-5', user_id: 'demo-5', full_name: 'عمر النجار', avatar_url: null, points: 3200, level: 8, badges: ['contributor'] },
  { id: 'demo-6', user_id: 'demo-6', full_name: 'نور الدين', avatar_url: null, points: 2890, level: 7, badges: ['active_member'] },
  { id: 'demo-7', user_id: 'demo-7', full_name: 'ليلى العمري', avatar_url: null, points: 2540, level: 7, badges: ['helper'] },
  { id: 'demo-8', user_id: 'demo-8', full_name: 'خالد المصري', avatar_url: null, points: 2310, level: 6, badges: ['contributor'] },
  { id: 'demo-9', user_id: 'demo-9', full_name: 'هند الزهراني', avatar_url: null, points: 2050, level: 5, badges: ['newcomer'] },
  { id: 'demo-10', user_id: 'demo-10', full_name: 'يوسف القاسم', avatar_url: null, points: 1890, level: 5, badges: ['active_member'] },
  { id: 'demo-11', user_id: 'demo-11', full_name: 'رنا الحمد', avatar_url: null, points: 1720, level: 4, badges: [] },
  { id: 'demo-12', user_id: 'demo-12', full_name: 'باسم عودة', avatar_url: null, points: 1580, level: 4, badges: [] },
  { id: 'demo-13', user_id: 'demo-13', full_name: 'دينا الفقي', avatar_url: null, points: 1430, level: 3, badges: [] },
  { id: 'demo-14', user_id: 'demo-14', full_name: 'طارق السيد', avatar_url: null, points: 1290, level: 3, badges: [] },
  { id: 'demo-15', user_id: 'demo-15', full_name: 'مريم الشامي', avatar_url: null, points: 1150, level: 3, badges: [] },
];

export default function Leaderboard() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, avatar_url, points, level, badges')
      .order('points', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
      return;
    }

    const validUsers = (data || []).map(u => ({
      ...u,
      points: u.points ?? 0,
      level: u.level ?? 1
    }));

    // Merge real users with demo users, avoiding duplicates and sorting by points
    const allUsers = [...validUsers];
    demoUsers.forEach(demo => {
      if (!allUsers.some(u => u.full_name === demo.full_name)) {
        allUsers.push(demo);
      }
    });
    
    // Sort by points descending
    allUsers.sort((a, b) => b.points - a.points);

    setUsers(allUsers);

    // Find current user's rank
    if (user) {
      const rank = allUsers.findIndex(u => u.user_id === user.id);
      setUserRank(rank !== -1 ? rank + 1 : null);
    }

    setLoading(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  // Bundled avatars - works on any hosting platform
  const getDemoAvatar = (name: string | null, userId: string) => {
    return getUserAvatarByName(name, userId);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>;
    }
  };

  const getRankBgClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-300/10 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-orange-500/10 border-amber-600/30";
      default:
        return "bg-secondary/50 border-border/50";
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery || (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLevel = levelFilter === "all" ||
      (levelFilter === "beginner" && u.level <= 3) ||
      (levelFilter === "intermediate" && u.level >= 4 && u.level <= 7) ||
      (levelFilter === "advanced" && u.level >= 8);
    return matchesSearch && matchesLevel;
  });

  const topThree = filteredUsers.slice(0, 3);
  const restOfUsers = filteredUsers.slice(3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-foreground">لوحة</span>
              {" "}
              <span className="text-gradient-accent">المتصدرين</span>
            </h1>
            <p className="text-muted-foreground">
              أفضل المستخدمين حسب النقاط والمستوى
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث عن مستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pr-12 pl-4 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 h-12 rounded-xl border font-medium transition-all ${
                showFilters ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              }`}
            >
              <Filter className="w-5 h-5" />
              فلترة
            </button>
          </div>

          {showFilters && (
            <div className="glass rounded-xl p-4 mb-6 border-border/50 animate-in slide-in-from-top-2 duration-200">
              <label className="text-sm font-medium text-foreground mb-2 block">المستوى</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "الكل" },
                  { value: "beginner", label: "مبتدئ (1-3)" },
                  { value: "intermediate", label: "متوسط (4-7)" },
                  { value: "advanced", label: "متقدم (8+)" },
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
              {(levelFilter !== "all" || searchQuery) && (
                <button
                  onClick={() => { setLevelFilter("all"); setSearchQuery(""); }}
                  className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all flex items-center gap-1"
                >
                  إعادة تعيين الفلاتر
                </button>
              )}
            </div>
          )}
          {filteredUsers.length !== users.length && (
            <div className="text-sm text-muted-foreground mb-4">
              عرض <span className="font-bold text-foreground">{filteredUsers.length}</span> من <span className="font-bold text-foreground">{users.length}</span> مستخدم
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-4 border-border/50">
              <Users className="w-6 h-6 text-primary mb-2" />
              <div className="text-2xl font-bold text-foreground">{users.length}</div>
              <div className="text-sm text-muted-foreground">مستخدم نشط</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50">
              <Coins className="w-6 h-6 text-accent mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {users.reduce((acc, u) => acc + u.points, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي النقاط</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50">
              <TrendingUp className="w-6 h-6 text-success mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {users.length > 0 ? Math.round(users.reduce((acc, u) => acc + u.level, 0) / users.length) : 0}
              </div>
              <div className="text-sm text-muted-foreground">متوسط المستوى</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50">
              <Award className="w-6 h-6 text-warning mb-2" />
              <div className="text-2xl font-bold text-foreground">
                {userRank ? `#${userRank}` : "-"}
              </div>
              <div className="text-sm text-muted-foreground">ترتيبك</div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {topThree.length >= 3 && (
                <div className="flex items-end justify-center gap-4 mb-12">
                  {/* Second Place */}
                  <Link to={`/u/${topThree[1].user_id}`} className="flex flex-col items-center hover:scale-105 transition-transform">
                    <Avatar className="w-16 h-16 border-4 border-gray-400 mb-2">
                      <AvatarImage src={topThree[1].avatar_url || getDemoAvatar(topThree[1].full_name, topThree[1].user_id)} />
                      <AvatarFallback className="bg-gray-400 text-white text-xl">
                        {getInitials(topThree[1].full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <Medal className="w-8 h-8 text-gray-400 mb-1" />
                    <div className="glass rounded-xl p-4 text-center w-28 h-24 flex flex-col justify-center border-gray-400/30">
                      <div className="font-bold text-foreground text-sm truncate">{topThree[1].full_name || "مستخدم"}</div>
                      <div className="text-accent font-bold">{topThree[1].points.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">المستوى {topThree[1].level}</div>
                    </div>
                  </Link>

                  {/* First Place */}
                  <Link to={`/u/${topThree[0].user_id}`} className="flex flex-col items-center -mt-8 hover:scale-105 transition-transform">
                    <Crown className="w-10 h-10 text-yellow-500 mb-2 animate-pulse" />
                    <Avatar className="w-20 h-20 border-4 border-yellow-500 mb-2">
                      <AvatarImage src={topThree[0].avatar_url || getDemoAvatar(topThree[0].full_name, topThree[0].user_id)} />
                      <AvatarFallback className="bg-yellow-500 text-white text-2xl">
                        {getInitials(topThree[0].full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="glass rounded-xl p-4 text-center w-32 h-28 flex flex-col justify-center border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-transparent">
                      <div className="font-bold text-foreground truncate">{topThree[0].full_name || "مستخدم"}</div>
                      <div className="text-accent text-xl font-bold">{topThree[0].points.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">المستوى {topThree[0].level}</div>
                    </div>
                  </Link>

                  {/* Third Place */}
                  <Link to={`/u/${topThree[2].user_id}`} className="flex flex-col items-center hover:scale-105 transition-transform">
                    <Avatar className="w-14 h-14 border-4 border-amber-600 mb-2">
                      <AvatarImage src={topThree[2].avatar_url || getDemoAvatar(topThree[2].full_name, topThree[2].user_id)} />
                      <AvatarFallback className="bg-amber-600 text-white text-lg">
                        {getInitials(topThree[2].full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <Medal className="w-7 h-7 text-amber-600 mb-1" />
                    <div className="glass rounded-xl p-4 text-center w-24 h-20 flex flex-col justify-center border-amber-600/30">
                      <div className="font-bold text-foreground text-xs truncate">{topThree[2].full_name || "مستخدم"}</div>
                      <div className="text-accent font-bold text-sm">{topThree[2].points.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">المستوى {topThree[2].level}</div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Current User Card (if not in top 10) */}
              {user && userRank && userRank > 10 && profile && (
                <div className="glass rounded-2xl p-4 border-primary/30 bg-primary/5 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold">#{userRank}</span>
                    </div>
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={profile.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-bold text-foreground">{profile.full_name || "أنت"}</div>
                      <div className="text-sm text-muted-foreground">ترتيبك الحالي</div>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-accent" />
                        <span className="text-lg font-bold text-accent">{(profile.points ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3" />
                        المستوى {profile.level ?? 1}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard Table */}
              <div className="glass rounded-2xl border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-accent" />
                    قائمة المتصدرين
                  </h2>
                </div>
                
                <div className="divide-y divide-border/50">
                  {filteredUsers.map((u, index) => {
                    const rank = index + 1;
                    const isCurrentUser = user && u.user_id === user.id;
                    
                    return (
                      <div 
                        key={u.id} 
                        className={`flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors ${
                          isCurrentUser ? "bg-primary/5 border-r-4 border-r-primary" : ""
                        } ${getRankBgClass(rank)}`}
                      >
                        {/* Rank */}
                        <div className="w-10 flex items-center justify-center">
                          {getRankIcon(rank)}
                        </div>

                        {/* Avatar */}
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={u.avatar_url || getDemoAvatar(u.full_name, u.user_id)} />
                          <AvatarFallback className={rank <= 3 ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                            {getInitials(u.full_name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Name & Level */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate flex items-center gap-2">
                            <StyledUsername name={u.full_name || "مستخدم"} level={u.level} />
                            {isCurrentUser && <span className="text-primary text-sm">(أنت)</span>}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <LevelBadge level={u.level} points={u.points} size="sm" />
                            {u.badges && u.badges.length > 0 && (
                              <span className="text-xs text-muted-foreground">• {u.badges.length} شارة</span>
                            )}
                          </div>
                        </div>

                        {/* Points */}
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-accent" />
                          <span className="text-lg font-bold text-gradient-accent">{u.points.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا يوجد مستخدمين بعد</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}