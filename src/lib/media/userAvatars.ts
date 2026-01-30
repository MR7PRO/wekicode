import avatar1 from "@/assets/avatars/pro-1.jpg";
import avatar2 from "@/assets/avatars/pro-2.jpg";
import avatar3 from "@/assets/avatars/pro-3.jpg";
import avatar4 from "@/assets/avatars/pro-4.jpg";
import avatar5 from "@/assets/avatars/pro-5.jpg";
import avatar6 from "@/assets/avatars/pro-6.jpg";

const AVATARS = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6] as const;

/**
 * djb2 hashing for string → stable integer
 */
const hashString = (input: string) => {
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

/**
 * Returns a stable, bundled avatar URL based on name + secondary seed.
 * Uses name for variety to ensure different people get different avatars.
 */
export const getUserAvatarByName = (name?: string | null, secondarySeed?: string | null) => {
  // Combine name with secondary seed to maximize variety
  const combinedSeed = `${name || ""}-${secondarySeed || ""}`.trim();
  const index = hashString(combinedSeed || "default") % AVATARS.length;
  return AVATARS[index];
};
