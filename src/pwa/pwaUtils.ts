/** Local (device-only) offline library. Public content only — never private data. */
export type OfflineItemType = "topic" | "article" | "knowledge";

export interface OfflineItem {
  id: string;
  type: OfflineItemType;
  title: string;
  url: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
  author?: string;
  savedAt: string;
}

const KEY = "wekicode.offline.items.v1";

export function readOfflineItems(): OfflineItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OfflineItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: OfflineItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 120)));
  } catch {
    /* quota exceeded — ignore */
  }
  window.dispatchEvent(new CustomEvent("wekicode:offline-items-changed"));
}

export function saveOfflineItem(item: Omit<OfflineItem, "savedAt">): OfflineItem {
  const entry: OfflineItem = { ...item, savedAt: new Date().toISOString() };
  const rest = readOfflineItems().filter((i) => !(i.id === item.id && i.type === item.type));
  write([entry, ...rest]);
  return entry;
}

export function removeOfflineItem(id: string, type: OfflineItemType) {
  write(readOfflineItems().filter((i) => !(i.id === id && i.type === type)));
}

export function clearOfflineItems() {
  write([]);
}

export function isOfflineSaved(id: string, type: OfflineItemType): boolean {
  return readOfflineItems().some((i) => i.id === id && i.type === type);
}

/** Clears service-worker caches owned by this app (used by the app settings page). */
export async function clearAppCaches(): Promise<number> {
  if (!("caches" in window)) return 0;
  const names = await caches.keys();
  const own = names.filter((n) => /precache|runtime|public-pages|images-cache|fonts-cache|storage-images/.test(n));
  await Promise.allSettled(own.map((n) => caches.delete(n)));
  return own.length;
}

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}