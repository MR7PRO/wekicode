import { Code2, Heart, MapPin, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Code2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-gradient-primary">wekicode</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              منصة وحاضنة أعمال للمبرمجين والطلاب في فلسطين. نوفر بيئة عمل متكاملة ومجتمع داعم للإبداع والتطوير.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>صنع بـ</span>
              <Heart className="w-4 h-4 text-destructive fill-destructive" />
              <span>في فلسطين</span>
              <span className="text-lg">🇵🇸</span>
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
                  المكافآت والنقاط
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
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 wekicode. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
