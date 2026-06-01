import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarByName } from "@/lib/media/userAvatars";
import { LevelBadge, StyledUsername } from "@/components/levels/LevelBadge";
import {
  Search,
  MapPin,
  Code2,
  Users,
  Loader2,
  Filter,
  X,
  Flame,
  Star,
  Coins,
} from "lucide-react";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/seo/SEOHead";

interface Developer {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  location: string | null;
  level: number;
  points: number;
  current_streak: number;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
}

export default function Developers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, user_id, full_name, avatar_url, bio, skills, location, level, points, current_streak, github_url, linkedin_url, website_url"
      )
      .eq("is_public", true)
      .order("points", { ascending: false });

    if (!error && data) {
      setDevelopers(
        data.map((d) => ({
          ...d,
          level: d.level ?? 1,
          points: d.points ?? 0,
          current_streak: d.current_streak ?? 0,
        }))
      );
    }
    setLoading(false);
  };

  // Extract unique skills and locations for filters
  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    developers.forEach((d) => d.skills?.forEach((s) => skills.add(s)));
    return Array.from(skills).sort();
  }, [developers]);

  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    developers.forEach((d) => {
      if (d.location) locs.add(d.location);
    });
    return Array.from(locs).sort();
  }, [developers]);

  const filtered = useMemo(() => {
    return developers.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.skills?.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesSkill =
        !selectedSkill || d.skills?.includes(selectedSkill);
      const matchesLocation =
        !selectedLocation || d.location === selectedLocation;
      return matchesSearch && matchesSkill && matchesLocation;
    });
  }, [developers, searchQuery, selectedSkill, selectedLocation]);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const hasActiveFilters = selectedSkill || selectedLocation || searchQuery;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="دليل المطوّرين — wekicode"
        description="استعرض ملفات المطوّرين على wekicode، اكتشف مهاراتهم وتواصل معهم لفرص العمل والتعاون."
        path="/developers"
      />
      <Navbar />

      <main className="pt-24 pb-24 md:pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-foreground">اكتشف</span>{" "}
              <span className="text-gradient-accent">المبرمجين</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              تصفح ملفات المبرمجين والمطورين، تواصل معهم وابنِ شبكتك المهنية
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass rounded-xl p-4 border-border/50 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-1" />
              <div className="text-2xl font-bold text-foreground">
                {developers.length}
              </div>
              <div className="text-xs text-muted-foreground">مبرمج</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50 text-center">
              <Code2 className="w-6 h-6 text-accent mx-auto mb-1" />
              <div className="text-2xl font-bold text-foreground">
                {allSkills.length}
              </div>
              <div className="text-xs text-muted-foreground">مهارة</div>
            </div>
            <div className="glass rounded-xl p-4 border-border/50 text-center">
              <MapPin className="w-6 h-6 text-success mx-auto mb-1" />
              <div className="text-2xl font-bold text-foreground">
                {allLocations.length}
              </div>
              <div className="text-xs text-muted-foreground">موقع</div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو المهارة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pr-12 pl-4 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 h-12 rounded-xl border font-medium transition-all ${
                showFilters
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              }`}
            >
              <Filter className="w-5 h-5" />
              فلترة
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-accent" />
              )}
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-5 mb-6 border-border/50 space-y-4"
            >
              {/* Skills */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  المهارات
                </label>
                <div className="flex flex-wrap gap-2">
                  {allSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() =>
                        setSelectedSkill(
                          selectedSkill === skill ? null : skill
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedSkill === skill
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                  {allSkills.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      لا توجد مهارات
                    </span>
                  )}
                </div>
              </div>

              {/* Locations */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  الموقع
                </label>
                <div className="flex flex-wrap gap-2">
                  {allLocations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() =>
                        setSelectedLocation(
                          selectedLocation === loc ? null : loc
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedLocation === loc
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {loc}
                    </button>
                  ))}
                  {allLocations.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      لا توجد مواقع
                    </span>
                  )}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSelectedSkill(null);
                    setSelectedLocation(null);
                    setSearchQuery("");
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  إعادة تعيين الفلاتر
                </button>
              )}
            </motion.div>
          )}

          {/* Results count */}
          {hasActiveFilters && (
            <div className="text-sm text-muted-foreground mb-4">
              عرض{" "}
              <span className="font-bold text-foreground">
                {filtered.length}
              </span>{" "}
              من{" "}
              <span className="font-bold text-foreground">
                {developers.length}
              </span>{" "}
              مبرمج
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl border-border/50">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                لا يوجد مبرمجين
              </h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "جرب تغيير الفلاتر أو البحث"
                  : "لا يوجد مبرمجين بملفات عامة حالياً"}
              </p>
            </div>
          ) : (
            /* Developer Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((dev, i) => (
                <motion.div
                  key={dev.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                >
                  <Link
                    to={`/u/${dev.user_id}`}
                    className="block glass rounded-2xl border-border/50 hover:border-primary/40 transition-all hover:shadow-glow group overflow-hidden"
                  >
                    {/* Top accent bar */}
                    <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary/50" />

                    <div className="p-5">
                      {/* Avatar + Name */}
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-14 h-14 ring-2 ring-border group-hover:ring-primary/50 transition-all">
                          <AvatarImage
                            src={
                              dev.avatar_url ||
                              getUserAvatarByName(dev.full_name, dev.user_id)
                            }
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                            {getInitials(dev.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <StyledUsername
                            name={dev.full_name || "مبرمج"}
                            level={dev.level}
                            className="text-base font-bold"
                          />
                          <LevelBadge
                            level={dev.level}
                            points={dev.points}
                            size="sm"
                          />
                          {dev.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3" />
                              {dev.location}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      {dev.bio && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {dev.bio}
                        </p>
                      )}

                      {/* Skills */}
                      {dev.skills && dev.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {dev.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                              {skill}
                            </span>
                          ))}
                          {dev.skills.length > 4 && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-muted-foreground">
                              +{dev.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center gap-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-accent" />
                          <span className="font-medium text-foreground">
                            {dev.points.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-primary" />
                          <span>مستوى {dev.level}</span>
                        </div>
                        {dev.current_streak > 0 && (
                          <div className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                            <span>{dev.current_streak} يوم</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
