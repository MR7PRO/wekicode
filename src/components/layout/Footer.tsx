import { Heart, MapPin, Mail, Phone, Github, Linkedin, Twitter, Facebook, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { forwardRef, useState } from "react";
import wekicodeLogo from "@/assets/wekicode-logo-new.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("الرجاء إدخال بريد إلكتروني صالح");
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any)
      .from("newsletter_subscribers")
      .insert({ email: value, source: "footer" });
    setSubmitting(false);
    if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
      toast.error("تعذر الاشتراك، حاول لاحقاً");
      return;
    }
    setSubscribed(true);
    setEmail("");
    toast.success("تم الاشتراك بالنشرة بنجاح ✨");
  };

  return (
    <footer ref={ref} className="bg-card border-t border-border/50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
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
            <p className="text-muted-foreground text-sm mb-4">
              منصة وحاضنة أعمال للمبرمجين والطلاب في فلسطين. نوفر بيئة عمل متكاملة ومجتمع داعم للإبداع والتطوير.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <span>صنع بـ</span>
              <Heart className="w-4 h-4 text-destructive fill-destructive" />
              <span>في فلسطين</span>
              <span className="text-lg">🇵🇸</span>
            </div>
            {/* Social links */}
            <div className="flex items-center gap-2">
              <a href="https://github.com/wekicode" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="w-9 h-9 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com/company/wekicode" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-9 h-9 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://twitter.com/wekicode" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="w-9 h-9 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://facebook.com/wekicode" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/questions" className="text-muted-foreground hover:text-primary transition-colors">
                  الأسئلة والأجوبة
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="text-muted-foreground hover:text-primary transition-colors">
                  فرص العمل
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-muted-foreground hover:text-primary transition-colors">
                  المواد التعليمية
                </Link>
              </li>
              <li>
                <Link to="/rewards" className="text-muted-foreground hover:text-primary transition-colors">
                  المكافئات والنقاط
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-foreground mb-4">خدماتنا</h4>
            <ul className="space-y-2">
              <li className="text-muted-foreground">وورك سبيس مجهز</li>
              <li className="text-muted-foreground">كهرباء وإنترنت سريع</li>
              <li className="text-muted-foreground">فرص عمل حر</li>
              <li className="text-muted-foreground">دورات تدريبية</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-foreground mb-4">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>غزة، فلسطين</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@wekicode.ps</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span>+970 59 123 4567</span>
              </li>
            </ul>

            {/* Newsletter */}
            <div className="mt-6">
              <h4 className="font-bold text-foreground mb-2 text-sm">النشرة البريدية</h4>
              <p className="text-xs text-muted-foreground mb-3">احصل على آخر الأخبار والفرص</p>
              {subscribed ? (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم الاشتراك بنجاح</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="بريدك الإلكتروني"
                    className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center"
                    aria-label="اشترك"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>© 2024 wekicode. جميع الحقوق محفوظة.</p>
          <a
            href="https://wekicode.lovable.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success border border-success/20 text-xs font-medium hover:bg-success/20 transition"
          >
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            جميع الأنظمة تعمل
          </a>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
