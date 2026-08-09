import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function bufToBase64(buf: ArrayBuffer | null) {
  if (!buf) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export function usePushNotifications() {
  const { user } = useAuth();
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  const configured = supported && VAPID_PUBLIC_KEY.length > 0;

  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : "denied",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSubscribed(false));
  }, [supported]);

  /** Only ever called from an explicit user click. */
  const enable = useCallback(async (): Promise<{ ok: boolean; reason?: string }> => {
    if (!supported) return { ok: false, reason: "unsupported" };
    if (!user) return { ok: false, reason: "auth" };
    if (!configured) return { ok: false, reason: "not_configured" };
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return { ok: false, reason: "denied" };
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      const json = sub.toJSON() as { keys?: { p256dh?: string; auth?: string } };
      await (supabase as any).from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? bufToBase64(sub.getKey("p256dh")),
          auth: json.keys?.auth ?? bufToBase64(sub.getKey("auth")),
          user_agent: navigator.userAgent.slice(0, 200),
          is_active: true,
        },
        { onConflict: "endpoint" },
      );
      await (supabase as any)
        .from("notification_preferences")
        .upsert({ user_id: user.id, push_enabled: true }, { onConflict: "user_id" });
      setSubscribed(true);
      return { ok: true };
    } catch {
      return { ok: false, reason: "error" };
    } finally {
      setBusy(false);
    }
  }, [supported, configured, user]);

  const disable = useCallback(async () => {
    if (!supported || !user) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await (supabase as any)
          .from("push_subscriptions")
          .update({ is_active: false })
          .eq("endpoint", sub.endpoint)
          .eq("user_id", user.id);
        await sub.unsubscribe();
      }
      await (supabase as any)
        .from("notification_preferences")
        .upsert({ user_id: user.id, push_enabled: false }, { onConflict: "user_id" });
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, [supported, user]);

  return { supported, configured, permission, subscribed, busy, enable, disable };
}