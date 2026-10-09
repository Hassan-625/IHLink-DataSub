import {isNativeApp,nativeOAuthEnabled} from '@/lib/nativeAuth';
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AuthShell } from "./AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

function safeDestination(search: string, state: unknown) {
  const stateFrom = (state as { from?: string } | null)?.from;
  const queryNext = new URLSearchParams(search).get("next");
  const candidate = queryNext || stateFrom;

  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    ["/", "/signin", "/register"].includes(candidate)
  ) {
    return null;
  }

  return candidate;
}

export function SignInPage() {
  const { signIn, signInWithGoogle, configured, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);

  const authNotice = (
    location.state as { authNotice?: string } | null
  )?.authNotice;

  useEffect(() => {
    if (!user) return;

    const next =
      safeDestination(location.search, location.state) ||
      sessionStorage.getItem("ih_auth_next");

    sessionStorage.removeItem("ih_auth_next");

    navigate(next || "/account", {
      replace: true,
    });
  }, [
    user,
    location.search,
    location.state,
    navigate,
  ]);

  async function submit(event: FormEvent) {
    event.preventDefault();

    setBusy(true);
    setError(null);

    let message: string | null = null;

    try {
      message = await Promise.race([
        signIn(email, password),

        new Promise<string>((resolve) =>
          window.setTimeout(
            () =>
              resolve(
                "Sign-in is taking longer than expected. Please check your connection and try again.",
              ),
            15000,
          ),
        ),
      ]);
    } catch {
      message = "Unable to complete sign-in. Please try again.";
    } finally {
      setBusy(false);
    }

    if (message) {
      setError(message);
      return;
    }

    if (rememberDevice) {
      localStorage.setItem("ih_remember_device", "1");
    } else {
      localStorage.removeItem("ih_remember_device");
    }

    const next = safeDestination(
      location.search,
      location.state,
    );

    sessionStorage.removeItem("ih_auth_next");

    navigate(next || "/account", {
      replace: true,
    });
  }

  async function handleGoogleSignIn() {
    const next = safeDestination(
      location.search,
      location.state,
    );

    if (next) {
      sessionStorage.setItem("ih_auth_next", next);
    }

    if (rememberDevice) {
      localStorage.setItem("ih_remember_device", "1");
    } else {
      localStorage.removeItem("ih_remember_device");
    }

    setBusy(true);
    setError(null);

    try {
      const message = await signInWithGoogle();

      if (message) {
        setError(message);
      }
    } catch {
      setError(
        "Unable to start Google sign-in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your IHLink DataSub account."
    >

      {authNotice && (
        <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          {authNotice}
        </p>
      )}

      <form
        className="space-y-4"
        onSubmit={submit}
      >
        <Input
          required
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          label="Email address"
          type="email"
          autoComplete="email"
          leftIcon={
            <Mail className="h-4 w-4" />
          }
          placeholder="name@example.com"
        />

        <Input
          required
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          leftIcon={
            <Lock className="h-4 w-4" />
          }
          rightIcon={
            <button
              type="button"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              onClick={() =>
                setShowPassword((value) => !value)
              }
              className="rounded p-1 hover:bg-gray-100"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          placeholder="Enter your password"
        />

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600"
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(event) =>
                setRememberDevice(
                  event.target.checked,
                )
              }
              className="h-4 w-4 rounded border-gray-300"
            />

            Remember this device
          </label>

          <Link
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
            to="/reset-password"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          disabled={busy}
          fullWidth
          size="lg"
          themeClass="bg-emerald-600 hover:bg-emerald-700"
        >
          {busy ? "Signing in…" : "Sign In"}
        </Button>

        {(!isNativeApp()||nativeOAuthEnabled)&&<button
          disabled={busy}
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full rounded-xl border py-3 text-sm font-semibold transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue with Google
        </button>}

        <p className="text-center text-sm text-muted">
          New to IHLink DataSub?{" "}
          <Link
            to="/register"
            className="font-bold text-emerald-600 hover:text-emerald-700"
          >
            Create account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}