import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { api } from "./api/client";
import NotificationsDropdown from "./components/NotificationsDropdown";

type NavId = "dashboard" | "board" | "projects" | "team" | "activities" | "settings" | "workspaces" | "sprints" | "time-tracking" | "webhooks" | "audit-logs";

const NAV_ITEMS: { id: NavId; path: string; label: string; icon: ReactNode }[] = [
  {
    id: "dashboard",
    path: "/dashboard",
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
    path: "/board",
    label: "Board",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect x="3" y="3" width="5" height="18" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="10" y="3" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="17" y="3" width="5" height="15" rx="1" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: "projects",
    path: "/projects",
    label: "Projects",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 10h18M9 5v14" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: "workspaces",
    path: "/workspaces",
    label: "Workspaces",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    id: "sprints",
    path: "/sprints",
    label: "Sprints",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "time-tracking",
    path: "/time-tracking",
    label: "Time",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "team",
    path: "/team",
    label: "Team",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 20c0-3.3 2.7-6 6-6M14 20c0-2.5 1.8-4.5 4-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "activities",
    path: "/activities",
    label: "Activity",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M12 8v4l3 3M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "webhooks",
    path: "/webhooks",
    label: "Webhooks",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "audit-logs",
    path: "/audit-logs",
    label: "Audit",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "settings",
    path: "/settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const displayName = user?.name || (user?.email ? user.email.split("@")[0] : "User");

  const handleNewProject = () => {
    navigate("/projects");
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#1a1b22] dark:bg-[#0f1117] dark:text-[#f1f0fa]">
      {/* Sidebar */}
      <aside className={`flex shrink-0 flex-col justify-between border-r border-[#e2e8f0] bg-white px-4 py-5 transition-all duration-200 dark:border-[#2a2c38] dark:bg-[#15171f] ${sidebarCollapsed ? "w-[68px]" : "w-64"}`}>
        <div>
          {/* Logo */}
          <div className="mb-6 flex items-center gap-3 px-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00288e] text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
                <path d="M9 9h6v6H9z" fill="currentColor" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <p className="font-display text-[15px] font-bold leading-tight text-[#00288e] dark:text-[#b8c4ff]">
                  FlowForge
                </p>
                <p className="text-[10px] font-semibold tracking-wide text-[#757684] uppercase dark:text-[#a8aab8]">
                  Enterprise PM
                </p>
              </div>
            )}
          </div>

          {/* New Project Button */}
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={handleNewProject}
              className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00288e] py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#001e70] active:scale-[0.98] dark:bg-[#3b52d9] dark:hover:bg-[#2d42b8]"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              New Project
            </button>
          )}

          {/* Navigation */}
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#dde1ff] text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]"
                      : "text-[#757684] hover:bg-[#f1f5f9] hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:bg-[#1a1c26] dark:hover:text-white"
                  }`
                }
              >
                {item.icon}
                {!sidebarCollapsed && item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center rounded-xl border border-[#e2e8f0] py-2 text-[#757684] transition-colors hover:bg-[#f1f5f9] dark:border-[#2a2c38] dark:text-[#a8aab8] dark:hover:bg-[#1a1c26]"
          >
            <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {!sidebarCollapsed && (
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] py-2.5 text-xs font-semibold text-[#757684] transition-colors hover:bg-[#f1f5f9] dark:border-[#2a2c38] dark:text-[#a8aab8] dark:hover:bg-[#1a1c26]"
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
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-[64px] shrink-0 items-center justify-between border-b border-[#e2e8f0] bg-white px-6 dark:border-[#2a2c38] dark:bg-[#15171f]">
          <div className="relative w-full max-w-md">
            <svg viewBox="0 0 24 24" fill="none" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#757684] dark:text-[#a8aab8]">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] py-2 pl-10 pr-4 text-sm text-[#1a1b22] placeholder-[#757684] outline-none transition-colors focus:border-[#00288e] focus:ring-2 focus:ring-[#00288e]/10 dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:placeholder-[#5a5c68] dark:focus:border-[#b8c4ff]"
            />
          </div>

          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-[#757684] transition-colors hover:bg-[#f1f5f9] hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:bg-[#1a1c26] dark:hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <div className="mx-1 h-6 w-[1px] bg-[#e2e8f0] dark:bg-[#2a2c38]" />

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu((s) => !s)}
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-[#f1f5f9] dark:hover:bg-[#1a1c26]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dde1ff] text-xs font-bold text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]">
                  {initials}
                </div>
                <span className="text-sm font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">{displayName}</span>
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#757684]">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 z-20 mt-2.5 w-56 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-xl dark:border-[#2a2c38] dark:bg-[#15171f]">
                    <div className="border-b border-[#e2e8f0] px-4 py-3 dark:border-[#2a2c38]">
                      <p className="truncate text-xs font-bold text-[#1a1b22] dark:text-white">{displayName}</p>
                      <p className="mt-0.5 truncate text-[10px] text-[#757684] dark:text-[#a8aab8]">{user?.email}</p>
                    </div>
                    <div className="py-1.5">
                      <button
                        type="button"
                        onClick={() => { setShowUserMenu(false); navigate("/settings"); }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-[#1a1b22] transition-colors hover:bg-[#f8fafc] dark:text-[#f1f0fa] dark:hover:bg-[#1a1c26]"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                          <path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Profile Settings
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowUserMenu(false); api.post("/auth/logout").finally(() => logout()); }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-5">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
}
