import { useEffect, useRef, useState } from "react";
import { loadCloud } from "../hooks/useAccount.js";
import { isDeviceLinked } from "../lib/storage.js";

const ERRORS = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/missing-password": "Enter your password.",
  "auth/weak-password": "Use at least 8 characters.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/too-many-requests": "Too many attempts. Please wait a minute and try again.",
  "auth/popup-closed-by-user": "Sign-in window was closed.",
  "auth/network-request-failed": "You appear to be offline.",
  "auth/requires-recent-login": "For security, sign out, sign back in, then try again.",
};
const message = (err) => ERRORS[err?.code] || "Something went wrong. Please try again.";

function AuthDialog({ onClose }) {
  const [mode, setMode] = useState("signin"); // signin | register | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef(null);

  useEffect(() => {
    const el = dialog.current;
    el.showModal();
    const close = () => onClose();
    el.addEventListener("close", close);
    return () => el.removeEventListener("close", close);
  }, [onClose]);

  const run = async (fn) => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await fn(await loadCloud());
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === "reset") {
      run(async (c) => {
        await c.resetPassword(email);
        setInfo("If an account exists for that email, a reset link is on its way.");
      });
    } else if (mode === "register") {
      if (password.length < 8) return setError(ERRORS["auth/weak-password"]);
      run(async (c) => {
        await c.registerWithEmail(email, password);
        dialog.current.close();
      });
    } else {
      run(async (c) => {
        await c.signInWithEmail(email, password);
        dialog.current.close();
      });
    }
  };

  const title = { signin: "Sign in", register: "Create an account", reset: "Reset password" }[mode];

  return (
    <dialog ref={dialog} className="dialog" aria-labelledby="auth-title">
      <div className="dialog-head">
        <h2 id="auth-title">{title}</h2>
        <button type="button" className="icon" aria-label="Close" onClick={() => dialog.current.close()}>
          ✕
        </button>
      </div>
      <p className="dialog-sub">Sync your habits across devices and keep them safe.</p>

      {mode !== "reset" && (
        <>
          <button
            type="button"
            className="btn btn-google"
            disabled={busy}
            onClick={() =>
              run(async (c) => {
                await c.signInWithGoogle();
                dialog.current.close();
              })
            }
          >
            <svg viewBox="0 0 48 48" aria-hidden="true" width="18" height="18">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.7 17.8 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.4-4.7 7l7.6 5.9c4.4-4.1 6.8-10.1 6.8-17.4z" />
              <path fill="#FBBC05" d="M10.6 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l8-6.2z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.2 0-11.5-4.2-13.4-9.9l-8 6.2C6.6 42.6 14.6 48 24 48z" />
            </svg>
            Continue with Google
          </button>
          <div className="divider"><span>or</span></div>
        </>
      )}

      <form onSubmit={submit} className="auth-form">
        <label>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {mode !== "reset" && (
          <label>
            Password
            <input
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              minLength={mode === "register" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        {info && <p className="form-info" role="status">{info}</p>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Please wait…" : mode === "register" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
        </button>
      </form>

      <div className="dialog-links">
        {mode === "signin" && (
          <>
            <button type="button" className="link" onClick={() => setMode("register")}>Create an account</button>
            <button type="button" className="link" onClick={() => setMode("reset")}>Forgot password?</button>
          </>
        )}
        {mode !== "signin" && (
          <button type="button" className="link" onClick={() => setMode("signin")}>Back to sign in</button>
        )}
      </div>
    </dialog>
  );
}

function AccountMenu({ user, sync, onClose }) {
  const ref = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const onDoc = (e) => !ref.current?.contains(e.target) && onClose();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const syncText = {
    synced: "All changes saved to your account",
    pending: "Saving… (will sync when online)",
    loading: "Syncing…",
    error: "Couldn't sync. Check your connection.",
  }[sync];

  return (
    <div className="menu" ref={ref} role="menu">
      <p className="menu-email" title={user.email}>{user.email}</p>
      {syncText && <p className={`menu-sync ${sync}`}>{syncText}</p>}
      <button type="button" role="menuitem" onClick={async () => (await loadCloud()).logOut()}>
        Sign out
      </button>
      <button
        type="button"
        role="menuitem"
        className="danger"
        onClick={async () => {
          if (!window.confirm("Permanently delete your account and all your habit data? This can't be undone.")) return;
          try {
            await (await loadCloud()).deleteAccount();
          } catch (err) {
            setError(message(err));
          }
        }}
      >
        Delete account and data
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default function Account({ account, sync }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { status, user } = account;

  if (status === "disabled" || status === "unverified") return null;
  if (status === "loading") return <span className="account-placeholder" aria-hidden="true" />;

  if (status === "signed-in") {
    const initial = (user.displayName || user.email || "?").trim()[0].toUpperCase();
    return (
      <div className="account">
        <span className={`sync-dot ${sync}`} title={sync === "synced" ? "Synced" : "Syncing"} aria-hidden="true" />
        <button
          type="button"
          className="avatar"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Account menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : initial}
        </button>
        {menuOpen && <AccountMenu user={user} sync={sync} onClose={() => setMenuOpen(false)} />}
      </div>
    );
  }

  return (
    <>
      <button type="button" className="btn btn-small" onClick={() => setDialogOpen(true)}>
        Sign in to sync
      </button>
      {dialogOpen && <AuthDialog onClose={() => setDialogOpen(false)} />}
    </>
  );
}

// Shown while a password account hasn't confirmed its email yet.
export function VerifyBanner({ account }) {
  const [note, setNote] = useState("");
  if (account.status !== "unverified") return null;
  return (
    <div className="banner" role="status">
      <span>
        Check <strong>{account.user.email}</strong> for a verification link. Your habits sync once it's confirmed.
      </span>
      <span className="banner-actions">
        <button
          type="button"
          className="link"
          onClick={async () => setNote((await account.refresh()) ? "" : "Not verified yet.")}
        >
          I've verified
        </button>
        <button
          type="button"
          className="link"
          onClick={async () => {
            try {
              await (await loadCloud()).resendVerification();
              setNote("Sent again.");
            } catch {
              setNote("Please wait a little before resending.");
            }
          }}
        >
          Resend
        </button>
        <button type="button" className="link" onClick={async () => (await loadCloud()).logOut()}>
          Sign out
        </button>
        {note && <span className="muted">{note}</span>}
      </span>
    </div>
  );
}

// Shown after signing out on a browser that has been linked to an account.
export function SignedOutBanner({ account }) {
  if (account.status !== "signed-out" || !isDeviceLinked()) return null;
  return (
    <div className="banner" role="status">
      <span>
        You're signed out. <strong>Your habits are safe in your account</strong>; sign in to see them. Changes
        made while signed out stay on this device only.
      </span>
    </div>
  );
}
