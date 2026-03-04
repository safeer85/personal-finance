"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isCredentialLoading, setIsCredentialLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleCredentialsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setFormError("Enter both email and password.");
      return;
    }

    setFormError(null);
    setIsCredentialLoading(true);

    const result = await signIn("credentials", {
      email: normalizedEmail,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });

    setIsCredentialLoading(false);

    if (result?.error) {
      setFormError("Email or password is incorrect.");
      return;
    }

    router.push(result?.url ?? "/dashboard");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setFormError(null);
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
    setIsGoogleLoading(false);
  }

  const showError = formError;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f2f4ef] font-[family-name:var(--font-geist-sans)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#2f7667]/18 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-[#d4a53a]/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.75),rgba(255,255,255,0.4))]" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-xl items-start px-4 pt-12 pb-8 sm:px-6 sm:pt-16">
        <div className="w-full">
          <h1
            className="mb-5 text-center text-4xl leading-tight font-[family-name:var(--font-geist-mono)] font-semibold text-slate-900 sm:text-5xl"
            style={{ animation: "login-panel-enter 650ms ease-out both" }}
          >
            Personal Finance Tracker
          </h1>

          <section
            className="w-full rounded-3xl border border-black/10 bg-white/92 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.16)] backdrop-blur-sm sm:p-8"
            style={{ animation: "login-panel-enter 650ms 90ms ease-out both" }}
          >
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#2f7667]">
              Sign in to continue
            </p>

            {showError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {showError}
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={handleCredentialsSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-[#2f7667] focus:ring-2 focus:ring-[#2f7667]/20"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={isCredentialLoading || isGoogleLoading}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-[#2f7667] focus:ring-2 focus:ring-[#2f7667]/20"
                  placeholder="Enter password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isCredentialLoading || isGoogleLoading}
                />
              </div>

              <button
                className="w-full rounded-xl bg-[#112033] px-4 py-2.5 font-medium text-white transition hover:bg-[#1a304d] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCredentialLoading || isGoogleLoading}
              >
                {isCredentialLoading ? "Signing in..." : "Sign in with Email"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                or
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleGoogleSignIn}
              disabled={isCredentialLoading || isGoogleLoading}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#EA4335"
                  d="M9 7.2v3.67h5.1c-.22 1.18-.9 2.18-1.9 2.85l3.07 2.38C17.06 14.45 18 11.97 18 9.2c0-.67-.06-1.31-.17-1.93H9Z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.17l-3.07-2.38c-.85.57-1.94.92-2.89.92-2.22 0-4.1-1.5-4.77-3.52L1.07 13.3A9 9 0 0 0 9 18Z"
                />
                <path
                  fill="#4A90E2"
                  d="M4.23 10.85A5.41 5.41 0 0 1 3.96 9c0-.64.11-1.26.27-1.85L1.07 4.7A9 9 0 0 0 0 9c0 1.45.35 2.82 1.07 4.3l3.16-2.45Z"
                />
                <path
                  fill="#FBBC05"
                  d="M9 3.58c1.32 0 2.5.45 3.43 1.34l2.57-2.57C13.46.92 11.43 0 9 0A9 9 0 0 0 1.07 4.7l3.16 2.45C4.9 5.08 6.78 3.58 9 3.58Z"
                />
              </svg>
              {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
            </button>
          </section>
        </div>
      </main>

      <style>{`
        @keyframes login-panel-enter {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
