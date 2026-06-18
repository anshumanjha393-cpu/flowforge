import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { AuditLog, PaginatedResponse } from "../types";

const ENTITY_TYPES = ["", "Task", "Project", "User", "Comment"] as const;
const ACTION_TYPES = ["", "Created", "Updated", "Deleted"] as const;

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterEntity, setFilterEntity] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: 20,
        };
        if (filterEntity) params.entity = filterEntity;
        if (filterAction) params.action = filterAction;

        const res = await api.get<PaginatedResponse<AuditLog>>("/audit-logs", { params });
        let filteredData = res.data.data;

        if (filterDateFrom) {
          filteredData = filteredData.filter(
            (log) => new Date(log.createdAt) >= new Date(filterDateFrom)
          );
        }
        if (filterDateTo) {
          const toDate = new Date(filterDateTo);
          toDate.setHours(23, 59, 59, 999);
          filteredData = filteredData.filter(
            (log) => new Date(log.createdAt) <= toDate
          );
        }

        if (active) {
          setLogs(filteredData);
          setPagination(res.data.pagination);
          setError(null);
        }
      } catch {
        if (active) setError("Failed to fetch audit logs.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [currentPage, filterEntity, filterAction, filterDateFrom, filterDateTo]);

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterEntity) params.entity = filterEntity;
      if (filterAction) params.action = filterAction;

      const res = await api.get("/audit-logs/export", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "audit-logs.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export audit logs.");
    }
  };

  const getActionIcon = (action: string) => {
    const normalized = action.toLowerCase();
    if (normalized.includes("create")) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      );
    }
    if (normalized.includes("update")) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    }
    if (normalized.includes("delete")) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    }
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  };

  const formatJson = (obj: unknown): string => {
    if (!obj || (typeof obj === "object" && Object.keys(obj as object).length === 0)) return "";
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
            Track all system activity and changes across your workspace.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-xs font-semibold text-[#1a1b22] shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M12 2v13M12 2l-4 4M12 2l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Export CSV
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 sm:flex-row sm:items-center dark:border-[#2a2c38] dark:bg-[#15171f]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-[#757684] dark:text-[#a8aab8]">Filters:</span>

          <select
            value={filterEntity}
            onChange={(e) => { setFilterEntity(e.target.value); setCurrentPage(1); }}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white"
          >
            <option value="">All Entities</option>
            {ENTITY_TYPES.filter(Boolean).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white"
          >
            <option value="">All Actions</option>
            {ACTION_TYPES.filter(Boolean).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white"
            placeholder="From date"
          />

          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white"
            placeholder="To date"
          />
        </div>

        {(filterEntity || filterAction || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => {
              setFilterEntity("");
              setFilterAction("");
              setFilterDateFrom("");
              setFilterDateTo("");
              setCurrentPage(1);
            }}
            className="text-xs font-bold text-[#e11d48] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f] overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex animate-pulse items-start gap-4 border-b border-[#e2e8f0] px-5 py-4 dark:border-[#2a2c38]">
                <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="h-2 w-1/3 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[#757684] dark:text-[#a8aab8]">
            No audit logs found.
          </div>
        ) : (
          <div>
            {logs.map((log) => {
              const isExpanded = expandedId === log.id;
              const oldStr = formatJson(log.oldValues);
              const newStr = formatJson(log.newValues);
              const hasDiff = oldStr || newStr;

              return (
                <div
                  key={log.id}
                  className="border-b border-[#e2e8f0] last:border-b-0 dark:border-[#2a2c38]"
                >
                  <div
                    className={`flex items-start gap-4 px-5 py-4 ${hasDiff ? "cursor-pointer hover:bg-gray-50/50 dark:hover:bg-[#1e202b]" : ""}`}
                    onClick={() => hasDiff && setExpandedId(isExpanded ? null : log.id)}
                  >
                    {getActionIcon(log.action)}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                        <span className="font-bold">{log.entity}</span>
                        {" was "}
                        <span className="font-bold">{log.action.toLowerCase()}</span>
                        {log.user && (
                          <>
                            {" by "}
                            <span className="font-bold text-[#00288e] dark:text-[#b8c4ff]">
                              {log.user.name || log.user.email}
                            </span>
                          </>
                        )}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-[#757684] dark:text-[#a8aab8]">
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                        {log.ip && <span>IP: {log.ip}</span>}
                        {hasDiff && (
                          <span className="font-semibold text-[#00288e] dark:text-[#b8c4ff]">
                            {isExpanded ? "Hide details" : "View details"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded diff view */}
                  {isExpanded && hasDiff && (
                    <div className="border-t border-[#e2e8f0] bg-[#f8fafc] px-5 py-4 dark:border-[#2a2c38] dark:bg-[#0f1117]">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {oldStr && (
                          <div>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
                              Previous Values
                            </p>
                            <pre className="overflow-x-auto rounded-lg border border-[#e2e8f0] bg-white p-3 text-[11px] text-rose-600 dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-rose-400">
                              {oldStr}
                            </pre>
                          </div>
                        )}
                        {newStr && (
                          <div>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
                              New Values
                            </p>
                            <pre className="overflow-x-auto rounded-lg border border-[#e2e8f0] bg-white p-3 text-[11px] text-emerald-600 dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-emerald-400">
                              {newStr}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#e2e8f0] px-5 py-4 sm:flex-row dark:border-[#2a2c38]">
            <span className="text-xs text-[#757684] dark:text-[#a8aab8]">
              Showing {((pagination.page - 1) * pagination.limit) + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      currentPage === pageNum
                        ? "bg-[#00288e] text-white dark:bg-[#3b52d9]"
                        : "border border-[#e2e8f0] text-[#757684] hover:bg-gray-50 dark:border-[#2a2c38] dark:text-[#a8aab8] dark:hover:bg-[#1e202b]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
