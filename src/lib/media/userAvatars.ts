// Bundled avatars from randomuser.me — downloaded locally for cross-platform reliability
import ruM1 from "@/assets/avatars/ru-m1.jpg";
import ruW1 from "@/assets/avatars/ru-w1.jpg";
import ruM2 from "@/assets/avatars/ru-m2.jpg";
import ruW2 from "@/assets/avatars/ru-w2.jpg";
import ruM3 from "@/assets/avatars/ru-m3.jpg";
import ruW3 from "@/assets/avatars/ru-w3.jpg";
import ruM4 from "@/assets/avatars/ru-m4.jpg";
import ruW4 from "@/assets/avatars/ru-w4.jpg";
import ruM5 from "@/assets/avatars/ru-m5.jpg";
import ruW5 from "@/assets/avatars/ru-w5.jpg";
import ruM6 from "@/assets/avatars/ru-m6.jpg";
import ruW6 from "@/assets/avatars/ru-w6.jpg";
import ruM7 from "@/assets/avatars/ru-m7.jpg";
import ruW7 from "@/assets/avatars/ru-w7.jpg";
import ruM8 from "@/assets/avatars/ru-m8.jpg";
import ruW8 from "@/assets/avatars/ru-w8.jpg";

// 16 diverse, realistic avatars — alternating male/female for maximum variety
const AVATARS = [
  ruM1, ruW1, ruM2, ruW2,
  ruM3, ruW3, ruM4, ruW4,
  ruM5, ruW5, ruM6, ruW6,
  ruM7, ruW7, ruM8, ruW8,
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
 * Uses combined string for variety to ensure different people get different avatars.
 */
export const getUserAvatarByName = (name?: string | null, secondarySeed?: string | null) => {
  const combinedSeed = `${name || ""}-${secondarySeed || ""}`.trim();
  const index = hashString(combinedSeed || "default") % AVATARS.length;
  return AVATARS[index];
};
