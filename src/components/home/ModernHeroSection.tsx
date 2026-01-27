import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { memo } from "react";

export const ModernHeroSection = memo(() => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[hsl(222,47%,6%)] pt-16">
      {/* Tech Grid Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* Noise Texture Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Animated Radial Glow Behind Headline */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-40 motion-reduce:animate-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.15) 40%, transparent 70%)',
            animation: 'pulse-glow-hero 4s ease-in-out infinite',
          }}
        />
        
        {/* Floating Blur Orb - Top Right */}
        <div 
          className="absolute top-20 right-20 w-72 h-72 rounded-full blur-3xl opacity-30 motion-reduce:animate-none"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.4), rgba(59, 130, 246, 0.4))',
            animation: 'float-orb 8s ease-in-out infinite',
          }}
        />
        
        {/* Floating Blur Orb - Bottom Left */}
        <div 
          className="absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-25 motion-reduce:animate-none"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(59, 130, 246, 0.3))',
            animation: 'float-orb 10s ease-in-out infinite reverse',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(222,30%,14%)]/80 border border-[hsl(222,30%,18%)] mb-8 animate-fade-in backdrop-blur-sm">
            <span className="text-lg">🇵🇸</span>
            <span className="text-sm font-medium text-[hsl(215,20%,65%)]">Made in Palestine — From Gaza to the World</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6 animate-slide-up text-white">
            Build the Future with{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                WekiCode
              </span>
              {/* Underline glow effect */}
              <span 
                className="absolute -bottom-2 left-0 right-0 h-1 rounded-full opacity-60"
                style={{
                  background: 'linear-gradient(90deg, #22D3EE, #3B82F6, #8B5CF6)',
                  filter: 'blur(4px)',
                }}
              />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[hsl(215,20%,65%)] max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            A Palestinian tech hub in Gaza providing students and freelancers with workspace, fast internet, job opportunities, knowledge sharing, and an interactive points system.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            {/* Primary Gradient Glow Button */}
            <Link to="/jobs">
              <Button 
                size="lg"
                className="relative bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-semibold px-8 py-6 text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            
            {/* Secondary Glass Outline Button */}
            <Link to="/courses">
              <Button 
                size="lg"
                variant="outline"
                className="relative bg-transparent border-2 border-[hsl(222,30%,25%)] text-white font-semibold px-8 py-6 text-lg rounded-xl transition-all duration-300 hover:bg-[hsl(222,30%,14%)]/50 hover:border-[hsl(215,20%,40%)] backdrop-blur-sm"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto mt-16 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {[
              { value: "15K+", label: "Active Developers" },
              { value: "2.5K+", label: "Job Opportunities" },
              { value: "500+", label: "Learning Resources" },
              { value: "50M+", label: "Points Distributed" },
            ].map((stat, index) => (
              <div 
                key={index}
                className="group relative p-4 md:p-6 rounded-2xl bg-[hsl(222,30%,10%)]/50 border border-[hsl(222,30%,18%)]/50 backdrop-blur-sm transition-all duration-300 hover:border-[hsl(222,30%,25%)] hover:bg-[hsl(222,30%,12%)]/50"
              >
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-[hsl(215,20%,55%)] mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce motion-reduce:animate-none">
        <div className="w-6 h-10 rounded-full border-2 border-[hsl(222,30%,30%)] flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Custom Keyframes */}
      <style>{`
        @keyframes pulse-glow-hero {
          0%, 100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
        
        @keyframes float-orb {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-25px) translateX(5px);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .motion-reduce\\:animate-none {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
});

ModernHeroSection.displayName = "ModernHeroSection";
