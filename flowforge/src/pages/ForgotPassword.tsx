import { useState } from "react";
import { api } from "../api/client";
import { toast } from "sonner";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
      toast.success("If an account exists with this email, you'll receive a reset link.");
    } catch {
      setSent(true);
      toast.success("If an account exists with this email, you'll receive a reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#f5f6fa] text-[#1a1b22] dark:bg-[#0b0d12] dark:text-[#f1f0fa]">
      <header className="px-8 py-6">
        <p className="font-display text-xl font-bold tracking-tight text-[#00288e] dark:text-[#b8c4ff]">
          FlowForge
        </p>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px] rounded-xl border border-[#e4e6eb] bg-white p-8 shadow-sm dark:border-[#2a2c38] dark:bg-[#15171f]">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dde1ff] dark:bg-[#1e40af]">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[#00288e] dark:text-[#b8c4ff]">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white">
              Reset Password
            </h1>
            <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-emerald-600 dark:text-emerald-400">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-base font-bold text-[#1a1b22] dark:text-white">Check your email</h2>
              <p className="mt-2 text-sm text-[#757684] dark:text-[#a8aab8]">
                If an account exists with <strong>{email}</strong>, we've sent a password reset link.
              </p>
              <button
                onClick={onBackToLogin}
                className="mt-6 w-full rounded-lg bg-[#00288e] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-[#3b52d9]"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2 text-sm text-[#1a1b22] placeholder-[#757684] outline-none transition-colors focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-white dark:placeholder-[#5a5c68] dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#00288e] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#3b52d9]"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          {!sent && (
            <p className="mt-5 text-center text-xs text-[#757684] dark:text-[#a8aab8]">
              Remember your password?{" "}
              <button
                type="button"
                onClick={onBackToLogin}
                className="font-bold text-[#00288e] hover:underline dark:text-[#b8c4ff]"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </main>

      <footer className="flex flex-col items-center justify-between gap-2 border-t border-[#e4e6eb] px-8 py-6 text-xs text-[#757684] sm:flex-row dark:border-[#2a2c38] dark:text-[#a8aab8]">
        <div className="flex gap-4">
          <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:underline">Privacy Policy</a>
          <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:underline">Terms of Service</a>
        </div>
        <p>&copy; 2024 FlowForge Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
