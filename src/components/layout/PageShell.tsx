import { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { SEOHead } from "@/components/seo/SEOHead";

interface Props {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
  children: ReactNode;
  width?: "narrow" | "wide";
}

export function PageShell({ title, description, path, noindex, children, width = "wide" }: Props) {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEOHead title={title} description={description} path={path} noindex={noindex} />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className={`container mx-auto px-4 ${width === "narrow" ? "max-w-3xl" : "max-w-6xl"}`}>
          {children}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
