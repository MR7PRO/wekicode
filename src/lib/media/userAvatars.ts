import avatar1 from "@/assets/avatars/pro-1.jpg";
import avatar2 from "@/assets/avatars/pro-2.jpg";
import avatar3 from "@/assets/avatars/pro-3.jpg";
import avatar4 from "@/assets/avatars/pro-4.jpg";
import avatar5 from "@/assets/avatars/pro-5.jpg";
import avatar6 from "@/assets/avatars/pro-6.jpg";

const AVATARS = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6] as const;

const hashString = (input: string) => {
  // djb2
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
};

/**
 * Returns a stable, bundled avatar URL based on a seed (user_id/job_id/etc.).
 * This guarantees the same avatar across all hosting platforms.
 */
export const getUserAvatarSrc = (seed?: string | null) => {
  const key = (seed ?? "").trim();
  const index = hashString(key || "default") % AVATARS.length;
  return AVATARS[index];
};
