import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface LoginProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function Login({ onSwitchToRegister, onSwitchToForgotPassword }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    login({ email: email.trim(), password, rememberMe })
      .catch((err) => {
        const message =
          err.response?.data?.message ?? "Couldn't sign in. Please try again.";
        setError(message);
      })
      .finally(() => setLoading(false));
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
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white">
              Welcome Back
            </h1>
            <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
              Sign in to continue to your dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/auth/google`}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#e4e6eb] bg-white py-2.5 text-sm font-medium text-[#1a1b22] transition-colors hover:bg-gray-50 dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-white dark:hover:bg-[#1e202b]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.465 1.921 15.56 1 12.24 1 5.92 1 1 5.92 1 12.24s4.92 11.24 11.24 11.24c6.6 0 11-4.606 11-11.24 0-.756-.08-1.334-.18-1.955H12.24z"/>
              </svg>
              Google
            </a>
            <a
              href={`${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/auth/github`}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#e4e6eb] bg-white py-2.5 text-sm font-medium text-[#1a1b22] transition-colors hover:bg-gray-50 dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-white dark:hover:bg-[#1e202b]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              GitHub
            </a>
          </div>

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e4e6eb] dark:border-[#2a2c38]"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] font-bold tracking-wider text-[#757684] uppercase dark:bg-[#15171f] dark:text-[#a8aab8]">
              OR EMAIL
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2.5 text-sm text-[#1a1b22] placeholder-[#757684] outline-none transition-colors focus:border-[#00288e] focus:ring-2 focus:ring-[#00288e]/10 dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-white dark:placeholder-[#5a5c68] dark:focus:border-[#b8c4ff] dark:focus:ring-[#b8c4ff]/10"
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onSwitchToForgotPassword}
                  className="text-[10px] font-bold text-[#00288e] hover:underline dark:text-[#b8c4ff]"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#1a1b22] placeholder-[#757684] outline-none transition-colors focus:border-[#00288e] focus:ring-2 focus:ring-[#00288e]/10 dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-white dark:placeholder-[#5a5c68] dark:focus:border-[#b8c4ff] dark:focus:ring-[#b8c4ff]/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757684] hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:text-white"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M14.12 14.12A3 3 0 019.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[#e4e6eb] text-[#00288e] outline-none focus:ring-[#00288e]/10 dark:border-[#2a2c38]"
              />
              <label htmlFor="remember-me" className="text-xs font-medium text-[#757684] dark:text-[#a8aab8]">
                Remember me for 21 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-[#00288e] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#001e70] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#3b52d9] dark:hover:bg-[#2d42b8]"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#757684] dark:text-[#a8aab8]">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-bold text-[#00288e] hover:underline dark:text-[#b8c4ff]"
            >
              Create an account
            </button>
          </p>
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
