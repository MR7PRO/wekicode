import { memo, lazy, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load below-the-fold sections
const PartnersSection = lazy(() => import("@/components/home/PartnersSection").then(m => ({ default: m.PartnersSection })));
const FeaturesSection = lazy(() => import("@/components/home/FeaturesSection").then(m => ({ default: m.FeaturesSection })));
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
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero is loaded immediately for LCP */}
        <HeroSection />
        
        {/* Below-the-fold content is lazy loaded */}
        <Suspense fallback={<SectionSkeleton />}>
          <PartnersSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <FeaturesSection />
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
    </div>
  );
});

Index.displayName = "Index";

export default Index;
