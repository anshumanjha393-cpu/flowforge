import { useEffect, useState } from "react";
import { api } from "../api/client";
import { socket } from "../socket";
import type { Activity, PaginatedResponse } from "../types";

const ACTION_STYLES: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  CREATED: { bg: "bg-emerald-50", text: "text-emerald-600", darkBg: "dark:bg-emerald-500/10", darkText: "dark:text-emerald-400" },
  MOVED: { bg: "bg-blue-50", text: "text-blue-600", darkBg: "dark:bg-blue-500/10", darkText: "dark:text-blue-400" },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-600", darkBg: "dark:bg-emerald-500/10", darkText: "dark:text-emerald-400" },
  COMMENTED: { bg: "bg-sky-50", text: "text-sky-600", darkBg: "dark:bg-sky-500/10", darkText: "dark:text-sky-400" },
  UPLOADED: { bg: "bg-purple-50", text: "text-purple-600", darkBg: "dark:bg-purple-500/10", darkText: "dark:text-purple-400" },
  DELETED: { bg: "bg-rose-50", text: "text-rose-600", darkBg: "dark:bg-rose-500/10", darkText: "dark:text-rose-400" },
  INVITED: { bg: "bg-amber-50", text: "text-amber-600", darkBg: "dark:bg-amber-500/10", darkText: "dark:text-amber-400" },
};

function getActivityIcon(action: string) {
  const style = ACTION_STYLES[action] || ACTION_STYLES.CREATED;
  const iconClass = `h-4 w-4`;

  switch (action) {
    case "CREATED":
      return (
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}>
          <svg viewBox="0 0 24 24" fill="none" className={iconClass}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      );
    case "MOVED":
      return (
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}>
          <svg viewBox="0 0 24 24" fill="none" className={iconClass}><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      );
    case "COMPLETED":
      return (
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}>
          <svg viewBox="0 0 24 24" fill="none" className={iconClass}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      );
    case "COMMENTED":
      return (
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}>
          <svg viewBox="0 0 24 24" fill="none" className={iconClass}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/></svg>
        </div>
      );
    case "UPLOADED":
      return (
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}>
          <svg viewBox="0 0 24 24" fill="none" className={iconClass}><path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M12 2v13M12 2l-4 4M12 2l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      );
    case "DELETED":
      return (
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}>
          <svg viewBox="0 0 24 24" fill="none" className={iconClass}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      );
    case "INVITED":
      return (
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}>
          <svg viewBox="0 0 24 24" fill="none" className={iconClass}><circle cx="9" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M3 20c0-3.3 2.7-6 6-6M15 12h6m-3-3v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
      );
    default:
      return (
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg} ${style.text} ${style.darkBg} ${style.darkText}`}>
          <svg viewBox="0 0 24 24" fill="none" className={iconClass}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/></svg>
        </div>
      );
  }
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ActivityFeed({ searchQuery = "" }: { searchQuery?: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get<PaginatedResponse<Activity>>("/activities", {
          params: { limit: 100 },
        });
        if (active) setActivities(res.data.data);
      } catch {
        // silent
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handler = () => {
      api.get<PaginatedResponse<Activity>>("/activities", { params: { limit: 100 } })
        .then((res) => setActivities(res.data.data))
        .catch(() => {});
    };
    socket.on("activitiesChanged", handler);
    return () => { socket.off("activitiesChanged", handler); };
  }, []);

  const q = searchQuery?.trim().toLowerCase() ?? "";
  const filtered = activities.filter((a) => {
    const matchesSearch = q ? a.details.toLowerCase().includes(q) || a.userEmail.toLowerCase().includes(q) : true;
    const matchesFilter = filter === "ALL" || a.action === filter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions = ["ALL", "CREATED", "MOVED", "COMPLETED", "COMMENTED", "UPLOADED", "INVITED"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
            Activity Feed
          </h1>
          <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
            Track all actions and changes across your workspace
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
              filter === f
                ? "bg-[#00288e] text-white dark:bg-[#3b52d9]"
                : "bg-white text-[#757684] hover:bg-gray-50 dark:bg-[#15171f] dark:text-[#a8aab8] dark:hover:bg-[#1a1c26]"
            }`}
          >
            {f === "ALL" ? "All Activity" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
        {loading ? (
          <div className="space-y-0 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 py-4">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100 dark:bg-[#1a1c26]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-48 animate-pulse rounded bg-gray-100 dark:bg-[#1a1c26]" />
                  <div className="h-2 w-20 animate-pulse rounded bg-gray-100 dark:bg-[#1a1c26]" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg viewBox="0 0 24 24" fill="none" className="mb-3 h-10 w-10 text-[#757684]">
              <path d="M12 8v4l3 3M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-sm font-bold text-[#757684] dark:text-[#a8aab8]">No activity found</p>
            <p className="mt-1 text-xs text-[#757684]/70 dark:text-[#a8aab8]/60">
              {filter !== "ALL" ? "Try changing the filter" : "Activity will appear here as your team works"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f1f5f9] dark:divide-[#2a2c38]">
            {filtered.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-[#f8fafc] dark:hover:bg-[#1a1c26]">
                {getActivityIcon(activity.action)}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#757684] dark:text-[#a8aab8]">
                    {activity.details.split(" ").map((word, wIdx) => {
                      const isBold = word.startsWith("@") || word.includes("\"");
                      return (
                        <span key={wIdx} className={isBold ? "font-bold text-[#1a1b22] dark:text-white" : ""}>
                          {word}{" "}
                        </span>
                      );
                    })}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-[10px] text-[#757684]/70 dark:text-[#a8aab8]/60">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                    <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[9px] font-bold text-[#757684] dark:bg-[#1a1c26] dark:text-[#a8aab8]">
                      {activity.action}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
