import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Webhook, WebhookLog, PaginatedResponse } from "../types";

const AVAILABLE_EVENTS = [
  { value: "task.created", label: "Task Created" },
  { value: "task.updated", label: "Task Updated" },
  { value: "task.completed", label: "Task Completed" },
  { value: "comment.created", label: "Comment Created" },
  { value: "project.created", label: "Project Created" },
];

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  const [expandedLogsId, setExpandedLogsId] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get<PaginatedResponse<Webhook>>("/webhooks");
        if (active) { setWebhooks(res.data.data); setError(null); }
      } catch {
        if (active) setError("Failed to fetch webhooks.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleToggleEvent = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim() || formEvents.length === 0) return;

    setSubmitting(true);
    try {
      const res = await api.post<Webhook>("/webhooks", {
        name: formName,
        url: formUrl,
        events: formEvents,
      });
      setWebhooks((prev) => [res.data, ...prev]);
      setFormName("");
      setFormUrl("");
      setFormEvents([]);
      setShowModal(false);
    } catch {
      setError("Failed to create webhook.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      await api.post(`/webhooks/${id}/test`);
      setTestResult({ id, success: true, message: "Test ping sent successfully." });
    } catch {
      setTestResult({ id, success: false, message: "Test ping failed." });
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/webhooks/${id}`);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch {
      setError("Failed to delete webhook.");
    }
  };

  const toggleLogs = async (id: string) => {
    if (expandedLogsId === id) {
      setExpandedLogsId(null);
      setLogs([]);
      return;
    }
    setExpandedLogsId(id);
    setLogsLoading(true);
    try {
      const res = await api.get<PaginatedResponse<WebhookLog>>(`/webhooks/${id}/logs`);
      setLogs(res.data.data);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const eventBadgeColor = (event: string) => {
    if (event.startsWith("task")) return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
    if (event.startsWith("comment")) return "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400";
    if (event.startsWith("project")) return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
    return "bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
            Webhooks
          </h1>
          <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
            Configure integrations and receive real-time event notifications.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-[#3b52d9]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Create Webhook
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Webhooks Table */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] font-bold text-[#757684] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-[#a8aab8] uppercase tracking-wider">
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">URL</th>
                <th className="px-5 py-4">Events</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#2a2c38]">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="h-14 px-5" />
                  </tr>
                ))
              ) : webhooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#757684] dark:text-[#a8aab8]">
                    No webhooks configured yet.
                  </td>
                </tr>
              ) : (
                webhooks.map((webhook) => (
                  <tr key={webhook.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1e202b]">
                    <td className="px-5 py-3">
                      <span className="font-bold text-[#1a1b22] dark:text-white">{webhook.name}</span>
                    </td>
                    <td className="px-5 py-3 max-w-[200px]">
                      <span className="block truncate text-[#757684] dark:text-[#a8aab8]">{webhook.url}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${eventBadgeColor(event)}`}
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-bold ${
                          webhook.isActive
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-500/10 dark:text-gray-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            webhook.isActive ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        />
                        {webhook.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleLogs(webhook.id)}
                          className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                            expandedLogsId === webhook.id
                              ? "bg-[#dde1ff] text-[#001453] dark:bg-[#1e40af]/30 dark:text-[#b8c4ff]"
                              : "text-[#757684] hover:bg-gray-100 dark:hover:bg-[#1e202b]"
                          }`}
                        >
                          Logs {webhook._count?.logs ? `(${webhook._count.logs})` : ""}
                        </button>
                        <button
                          onClick={() => handleTest(webhook.id)}
                          disabled={testingId === webhook.id}
                          className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-[#00288e] hover:bg-[#dde1ff] disabled:opacity-50 dark:text-[#b8c4ff] dark:hover:bg-[#1e40af]/20"
                        >
                          {testingId === webhook.id ? "Testing..." : "Test"}
                        </button>
                        <button
                          onClick={() => handleDelete(webhook.id)}
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

        {/* Test result */}
        {testResult && (
          <div
            className={`border-t px-5 py-3 text-xs font-semibold ${
              testResult.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
            }`}
          >
            {testResult.message}
          </div>
        )}
      </div>

      {/* Logs Section */}
      {expandedLogsId && (
        <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f] overflow-hidden">
          <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-3 dark:border-[#2a2c38] dark:bg-[#0f1117]">
            <h3 className="text-sm font-bold text-[#1a1b22] dark:text-white">Delivery Logs</h3>
          </div>
          {logsLoading ? (
            <div className="px-5 py-8 text-center text-sm text-[#757684] dark:text-[#a8aab8]">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#757684] dark:text-[#a8aab8]">No delivery logs yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e2e8f0] font-bold text-[#757684] dark:border-[#2a2c38] dark:text-[#a8aab8] uppercase tracking-wider">
                    <th className="px-5 py-3">Event</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Response</th>
                    <th className="px-5 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#2a2c38]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1e202b]">
                      <td className="px-5 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${eventBadgeColor(log.event)}`}>
                          {log.event}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            log.status >= 200 && log.status < 300
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 max-w-[200px] truncate text-[#757684] dark:text-[#a8aab8]">
                        {log.response ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-[#757684] dark:text-[#a8aab8]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Webhook Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl dark:border-[#2a2c38] dark:bg-[#15171f]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">
                Create Webhook
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                  Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Slack Notifications"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                  Payload URL
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                  Events
                </label>
                <div className="space-y-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <label
                      key={event.value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e4e6eb] px-3 py-2 transition-colors hover:bg-gray-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]"
                    >
                      <input
                        type="checkbox"
                        checked={formEvents.includes(event.value)}
                        onChange={() => handleToggleEvent(event.value)}
                        className="h-4 w-4 rounded border-[#e4e6eb] text-[#00288e] dark:border-[#2a2c38]"
                      />
                      <span className="text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                        {event.label}
                      </span>
                      <span className="ml-auto text-[10px] text-[#757684] dark:text-[#a8aab8]">
                        {event.value}
                      </span>
                    </label>
                  ))}
                </div>
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
                  disabled={submitting || formEvents.length === 0}
                  className="rounded-lg bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-[#3b52d9]"
                >
                  {submitting ? "Creating..." : "Create Webhook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
