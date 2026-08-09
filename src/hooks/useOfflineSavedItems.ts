import { useCallback, useEffect, useState } from "react";
import {
  clearOfflineItems,
  readOfflineItems,
  removeOfflineItem,
  saveOfflineItem,
  type OfflineItem,
  type OfflineItemType,
} from "@/pwa/pwaUtils";

export function useOfflineSavedItems() {
  const [items, setItems] = useState<OfflineItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readOfflineItems());
    sync();
    window.addEventListener("wekicode:offline-items-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("wekicode:offline-items-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((item: Omit<OfflineItem, "savedAt">) => saveOfflineItem(item), []);
  const remove = useCallback((id: string, type: OfflineItemType) => removeOfflineItem(id, type), []);
  const clear = useCallback(() => clearOfflineItems(), []);

  return { items, save, remove, clear };
}