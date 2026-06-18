import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Workspace } from "../types";

interface WorkspacesResponse {
  data: Workspace[];
}

export default function Workspaces() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<WorkspacesResponse>("/workspaces")
      .then((res) => {
        if (active) { setWorkspaces(res.data.data); setError(null); }
      })
      .catch(() => {
        if (active) setError("Failed to load workspaces.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await api.post<Workspace>("/workspaces", {
        name: createName.trim(),
        description: createDesc.trim() || null,
      });
      setWorkspaces((prev) => [res.data, ...prev]);
      setCreateName("");
      setCreateDesc("");
      setShowModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create workspace";
      setCreateError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
            Workspaces
          </h1>
          <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
            Organize projects and collaborate with your team.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-[#3b52d9]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Create Workspace
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-[#e2e8f0] bg-white dark:border-[#2a2c38] dark:bg-[#15171f]">
              <div className="h-full space-y-4 p-5">
                <div className="h-5 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-white py-16 dark:border-[#2a2c38] dark:bg-[#15171f]">
          <svg viewBox="0 0 24 24" fill="none" className="mb-3 h-12 w-12 text-[#757684]">
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
          </svg>
          <p className="text-sm font-bold text-[#1a1b22] dark:text-white">No workspaces yet</p>
          <p className="mt-1 text-xs text-[#757684] dark:text-[#a8aab8]">
            Create your first workspace to get started.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-lg bg-[#00288e] px-4 py-2 text-xs font-semibold text-white dark:bg-[#3b52d9]"
          >
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => navigate(`/workspaces/${ws.id}`)}
              className="group flex flex-col rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs text-left transition-all hover:shadow-md hover:border-[#00288e]/30 dark:border-[#2a2c38] dark:bg-[#15171f] dark:hover:border-[#3b52d9]/40"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dde1ff] text-sm font-bold text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 text-[#757684] opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h3 className="mt-3 font-display text-sm font-bold text-[#1a1b22] dark:text-white">
                {ws.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-[#757684] dark:text-[#a8aab8]">
                {ws.description || "No description"}
              </p>

              <div className="mt-auto flex items-center gap-4 pt-4 text-[10px] font-bold text-[#757684] dark:text-[#a8aab8]">
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                    <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 20c0-3 3-5 6-5h0c3 0 6 2 6 5" stroke="currentColor" strokeWidth="2" />
                    <circle cx="17" cy="9" r="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M19 20c0-2-1.5-3.5-3-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {ws._count?.members ?? 0} members
                </span>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  {ws._count?.projects ?? 0} projects
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl dark:border-[#2a2c38] dark:bg-[#15171f] text-[#1a1b22] dark:text-[#f1f0fa]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Create Workspace</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-[#757684] hover:bg-gray-100 dark:hover:bg-[#1e202b]"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {createError && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Engineering Team"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Description</label>
                <textarea
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="What is this workspace for?"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
                />
              </div>

              <div className="mt-5 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-[#e4e6eb] px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-lg bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-[#3b52d9]"
                >
                  {createLoading ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
