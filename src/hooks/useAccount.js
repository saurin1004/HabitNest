import { useEffect, useState } from "react";
import { cloudEnabled } from "../lib/config.js";

// Loads Firebase only when the app is configured for accounts.
let cloudPromise = null;
export const loadCloud = () => (cloudPromise ||= import("../lib/cloud.js"));

const isVerified = (user) =>
  !!user &&
  (user.emailVerified || user.providerData.some((p) => p.providerId === "google.com"));

// { status: "disabled" | "loading" | "signed-out" | "unverified" | "signed-in", user }
export function useAccount() {
  const [state, setState] = useState({
    status: cloudEnabled ? "loading" : "disabled",
    user: null,
  });

  useEffect(() => {
    if (!cloudEnabled) return undefined;
    let unsubscribe = () => {};
    let cancelled = false;
    loadCloud().then((cloud) => {
      if (cancelled) return;
      unsubscribe = cloud.onUser((user) =>
        setState({
          user,
          status: !user ? "signed-out" : isVerified(user) ? "signed-in" : "unverified",
        })
      );
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Re-check after the user clicks the link in their verification email.
  const refresh = async () => {
    const cloud = await loadCloud();
    const user = await cloud.refreshUser();
    setState({ user, status: isVerified(user) ? "signed-in" : "unverified" });
    return isVerified(user);
  };

  return { ...state, refresh };
}
