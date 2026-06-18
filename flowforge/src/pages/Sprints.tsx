import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Sprint } from "../types";

interface SprintsResponse {
  data: Sprint[];
}

type StatusFilter = "ALL" | "PLANNING" | "ACTIVE" | "COMPLETED";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Planning", value: "PLANNING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Completed", value: "COMPLETED" },
];

const STATUS_STYLES: Record<Sprint["status"], string> = {
  PLANNING: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  COMPLETED: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
};

const STATUS_DOTS: Record<Sprint["status"], string> = {
  PLANNING: "bg-yellow-500",
  ACTIVE: "bg-emerald-500",
  COMPLETED: "bg-blue-500",
};

export default function Sprints() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");

  const [showModal, setShowModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createStartDate, setCreateStartDate] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [createGoal, setCreateGoal] = useState("");
  const [createProjectId, setCreateProjectId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<SprintsResponse>("/sprints")
      .then((res) => {
        if (active) { setSprints(res.data.data); setError(null); }
      })
      .catch(() => {
        if (active) setError("Failed to load sprints.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered =
    filter === "ALL" ? sprints : sprints.filter((s) => s.status === filter);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await api.post<Sprint>("/sprints", {
        name: createName.trim(),
        description: createDesc.trim() || null,
        startDate: createStartDate,
        endDate: createEndDate,
        goal: createGoal.trim() || null,
        projectId: createProjectId || undefined,
      });
      setSprints((prev) => [res.data, ...prev]);
      setCreateName("");
      setCreateDesc("");
      setCreateStartDate("");
      setCreateEndDate("");
      setCreateGoal("");
      setCreateProjectId("");
      setShowModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create sprint";
      setCreateError(message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStart = async (sprintId: string) => {
    try {
      const res = await api.post<Sprint>(`/sprints/${sprintId}/start`);
      setSprints((prev) => prev.map((s) => (s.id === sprintId ? res.data : s)));
    } catch {
      setError("Failed to start sprint.");
    }
  };

  const handleComplete = async (sprintId: string) => {
    try {
      const res = await api.post<Sprint>(`/sprints/${sprintId}/complete`);
      setSprints((prev) => prev.map((s) => (s.id === sprintId ? res.data : s)));
    } catch {
      setError("Failed to complete sprint.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
            Sprints
          </h1>
          <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
            Track iterative work cycles and sprint progress.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-[#3b52d9]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Create Sprint
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1 rounded-xl border border-[#e2e8f0] bg-white p-1 dark:border-[#2a2c38] dark:bg-[#15171f]">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              filter === tab.value
                ? "bg-[#00288e] text-white dark:bg-[#3b52d9]"
                : "text-[#757684] hover:bg-gray-100 dark:text-[#a8aab8] dark:hover:bg-[#1e202b]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sprints table */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] font-bold text-[#757684] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-[#a8aab8] uppercase tracking-wider">
                <th className="px-5 py-4">Sprint</th>
                <th className="px-5 py-4">Date Range</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Tasks</th>
                <th className="px-5 py-4">Goal</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#2a2c38]">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="h-16 px-5" />
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-[#757684] dark:text-[#a8aab8]">
                    No sprints found.
                  </td>
                </tr>
              ) : (
                filtered.map((sprint) => (
                  <tr
                    key={sprint.id}
                    className="transition-colors hover:bg-gray-50/50 dark:hover:bg-[#1e202b]"
                  >
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-bold text-[#1a1b22] dark:text-white">
                          {sprint.name}
                        </p>
                        {sprint.project && (
                          <p className="text-[10px] text-[#757684] dark:text-[#a8aab8]">
                            {sprint.project.name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#757684] dark:text-[#a8aab8]">
                      {new Date(sprint.startDate).toLocaleDateString()} –{" "}
                      {new Date(sprint.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-bold ${STATUS_STYLES[sprint.status]}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[sprint.status]}`} />
                        {sprint.status.charAt(0) + sprint.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                      {sprint._count?.tasks ?? 0}
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-3 text-xs text-[#757684] dark:text-[#a8aab8]">
                      {sprint.goal || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {sprint.status === "PLANNING" && (
                          <button
                            onClick={() => handleStart(sprint.id)}
                            className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                          >
                            Start
                          </button>
                        )}
                        {sprint.status === "ACTIVE" && (
                          <button
                            onClick={() => handleComplete(sprint.id)}
                            className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sprint Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl dark:border-[#2a2c38] dark:bg-[#15171f] text-[#1a1b22] dark:text-[#f1f0fa]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Create Sprint</h3>
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
                  placeholder="e.g. Sprint 1"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Description</label>
                <textarea
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Sprint description"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Start Date</label>
                  <input
                    type="date"
                    value={createStartDate}
                    onChange={(e) => setCreateStartDate(e.target.value)}
                    className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">End Date</label>
                  <input
                    type="date"
                    value={createEndDate}
                    onChange={(e) => setCreateEndDate(e.target.value)}
                    className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Goal</label>
                <input
                  type="text"
                  value={createGoal}
                  onChange={(e) => setCreateGoal(e.target.value)}
                  placeholder="What should this sprint achieve?"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Project ID</label>
                <input
                  type="text"
                  value={createProjectId}
                  onChange={(e) => setCreateProjectId(e.target.value)}
                  placeholder="Optional project ID"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
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
                  {createLoading ? "Creating..." : "Create Sprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
