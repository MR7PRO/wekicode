import { useState } from "react";
import wekicodeLogo from "@/assets/wekicode-logo-new.png";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  alt?: string;
}

/**
 * Platform logo mark. If the image ever fails to load (offline, stale service
 * worker cache, blocked request) it degrades to a styled "WC" monogram instead
 * of a broken-image icon, so the header/footer/auth branding always renders.
 */
export const BrandLogo = ({ className, alt = "WekiCode" }: BrandLogoProps) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground font-black leading-none",
          className,
        )}
      >
        <span className="text-[0.6em]">WC</span>
      </span>
    );
  }

  return (
    <img
      src={wekicodeLogo}
      alt={alt}
      width={480}
      height={320}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export default BrandLogo;