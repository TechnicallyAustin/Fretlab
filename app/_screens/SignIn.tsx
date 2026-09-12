"use client";

/**
 * App Template Contract v1 §5 — L1 screen.
 *
 * §1 Identity: sign up, sign in, sign out. One screen, because under
 * `AUTH_MODE=oidc` there is nothing to choose: the server returns an authorize
 * URL and the browser follows it. The form only appears in local mode.
 */
import { useState } from "react";
import type { View } from "@/lib/fretlab/types";
import { AppHeader } from "@/components/fretlab/AppHeader";
import { StateNotice } from "@/components/fretlab/StateNotice";
import { api, ApiClientError } from "@/lib/api/client";
import { useSession } from "@/lib/api/hooks";

type Mode = "signin" | "register";

export function SignIn({ go }: { go: (view: View) => void }) {
  const session = useSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiClientError | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "register") {
        await api.register(email, password, displayName);
      } else {
        const result = await api.login(email, password);
        // §2 oidc: the server hands back an authorize URL and the browser
        // follows it. The frontend never learns which mode is running.
        if (result.authorize_url) {
          window.location.href = result.authorize_url;
          return;
        }
      }
      session.reload();
      go("progress");
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught
          : new ApiClientError("internal_error", "Something failed on our side. Try again in a moment.", 0),
      );
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      const result = await api.logout();
      if (result.end_session_url) {
        window.location.href = result.end_session_url;
        return;
      }
      session.reload();
    } finally {
      setBusy(false);
    }
  };

  if (session.status === "loading") {
    return (
      <div className="screen-content">
        <AppHeader title="Your account" meta="Identity" />
        <StateNotice tone="loading" title="Checking your session" />
      </div>
    );
  }

  if (session.status === "error") {
    return (
      <div className="screen-content">
        <AppHeader title="Your account" meta="Identity" />
        <StateNotice
          tone="error"
          title="Your session could not be checked"
          detail={session.error.message}
          actionLabel="Try again"
          onAction={session.reload}
        />
      </div>
    );
  }

  if (session.data) {
    return (
      <div className="screen-content account-screen">
        <AppHeader title="Your account" meta="Identity" />
        <section className="account-card">
          <p className="kicker">Signed in</p>
          <h2>{session.data.display_name}</h2>
          <p>{session.data.email}</p>
          <dl className="account-facts">
            <div>
              <dt>Role</dt>
              <dd>{session.data.role}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{session.data.email_verified_at ? "Verified" : "Not verified yet"}</dd>
            </div>
          </dl>
          <div className="account-actions">
            <button type="button" onClick={() => go("progress")}>
              See your progress
            </button>
            <button type="button" className="text-action" onClick={signOut} disabled={busy}>
              {busy ? "Signing out" : "Sign out"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="screen-content account-screen">
      <AppHeader title="Your account" meta="Identity" />
      <section className="account-card">
        <p className="kicker">{mode === "signin" ? "Sign in" : "Create an account"}</p>
        <h2>Keep your practice history</h2>
        <p>
          Sessions are saved to your account, so your streak and accuracy follow you between
          devices.
        </p>

        <form onSubmit={submit} className="account-form" noValidate>
          {mode === "register" && (
            <label>
              <span>Your name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
                required
              />
              {error?.field === "display_name" && <em className="field-error">{error.message}</em>}
            </label>
          )}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
            {error?.field === "email" && <em className="field-error">{error.message}</em>}
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
            />
            {error?.field === "password" && <em className="field-error">{error.message}</em>}
          </label>

          {error && !error.field && (
            <StateNotice tone="error" title="That did not work" detail={error.message} />
          )}

          <button type="submit" disabled={busy}>
            {busy
              ? mode === "signin"
                ? "Signing in"
                : "Creating your account"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <button
          type="button"
          className="text-action"
          onClick={() => {
            setMode(mode === "signin" ? "register" : "signin");
            setError(null);
          }}
        >
          {mode === "signin" ? "Create an account instead" : "I already have an account"}
        </button>
      </section>
    </div>
  );
}
