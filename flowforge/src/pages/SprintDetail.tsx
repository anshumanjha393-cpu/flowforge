import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Sprint, Task } from "../types";

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

const TASK_STATUS_STYLES: Record<Task["status"], string> = {
  TODO: "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400",
  IN_PROGRESS: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  IN_REVIEW: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  DONE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  LOW: "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400",
  MEDIUM: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  HIGH: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  CRITICAL: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
};

export default function SprintDetail() {
  const { id } = useParams<{ id: string }>();
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    api
      .get<Sprint>(`/sprints/${id}`)
      .then((res) => {
        if (active) { setSprint(res.data); setError(null); }
      })
      .catch(() => {
        if (active) setError("Failed to load sprint.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const handleStart = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await api.post<Sprint>(`/sprints/${id}/start`);
      setSprint(res.data);
    } catch {
      setError("Failed to start sprint.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await api.post<Sprint>(`/sprints/${id}/complete`);
      setSprint(res.data);
    } catch {
      setError("Failed to complete sprint.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (error && !sprint) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
        {error}
      </div>
    );
  }

  if (!sprint) return null;

  const statusLabel =
    sprint.status.charAt(0) + sprint.status.slice(1).toLowerCase();

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-2xl">
                {sprint.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[sprint.status]}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[sprint.status]}`} />
                {statusLabel}
              </span>
            </div>
            {sprint.description && (
              <p className="mt-2 text-sm text-[#757684] dark:text-[#a8aab8]">
                {sprint.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">
              {sprint.project && (
                <span className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  {sprint.project.name}
                </span>
              )}
              <span>
                {new Date(sprint.startDate).toLocaleDateString()} –{" "}
                {new Date(sprint.endDate).toLocaleDateString()}
              </span>
              <span>{sprint._count?.tasks ?? 0} tasks</span>
            </div>
            {sprint.goal && (
              <div className="mt-3 rounded-lg bg-[#f8fafc] px-3 py-2 text-xs text-[#1a1b22] dark:bg-[#0f1117] dark:text-[#f1f0fa]">
                <span className="font-bold">Goal:</span> {sprint.goal}
              </div>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            {sprint.status === "PLANNING" && (
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-emerald-500"
              >
                {actionLoading ? "Starting..." : "Start Sprint"}
              </button>
            )}
            {sprint.status === "ACTIVE" && (
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-blue-500"
              >
                {actionLoading ? "Completing..." : "Complete Sprint"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
        <div className="border-b border-[#e2e8f0] px-5 py-4 dark:border-[#2a2c38]">
          <h2 className="font-display text-sm font-bold text-[#1a1b22] dark:text-white">
            Tasks
          </h2>
        </div>

        <div className="divide-y divide-[#e2e8f0] dark:divide-[#2a2c38]">
          {!sprint.tasks || sprint.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg viewBox="0 0 24 24" fill="none" className="mb-3 h-10 w-10 text-[#757684]">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm font-bold text-[#1a1b22] dark:text-white">No tasks in this sprint</p>
              <p className="mt-1 text-xs text-[#757684] dark:text-[#a8aab8]">
                Add tasks to this sprint to get started.
              </p>
            </div>
          ) : (
            sprint.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-gray-50/50 dark:hover:bg-[#1e202b]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#1a1b22] dark:text-white">
                    {task.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${TASK_STATUS_STYLES[task.status]}`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_STYLES[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                    {task.assignee && (
                      <span className="text-[10px] text-[#757684] dark:text-[#a8aab8]">
                        {task.assignee.name || task.assignee.email}
                      </span>
                    )}
                  </div>
                </div>
                {task.dueDate && (
                  <span className="shrink-0 text-[10px] font-semibold text-[#757684] dark:text-[#a8aab8]">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
