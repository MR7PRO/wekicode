import { memo, lazy, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeroSection } from "@/components/home/HeroSection";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/seo/SEOHead";
import { HomeAnimator } from "@/components/home/HomeAnimator";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const AuthenticatedForumHome = lazy(() =>
  import("@/components/forums/AuthenticatedForumHome").then((m) => ({ default: m.AuthenticatedForumHome }))
);

// Lazy load below-the-fold sections
const PartnersSection = lazy(() => import("@/components/home/PartnersSection").then(m => ({ default: m.PartnersSection })));
const FeaturesSection = lazy(() => import("@/components/home/FeaturesSection").then(m => ({ default: m.FeaturesSection })));
const PlatformHighlights = lazy(() => import("@/components/home/PlatformHighlights").then(m => ({ default: m.PlatformHighlights })));
const PointsSection = lazy(() => import("@/components/home/PointsSection").then(m => ({ default: m.PointsSection })));
const RolesSection = lazy(() => import("@/components/home/RolesSection").then(m => ({ default: m.RolesSection })));
const WorkspaceSection = lazy(() => import("@/components/home/WorkspaceSection").then(m => ({ default: m.WorkspaceSection })));
const CTASection = lazy(() => import("@/components/home/CTASection").then(m => ({ default: m.CTASection })));

// Section loading skeleton
const SectionSkeleton = memo(() => (
  <div className="py-16 px-4">
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-96 mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  </div>
));

SectionSkeleton.displayName = "SectionSkeleton";

const Index = memo(() => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead
          title="موسوعة WekiCode — منتديات المبرمجين والفريلانسرز"
          description="منتديات، نقاشات، أسئلة، مقالات، فرص، أدوات، ومسارات تعلم — كل شيء منظم وقابل للبحث."
          path="/"
        />
        <Navbar />
        <main>
          <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <AuthenticatedForumHome />
          </Suspense>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="wekicode — حاضنة أعمال للمبرمجين في فلسطين"
        description="منصة فلسطينية للمبرمجين والطلاب: أسئلة، مقالات، وظائف، دورات، ومكافآت. ابدأ رحلتك التقنية معنا."
        path="/"
      />
      <Navbar />
      <main>
        {/* Hero is loaded immediately for LCP */}
        <HeroSection />
        <HomeAnimator />
        
        {/* Below-the-fold content is lazy loaded */}
        <Suspense fallback={<SectionSkeleton />}>
          <PartnersSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <FeaturesSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <PlatformHighlights />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <PointsSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <RolesSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <WorkspaceSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <CTASection />
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
});

Index.displayName = "Index";

export default Index;
