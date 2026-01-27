import { memo } from "react";

interface WCLogoProps {
  className?: string;
  size?: number;
}

export const WCLogo = memo(({ className = "", size = 32 }: WCLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WekiCode Logo"
    >
      <defs>
        <linearGradient id="wc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="wc-gradient-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      
      {/* Rounded square background */}
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="10"
        ry="10"
        fill="transparent"
        stroke="url(#wc-gradient)"
        strokeWidth="2"
      />
      
      {/* W letter */}
      <path
        d="M10 12L13 26L17 18L21 26L24 12"
        stroke="url(#wc-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* C letter */}
      <path
        d="M30 16C30 16 28 12 25 12C22 12 20 15 20 20C20 25 22 28 25 28C28 28 30 24 30 24"
        stroke="url(#wc-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
});

WCLogo.displayName = "WCLogo";
