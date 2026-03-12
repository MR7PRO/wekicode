import avatar1 from "@/assets/avatars/pro-1.jpg";
import avatar2 from "@/assets/avatars/pro-2.jpg";
import avatar3 from "@/assets/avatars/pro-3.jpg";
import avatar4 from "@/assets/avatars/pro-4.jpg";
import avatar5 from "@/assets/avatars/pro-5.jpg";
import avatar6 from "@/assets/avatars/pro-6.jpg";
import avatar7 from "@/assets/avatars/pro-7.jpg";
import avatar8 from "@/assets/avatars/pro-8.jpg";
import avatar9 from "@/assets/avatars/pro-9.jpg";
import avatar10 from "@/assets/avatars/pro-10.jpg";
import avatar11 from "@/assets/avatars/pro-11.jpg";
import avatar12 from "@/assets/avatars/pro-12.jpg";

const AVATARS = [
  avatar1, avatar2, avatar3, avatar4, avatar5, avatar6,
  avatar7, avatar8, avatar9, avatar10, avatar11, avatar12,
] as const;

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
  const combinedSeed = `${name || ""}-${secondarySeed || ""}`.trim();
  const index = hashString(combinedSeed || "default") % AVATARS.length;
  return AVATARS[index];
};
