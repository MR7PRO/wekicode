// Advanced leveling system with exclusive perks per level

export interface LevelPerk {
  level: number;
  title: string;
  nameColor: string; // Tailwind gradient or color class
  nameColorStyle: string; // CSS for inline styling
  frameBorder: string; // CSS border/ring for avatar
  frameGlow: string; // CSS glow effect
  badge: string; // emoji or icon
  perks: string[];
}

export const LEVEL_PERKS: LevelPerk[] = [
  {
    level: 1,
    title: "مبتدئ",
    nameColor: "text-muted-foreground",
    nameColorStyle: "color: hsl(var(--muted-foreground))",
    frameBorder: "ring-2 ring-border",
    frameGlow: "",
    badge: "🌱",
    perks: ["الوصول الأساسي للمنصة"],
  },
  {
    level: 2,
    title: "متعلم",
    nameColor: "text-foreground",
    nameColorStyle: "color: hsl(var(--foreground))",
    frameBorder: "ring-2 ring-primary/50",
    frameGlow: "",
    badge: "📘",
    perks: ["إطار أزرق للصورة"],
  },
  {
    level: 3,
    title: "نشيط",
    nameColor: "text-primary",
    nameColorStyle: "color: hsl(var(--primary))",
    frameBorder: "ring-2 ring-primary",
    frameGlow: "shadow-[0_0_10px_hsl(187_85%_53%/0.3)]",
    badge: "⚡",
    perks: ["اسم بلون مميز", "إطار متوهج"],
  },
  {
    level: 5,
    title: "محترف",
    nameColor: "bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent",
    nameColorStyle: "background: linear-gradient(90deg, hsl(187,85%,53%), hsl(210,100%,60%)); -webkit-background-clip: text; -webkit-text-fill-color: transparent",
    frameBorder: "ring-3 ring-primary",
    frameGlow: "shadow-[0_0_20px_hsl(187_85%_53%/0.4)]",
    badge: "🔥",
    perks: ["اسم متدرج الألوان", "توهج قوي للإطار", "أولوية في الإجابات"],
  },
  {
    level: 8,
    title: "خبير",
    nameColor: "bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent",
    nameColorStyle: "background: linear-gradient(90deg, hsl(35,100%,55%), hsl(25,100%,50%)); -webkit-background-clip: text; -webkit-text-fill-color: transparent",
    frameBorder: "ring-3 ring-amber-400",
    frameGlow: "shadow-[0_0_25px_hsl(35_100%_55%/0.5)]",
    badge: "👑",
    perks: ["اسم ذهبي متدرج", "إطار ذهبي متوهج", "شارة تاج"],
  },
  {
    level: 10,
    title: "أسطورة",
    nameColor: "bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent",
    nameColorStyle: "background: linear-gradient(90deg, #c084fc, #ec4899, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent",
    frameBorder: "ring-4 ring-purple-400 animate-pulse",
    frameGlow: "shadow-[0_0_30px_hsl(270_80%_65%/0.5)]",
    badge: "🏆",
    perks: ["اسم بألوان قوس قزح", "إطار متحرك", "ظهور في أعلى المتصدرين"],
  },
  {
    level: 15,
    title: "إلهام",
    nameColor: "bg-gradient-to-r from-cyan-300 via-blue-500 to-purple-600 bg-clip-text text-transparent",
    nameColorStyle: "background: linear-gradient(90deg, #67e8f9, #3b82f6, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent",
    frameBorder: "ring-4 ring-cyan-400",
    frameGlow: "shadow-[0_0_40px_hsl(187_85%_53%/0.6),0_0_80px_hsl(270_80%_65%/0.3)]",
    badge: "💎",
    perks: ["إطار ماسي", "توهج مزدوج", "لقب حصري"],
  },
];

/**
 * Get the perk config for a given level (returns highest matching tier)
 */
export function getLevelPerk(level: number): LevelPerk {
  let matched = LEVEL_PERKS[0];
  for (const perk of LEVEL_PERKS) {
    if (level >= perk.level) matched = perk;
  }
  return matched;
}

/**
 * Get the next level perk the user hasn't reached yet
 */
export function getNextLevelPerk(level: number): LevelPerk | null {
  for (const perk of LEVEL_PERKS) {
    if (perk.level > level) return perk;
  }
  return null;
}

/**
 * Points needed per level (200 points per level)
 */
export function getPointsForLevel(level: number): number {
  return level * 200;
}
