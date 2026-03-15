import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon, User, Bell, Shield, Palette, Globe, LogOut, 
  Eye, EyeOff, Moon, Sun, Lock, Mail, Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const settingsSections = [
  { id: "account", label: "الحساب", icon: User },
  { id: "privacy", label: "الخصوصية", icon: Shield },
  { id: "notifications", label: "الإشعارات", icon: Bell },
  { id: "appearance", label: "المظهر", icon: Palette },
];

export default function Settings() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("account");
  const [isPublic, setIsPublic] = useState(true);
  const [notifSound, setNotifSound] = useState(true);
  const [notifBadges, setNotifBadges] = useState(true);
  const [notifPoints, setNotifPoints] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (profile) {
      setIsPublic((profile as any).is_public ?? true);
    }
    setDarkMode(document.documentElement.classList.contains("dark"));
  }, [profile]);

  const handleTogglePublic = async (value: boolean) => {
    setIsPublic(value);
    const { error } = await supabase.rpc("update_profile_info", { p_is_public: value } as any);
    if (error) {
      toast({ title: "حدث خطأ", variant: "destructive" });
      setIsPublic(!value);
    } else {
      await refreshProfile();
      toast({ title: value ? "الملف الشخصي عام الآن" : "الملف الشخصي خاص الآن" });
    }
  };

  const handleToggleDark = (value: boolean) => {
    setDarkMode(value);
    document.documentElement.classList.toggle("dark", value);
    localStorage.setItem("theme", value ? "dark" : "light");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-primary" />
              الإعدادات
            </h1>
            <p className="text-muted-foreground mb-8">إدارة حسابك وتفضيلاتك</p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <div className="md:w-56 flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button key={section.id} onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                      activeSection === section.id
                        ? "bg-gradient-primary text-primary-foreground shadow-glow"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}>
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="flex-1 glass rounded-2xl p-6 border-border/50">
              
              {activeSection === "account" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">إعدادات الحساب</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-foreground">البريد الإلكتروني</div>
                          <div className="text-sm text-muted-foreground">{user?.email}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-foreground">كلمة المرور</div>
                          <div className="text-sm text-muted-foreground">آخر تغيير: غير معروف</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={async () => {
                        if (!user?.email) return;
                        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                          redirectTo: `${window.location.origin}/profile`,
                        });
                        if (error) toast({ title: "حدث خطأ", variant: "destructive" });
                        else toast({ title: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك" });
                      }}>
                        تغيير
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-border pt-6 space-y-4">
                    <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </Button>
                  </div>
                </div>
              )}

              {activeSection === "privacy" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">الخصوصية والأمان</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        {isPublic ? <Eye className="w-5 h-5 text-success" /> : <EyeOff className="w-5 h-5 text-warning" />}
                        <div>
                          <div className="font-medium text-foreground">الملف الشخصي العام</div>
                          <div className="text-sm text-muted-foreground">
                            {isPublic ? "يمكن لأي شخص رؤية ملفك الشخصي" : "ملفك الشخصي مخفي عن الآخرين"}
                          </div>
                        </div>
                      </div>
                      <Switch checked={isPublic} onCheckedChange={handleTogglePublic} />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">إعدادات الإشعارات</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium text-foreground">صوت الإشعارات</div>
                          <div className="text-sm text-muted-foreground">تشغيل صوت عند وصول إشعار جديد</div>
                        </div>
                      </div>
                      <Switch checked={notifSound} onCheckedChange={setNotifSound} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-accent" />
                        <div>
                          <div className="font-medium text-foreground">إشعارات الشارات</div>
                          <div className="text-sm text-muted-foreground">إشعار عند الحصول على شارة جديدة</div>
                        </div>
                      </div>
                      <Switch checked={notifBadges} onCheckedChange={setNotifBadges} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-success" />
                        <div>
                          <div className="font-medium text-foreground">إشعارات النقاط</div>
                          <div className="text-sm text-muted-foreground">إشعار عند كسب نقاط جديدة</div>
                        </div>
                      </div>
                      <Switch checked={notifPoints} onCheckedChange={setNotifPoints} />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">المظهر</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center gap-3">
                        {darkMode ? <Moon className="w-5 h-5 text-accent" /> : <Sun className="w-5 h-5 text-warning" />}
                        <div>
                          <div className="font-medium text-foreground">الوضع الداكن</div>
                          <div className="text-sm text-muted-foreground">{darkMode ? "الوضع الداكن مفعل" : "الوضع الفاتح مفعل"}</div>
                        </div>
                      </div>
                      <Switch checked={darkMode} onCheckedChange={handleToggleDark} />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
