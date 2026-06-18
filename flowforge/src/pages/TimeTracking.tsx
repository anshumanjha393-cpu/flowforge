import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { TimeEntry, TimeSummary, TimeSummaryResponse, Task, PaginatedResponse } from "../types";

export default function TimeTracking() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<TimeSummary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formHours, setFormHours] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTaskId, setFormTaskId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [entriesRes, summaryRes, tasksRes] = await Promise.all([
          api.get<PaginatedResponse<TimeEntry>>("/time-entries"),
          api.get<TimeSummaryResponse>("/time-entries/summary?period=week"),
          api.get<PaginatedResponse<Task>>("/tasks"),
        ]);
        if (active) {
          setEntries(entriesRes.data.data);
          setSummary(summaryRes.data.summary);
          setTasks(tasksRes.data.data);
          setError(null);
        }
      } catch {
        if (active) setError("Failed to fetch time tracking data.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const fetchData = async () => {
    try {
      const [entriesRes, summaryRes, tasksRes] = await Promise.all([
        api.get<PaginatedResponse<TimeEntry>>("/time-entries"),
        api.get<TimeSummaryResponse>("/time-entries/summary?period=week"),
        api.get<PaginatedResponse<Task>>("/tasks"),
      ]);
      setEntries(entriesRes.data.data);
      setSummary(summaryRes.data.summary);
      setTasks(tasksRes.data.data);
      setError(null);
    } catch {
      setError("Failed to fetch time tracking data.");
    }
  };

  const weeklyTotal = entries.reduce((sum, e) => sum + e.hours, 0);

  const getLast7Days = () => {
    const days: { label: string; date: string; hours: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      const found = summary.find((s) => s.date === dateStr);
      days.push({ label, date: dateStr, hours: found?.totalHours ?? 0 });
    }
    return days;
  };

  const chartDays = getLast7Days();
  const maxHours = Math.max(...chartDays.map((d) => d.hours), 1);

  const openCreate = () => {
    setEditingId(null);
    setFormHours("");
    setFormDescription("");
    setFormTaskId("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setShowModal(true);
  };

  const openEdit = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setFormHours(String(entry.hours));
    setFormDescription(entry.description ?? "");
    setFormTaskId(entry.taskId);
    setFormDate(entry.date.split("T")[0]);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(formHours);
    if (isNaN(hours) || hours <= 0 || !formTaskId) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/time-entries/${editingId}`, {
          hours,
          description: formDescription,
          taskId: formTaskId,
          date: formDate,
        });
      } else {
        await api.post("/time-entries", {
          hours,
          description: formDescription,
          taskId: formTaskId,
          date: formDate,
        });
      }
      setShowModal(false);
      await fetchData();
    } catch {
      setError("Failed to save time entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/time-entries/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Failed to delete time entry.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
            Time Tracking
          </h1>
          <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
            Track and manage your team's work hours.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-[#3b52d9]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Log Time
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Weekly Summary Chart */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1a1b22] dark:text-white">This Week</h2>
          <span className="rounded-full bg-[#dde1ff] px-2.5 py-0.5 text-xs font-semibold text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]">
            {weeklyTotal.toFixed(1)}h total
          </span>
        </div>
        <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
          {chartDays.map((day) => {
            const heightPct = maxHours > 0 ? (day.hours / maxHours) * 100 : 0;
            const isToday = day.date === new Date().toISOString().split("T")[0];
            return (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-[#757684] dark:text-[#a8aab8]">
                  {day.hours > 0 ? `${day.hours}h` : ""}
                </span>
                <div className="w-full flex-1 flex items-end justify-center">
                  <div
                    className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                      isToday
                        ? "bg-[#00288e] dark:bg-[#3b52d9]"
                        : "bg-[#dde1ff] dark:bg-[#1e40af]/50"
                    }`}
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    isToday
                      ? "text-[#00288e] dark:text-[#b8c4ff]"
                      : "text-[#757684] dark:text-[#a8aab8]"
                  }`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] font-bold text-[#757684] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-[#a8aab8] uppercase tracking-wider">
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Task</th>
                <th className="px-5 py-4">Project</th>
                <th className="px-5 py-4">Description</th>
                <th className="px-5 py-4 text-right">Hours</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#2a2c38]">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="h-14 px-5" />
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-[#757684] dark:text-[#a8aab8]">
                    No time entries yet. Click "Log Time" to get started.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-[#1e202b]"
                  >
                    <td className="px-5 py-3 font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                      {new Date(entry.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-[#1a1b22] dark:text-[#f1f0fa]">
                      {entry.task?.title ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-[#757684] dark:text-[#a8aab8]">
                      {entry.task?.project?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-[#757684] dark:text-[#a8aab8] max-w-[200px] truncate">
                      {entry.description || "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-[#1a1b22] dark:text-white">
                      {entry.hours}h
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(entry)}
                          className="rounded-lg p-1.5 text-[#757684] hover:bg-gray-100 hover:text-[#1a1b22] dark:hover:bg-[#1e202b] dark:hover:text-white"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-lg p-1.5 text-[#757684] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Weekly Total Footer */}
        {entries.length > 0 && (
          <div className="flex items-center justify-between border-t border-[#e2e8f0] px-5 py-4 dark:border-[#2a2c38]">
            <span className="text-xs font-bold text-[#757684] dark:text-[#a8aab8]">
              {entries.length} entries
            </span>
            <span className="text-sm font-bold text-[#1a1b22] dark:text-white">
              Weekly Total: <span className="text-[#00288e] dark:text-[#b8c4ff]">{weeklyTotal.toFixed(1)}h</span>
            </span>
          </div>
        )}
      </div>

      {/* Log Time Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl dark:border-[#2a2c38] dark:bg-[#15171f]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">
                {editingId ? "Edit Time Entry" : "Log Time"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1 text-[#757684] hover:bg-gray-100 dark:hover:bg-[#1e202b]"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                  Hours
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={formHours}
                  onChange={(e) => setFormHours(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                  Task
                </label>
                <select
                  value={formTaskId}
                  onChange={(e) => setFormTaskId(e.target.value)}
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:focus:border-[#b8c4ff]"
                  required
                >
                  <option value="">Select a task</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                  Description
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What did you work on?"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:focus:border-[#b8c4ff]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-[#e4e6eb] px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-[#3b52d9]"
                >
                  {submitting ? "Saving..." : editingId ? "Update" : "Log Time"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
