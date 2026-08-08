import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { SEOHead } from "@/components/seo/SEOHead";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useAuth } from "@/contexts/AuthContext";
import { useFeature } from "@/hooks/useFeatureFlags";

export default function Onboarding() {
  const { user, loading } = useAuth();
  const { enabled } = useFeature("onboarding");
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="إعداد حسابك — WekiCode" description="جهّز تجربتك في مجتمع WekiCode" path="/onboarding" noindex />
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !enabled ? (
          <p className="text-center text-sm text-muted-foreground py-20">هذه الميزة غير مفعلة حاليًا.</p>
        ) : (
          <OnboardingFlow />
        )}
      </main>
    </div>
  );
}