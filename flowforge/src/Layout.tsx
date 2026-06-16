import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./context/AuthContext";
import { api } from "./api/client";

export type Page = "dashboard" | "board" | "team" | "settings";

interface LayoutProps {
  page: Page;
  onNavigate: (page: Page) => void;
  searchPlaceholder: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  children: ReactNode;
  onNewProject?: () => void;
}

const NAV_ITEMS: { id: Page; label: string; icon: ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: "board",
    label: "Projects",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 10h18M9 5v14" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: "team",
    label: "Team",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M3 20c0-3.3 2.7-6 6-6M14 20c0-2.5 1.8-4.5 4-5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    ),
  },
];

export default function Layout({
  page,
  onNavigate,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  children,
  onNewProject,
}: LayoutProps) {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : user?.email
    ? user.email.split("@")[0].slice(0, 2).toUpperCase()
    : "??";

  const displayName = user?.name || (user?.email ? user.email.split("@")[0] : "Alex Rivera");

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#1a1b22] dark:bg-[#0f1117] dark:text-[#f1f0fa]">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-[#e2e8f0] bg-white px-5 py-6 dark:border-[#2a2c38] dark:bg-[#15171f]">
        <div>
          {/* Logo */}
          <div className="mb-6 flex items-center gap-3 px-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00288e] text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
                <path d="M9 9h6v6H9z" fill="currentColor" />
              </svg>
            </div>
            <div>
              <p className="font-display text-[15px] font-bold leading-tight text-[#00288e] dark:text-[#b8c4ff]">
                FlowForge
              </p>
              <p className="text-[10px] font-semibold tracking-wide text-[#757684] uppercase dark:text-[#a8aab8]">
                Enterprise PM
              </p>
            </div>
          </div>

          {/* New Project Button */}
          <button
            type="button"
            onClick={onNewProject}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00288e] py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-[#3b52d9]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            New Project
          </button>

          {/* Navigation */}
          <nav className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = item.id === page;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                    active
                      ? "bg-[#dde1ff] text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]"
                      : "text-[#757684] hover:bg-[#f1f5f9] hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:bg-[#1a1c26] dark:hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Storage & Theme) */}
        <div className="flex flex-col gap-4">
          {/* Storage Usage Card */}
          <div className="rounded-xl border border-[#dde1ff] bg-[#f0f2ff] p-4 dark:border-[#2a2c38] dark:bg-[#1a1c26]">
            <p className="text-xs font-bold text-[#001453] dark:text-[#dde1ff]">
              Storage Usage
            </p>
            <div className="mt-2.5 h-2 w-full rounded-full bg-[#dde1ff] dark:bg-[#2a2c38]">
              <div
                className="h-full rounded-full bg-[#00288e] dark:bg-[#b8c4ff]"
                style={{ width: "75%" }}
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold text-[#001453]/70 dark:text-[#a8aab8]">
              75% of 10GB used
            </p>
          </div>

          {/* Dark Mode toggle */}
          <button
            onClick={() => setDarkMode((d) => !d)}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] py-2 text-xs font-semibold text-[#757684] transition-colors hover:bg-gray-50 dark:border-[#2a2c38] dark:text-[#a8aab8] dark:hover:bg-[#1e202b]"
          >
            {darkMode ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5l1.5 1.5M5 19l1.5-1.5M17.5 6.5L19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Light Mode
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                Dark Mode
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#e2e8f0] bg-white px-8 dark:border-[#2a2c38] dark:bg-[#15171f]">
          {/* Search bar */}
          <div className="relative w-full max-w-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#757684] dark:text-[#a8aab8]"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] py-2 pl-10 pr-4 text-sm text-[#1a1b22] placeholder-[#757684] outline-none transition-colors focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:placeholder-[#5a5c68] dark:focus:border-[#b8c4ff]"
            />
          </div>

          {/* Right navbar items */}
          <div className="flex items-center gap-4">
            {/* Bell */}
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#757684] hover:bg-gray-100 hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:bg-[#1a1c26] dark:hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#00288e] dark:bg-[#b8c4ff]" />
            </button>

            {/* Help */}
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-[#757684] hover:bg-gray-100 hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:bg-[#1a1c26] dark:hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>

            {/* Divider */}
            <div className="h-6 w-[1px] bg-[#e2e8f0] dark:bg-[#2a2c38]" />

            {/* User Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu((s) => !s)}
                className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-gray-50 dark:hover:bg-[#1e202b]"
              >
                {/* Simulated profile picture matching Sarah/Alex/Elena images */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dde1ff] text-xs font-bold text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]">
                  {initials}
                </div>
                <span className="text-sm font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                  {displayName}
                </span>
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#757684]">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2.5 w-56 rounded-xl border border-[#e2e8f0] bg-white py-1.5 shadow-lg dark:border-[#2a2c38] dark:bg-[#15171f]">
                    <div className="border-b border-[#e2e8f0] px-4 py-2.5 dark:border-[#2a2c38]">
                      <p className="truncate text-xs font-bold text-[#1a1b22] dark:text-white">
                        {displayName}
                      </p>
                      <p className="truncate text-[10px] text-[#757684] dark:text-[#a8aab8]">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        api.post("/auth/logout").finally(() => logout());
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                        <path
                          d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
