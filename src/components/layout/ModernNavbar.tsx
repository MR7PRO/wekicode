import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Code2, 
  HelpCircle, 
  Briefcase, 
  BookOpen, 
  Gift, 
  User, 
  Menu,
  X,
  LogOut,
  Loader2,
  CreditCard,
  Trophy,
  ArrowRight
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { WCLogo } from "./WCLogo";
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
import { cn } from "@/lib/utils";

const navLinks = [
  { path: "/", label: "Home", icon: Code2 },
  { path: "/questions", label: "Questions", icon: HelpCircle },
  { path: "/jobs", label: "Jobs", icon: Briefcase },
  { path: "/courses", label: "Courses", icon: BookOpen },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "/rewards", label: "Rewards", icon: Gift },
];

export function ModernNavbar() {
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(222,47%,6%)]/80 backdrop-blur-xl border-b border-[hsl(222,30%,18%)]/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group transition-all duration-300 hover:scale-[1.03]"
          >
            <div className="relative">
              <WCLogo 
                size={36} 
                className="transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]" 
              />
            </div>
            <span className="text-xl font-bold tracking-[-0.02em] transition-all duration-300 group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">
              <span className="text-white">Weki</span>
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Code
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link key={link.path} to={link.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "relative text-[hsl(215,20%,65%)] hover:text-white transition-colors duration-300",
                      "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5",
                      "after:bg-gradient-to-r after:from-cyan-400 after:via-blue-500 after:to-purple-500",
                      "after:transition-all after:duration-300 hover:after:w-full",
                      "hover:bg-transparent hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]",
                      isActive && "text-white after:w-full"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[hsl(215,20%,65%)]" />
            ) : user ? (
              <>
                <NotificationBell />
                <ProgressWidget />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white">
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[hsl(222,47%,10%)] border-[hsl(222,30%,18%)]">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-xs">
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{profile?.full_name ?? "User"}</span>
                        <span className="text-xs text-[hsl(215,20%,65%)]">Level {profile?.level ?? 1}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-[hsl(222,30%,18%)]" />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer text-[hsl(215,20%,65%)] hover:text-white">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/billing" className="cursor-pointer text-[hsl(215,20%,65%)] hover:text-white">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Billing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[hsl(222,30%,18%)]" />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-400 cursor-pointer hover:text-red-300">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button 
                  className="relative bg-transparent border border-transparent bg-clip-padding px-5 py-2 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                  style={{
                    background: 'linear-gradient(hsl(222,47%,8%), hsl(222,47%,8%)) padding-box, linear-gradient(135deg, #22D3EE, #3B82F6, #8B5CF6) border-box',
                    borderRadius: '8px',
                    border: '2px solid transparent',
                  }}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-[hsl(222,30%,18%)]/50 animate-slide-up">
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
                      className={cn(
                        "w-full justify-start",
                        isActive 
                          ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white" 
                          : "text-[hsl(215,20%,65%)]"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
              <div className="flex items-center justify-between pt-4 border-t border-[hsl(222,30%,18%)]/50">
                {user ? (
                  <>
                    <ProgressWidget />
                    <div className="flex items-center gap-2">
                      <Link to="/profile" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="text-[hsl(215,20%,65%)]">
                          <User className="w-4 h-4" />
                          Profile
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-red-400">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    </div>
                  </>
                ) : (
                  <Link to="/auth" className="w-full" onClick={() => setIsOpen(false)}>
                    <Button 
                      className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white"
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-1" />
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
