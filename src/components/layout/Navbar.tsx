import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  LogOut,
  Loader2,
  User,
  Settings,
  Code2,
  HelpCircle,
  FileText,
  Briefcase,
  BookOpen,
  Users,
  Trophy,
  Gift,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProgressWidget } from "./ProgressWidget";
import { NotificationBell } from "@/components/notifications/NotificationSystem";
import { ForumNotificationBell } from "@/components/notifications/ForumNotificationBell";
import { MessagesBadge } from "@/components/messages/MessagesBadge";
import { GlobalSearch } from "./GlobalSearch";
import { QuickCreate } from "./QuickCreate";

const navLinks = [
  { path: "/", label: "الرئيسية", icon: Code2 },
  { path: "/questions", label: "الأسئلة", icon: HelpCircle },
  { path: "/articles", label: "المقالات", icon: FileText },
  { path: "/jobs", label: "الوظائف", icon: Briefcase },
  { path: "/courses", label: "التعليم", icon: BookOpen },
  { path: "/developers", label: "المبرمجين", icon: Users },
  { path: "/leaderboard", label: "المتصدرين", icon: Trophy },
  { path: "/rewards", label: "المكافئات", icon: Gift },
  { path: "/billing", label: "الفواتير", icon: CreditCard },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-3">
        {/* Top row */}
        <div className="flex items-center justify-between gap-3 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <BrandLogo className="w-8 h-8 object-contain drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-all duration-300" />
            <span className="text-lg font-black">
              <span className="bg-gradient-to-b from-sky-300 via-blue-500 to-blue-700 bg-clip-text text-transparent">
                Weki
              </span>
              <span className="bg-gradient-to-b from-amber-300 via-orange-500 to-orange-700 bg-clip-text text-transparent">
                Code
              </span>
            </span>
          </Link>

          {/* Desktop Nav links - text only */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link key={link.path} to={link.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`h-10 px-3.5 text-base font-semibold ${isActive ? "shadow-glow" : ""}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right side: actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : user ? (
              <>
                <GlobalSearch variant="icon" />
                <QuickCreate />
                <MessagesBadge />
                <NotificationBell />
                <ForumNotificationBell />
                <ProgressWidget />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ms-1">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{profile?.full_name ?? "مستخدم"}</span>
                        <span className="text-xs text-muted-foreground">المستوى {profile?.level ?? 1}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="w-4 h-4 ml-2" />
                        ملفي الشخصي
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="w-4 h-4 ml-2" />
                        الإعدادات
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4 ml-2" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <GlobalSearch variant="icon" />
                <Link to="/auth">
                  <Button variant="hero" size="sm">
                    تسجيل الدخول
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="القائمة"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border/50 animate-slide-up">
            <div className="mb-3">
              <GlobalSearch variant="inline" />
            </div>
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                {user ? (
                  <>
                    <ProgressWidget />
                    <div className="flex items-center gap-2">
                      <Link to="/profile" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm">
                          <User className="w-4 h-4" />
                          ملفي
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={handleSignOut}>
                        <LogOut className="w-4 h-4" />
                        خروج
                      </Button>
                    </div>
                  </>
                ) : (
                  <Link to="/auth" className="w-full" onClick={() => setIsOpen(false)}>
                    <Button variant="hero" className="w-full">
                      تسجيل الدخول
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
