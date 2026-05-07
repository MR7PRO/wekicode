import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Code2, 
  HelpCircle, 
  Briefcase, 
  BookOpen, 
  Gift, 
  User, 
  Users,
  Menu,
  X,
  LogOut,
  Loader2,
  CreditCard,
  Trophy,
  Settings,
  FileText
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import wekicodeLogo from "@/assets/wekicode-logo-new.png";
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
import { MessagesBadge } from "@/components/messages/MessagesBadge";

const navLinks = [
  { path: "/", label: "الرئيسية", icon: Code2 },
  { path: "/questions", label: "الأسئلة", icon: HelpCircle },
  { path: "/articles", label: "المقالات", icon: FileText },
  { path: "/jobs", label: "الوظائف", icon: Briefcase },
  { path: "/courses", label: "التعليم", icon: BookOpen },
  { path: "/developers", label: "المبرمجين", icon: Users },
  { path: "/leaderboard", label: "المتصدرين", icon: Trophy },
  { path: "/rewards", label: "المكافآت", icon: Gift },
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
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img 
              src={wekicodeLogo} 
              alt="WekiCode Logo" 
              className="w-9 h-9 object-contain drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)] group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300"
            />
            <span className="text-xl font-black transition-all duration-300">
              <span className="bg-gradient-to-b from-sky-300 via-blue-500 to-blue-700 bg-clip-text text-transparent group-hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.7)]">
                Weki
              </span>
              <span className="bg-gradient-to-b from-amber-300 via-orange-500 to-orange-700 bg-clip-text text-transparent group-hover:drop-shadow-[0_0_20px_rgba(249,115,22,0.7)]">
                Code
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 ms-8">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link key={link.path} to={link.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={isActive ? "shadow-glow" : ""}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Progress Widget & Auth */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : user ? (
              <>
                {/* Messages & Notifications */}
                <MessagesBadge />
                <NotificationBell />
                
                {/* Progress Widget - Game-like level indicator */}
                <ProgressWidget />

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full me-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
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
              <Link to="/auth">
                <Button variant="hero" size="sm">
                  تسجيل الدخول
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                  >
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
