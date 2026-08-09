import { useEffect, useState } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  return { isOnline, wasOffline, resetWasOffline: () => setWasOffline(false) };
}