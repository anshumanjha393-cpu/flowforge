import { useState } from "react";
import Layout, { type Page } from "./Layout";
import Dashboard from "./pages/Dashboard";
import Kanban from "./pages/Kanban";
import TeamMembers from "./pages/TeamMembers";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useAuth } from "./context/AuthContext";
import { api } from "./api/client";
import { socket } from "./socket";

type AuthView = "login" | "register";

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [authView, setAuthView] = useState<AuthView>("login");

  // New Project modal state
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectPriority, setProjectPriority] = useState("MEDIUM");
  const [projectDueDate, setProjectDueDate] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-outline-variant)] border-t-[var(--color-primary)]" />
      </div>
    );
  }

  if (!user) {
    return authView === "login" ? (
      <Login onSwitchToRegister={() => setAuthView("register")} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView("login")} />
    );
  }

  const searchPlaceholder =
    page === "dashboard"
      ? "Search projects..."
      : page === "board"
      ? "Search tasks..."
      : page === "team"
      ? "Search team members..."
      : "Search settings...";

  const handleNavigate = (next: Page) => {
    setPage(next);
    setSearchQuery("");
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setModalLoading(true);
    setModalError(null);

    try {
      await api.post("/projects", {
        name: projectName.trim(),
        description: projectDesc.trim() || null,
        priority: projectPriority,
        dueDate: projectDueDate ? new Date(projectDueDate).toISOString() : null,
      });

      // Clear form
      setProjectName("");
      setProjectDesc("");
      setProjectPriority("MEDIUM");
      setProjectDueDate("");
      setShowNewProjectModal(false);

      // Trigger socket refetch
      socket.emit("tasksChanged");

      // Redirect to Projects Board page to view the new project
      setPage("board");
    } catch (err: any) {
      console.error(err);
      setModalError(err.response?.data?.error ?? "Failed to create project");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      <Layout
        page={page}
        onNavigate={handleNavigate}
        searchPlaceholder={searchPlaceholder}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewProject={() => setShowNewProjectModal(true)}
      >
        {page === "dashboard" && <Dashboard searchQuery={searchQuery} onNavigate={handleNavigate} />}
        {page === "board" && <Kanban searchQuery={searchQuery} />}
        {page === "team" && <TeamMembers searchQuery={searchQuery} />}
        {page === "settings" && <Settings />}
      </Layout>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl dark:border-[#2a2c38] dark:bg-[#15171f] text-[#1a1b22] dark:text-[#f1f0fa]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">New Project</h3>
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="rounded-full p-1 text-[#757684] hover:bg-gray-100 dark:hover:bg-[#1e202b]"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {modalError && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Mobile App Development"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Description</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Describe project goals..."
                  rows={3}
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Priority</label>
                  <select
                    value={projectPriority}
                    onChange={(e) => setProjectPriority(e.target.value)}
                    className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Due Date</label>
                  <input
                    type="date"
                    value={projectDueDate}
                    onChange={(e) => setProjectDueDate(e.target.value)}
                    className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117]"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="rounded-lg border border-[#e4e6eb] px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="rounded-lg bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-[#3b52d9]"
                >
                  {modalLoading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return <AppContent />;
}
