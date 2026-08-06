import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

/** Route prefixes that must never be indexed (private / app-only screens). */
const PRIVATE_PREFIXES = [
  "/auth",
  "/profile",
  "/settings",
  "/messages",
  "/bookmarks",
  "/notifications",
  "/moderation",
  "/billing",
  "/rewards",
  "/forums/new",
];

export function PrivateRouteNoIndex() {
  const { pathname } = useLocation();
  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isPrivate) return null;
  return (
    <Helmet>
      <meta name="robots" content="noindex,nofollow" />
    </Helmet>
  );
}
