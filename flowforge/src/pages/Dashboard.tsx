import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { api } from "../api/client";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";
import type { Project, Task, Activity } from "../types";
import { DashboardSkeleton } from "../components/Skeleton";
import type { Page } from "../Layout";

const COMPLETION_COLORS = ["#00288e", "#e2e8f0"];
const PRIORITY_COLORS = {
  HIGH: "#e11d48",
  MEDIUM: "#f59e0b",
  LOW: "#10b981",
};

// Tooltip theme helper
const isDark = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

interface DashboardProps {
  searchQuery?: string;
  onNavigate?: (page: Page) => void;
}

export default function Dashboard({ searchQuery, onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">("overview");

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // My Tasks list (assigned to me and incomplete or done)
  const [myTasks, setMyTasks] = useState<Task[]>([]);

  // Inline task creation
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTitle] = useState("");

  const fetchData = async () => {
    try {
      const [projRes, taskRes, actRes] = await Promise.all([
        api.get<Project[]>("/projects"),
        api.get<Task[]>("/tasks"),
        api.get<Activity[]>("/activities"),
      ]);

      setProjects(projRes.data);
      setTasks(taskRes.data);
      setActivities(actRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync with sockets
  useEffect(() => {
    const handleSync = () => {
      fetchData();
    };

    socket.on("tasksChanged", handleSync);
    socket.on("activitiesChanged", handleSync);
    socket.on("taskUpdated", handleSync);

    return () => {
      socket.off("tasksChanged", handleSync);
      socket.off("activitiesChanged", handleSync);
      socket.off("taskUpdated", handleSync);
    };
  }, []);

  // Filter tasks/projects by search query
  const q = searchQuery?.trim().toLowerCase() ?? "";
  const filteredProjects = q
    ? projects.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
    : projects;
  const filteredTasks = q
    ? tasks.filter((t) => t.title.toLowerCase().includes(q))
    : tasks;

  // Filter tasks for the logged in user
  useEffect(() => {
    if (user) {
      const mine = filteredTasks.filter((t) => t.assigneeId === user.id);
      setMyTasks(mine);
    }
  }, [filteredTasks, user]);

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === "DONE" ? "TODO" : "DONE";
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );

      await api.put(`/tasks/${task.id}`, { status: nextStatus });
      socket.emit("taskMoved", { taskId: task.id, status: nextStatus });
    } catch (err) {
      console.error(err);
      fetchData(); // rollback
    }
  };

  const handleAddTaskInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;

    try {
      await api.post("/tasks", {
        title: newTaskTitle.trim(),
        status: "TODO",
        priority: "MEDIUM",
        assigneeId: user.id,
      });

      setNewTitle("");
      setShowAddTask(false);
      socket.emit("tasksChanged");
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations for overview
  const activeProjectsCount = filteredProjects.filter((p) => p.status === "IN_PROGRESS").length;

  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.status === "DONE").length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const completionData = [
    { name: "Completed", value: completed },
    { name: "Remaining", value: total - completed },
  ];

  const priorityData = (["HIGH", "MEDIUM", "LOW"] as const).map((priority) => ({
    priority,
    count: filteredTasks.filter((task) => task.priority === priority).length,
  }));

  const tooltipStyle = {
    background: isDark() ? "#15171f" : "#ffffff",
    border: `1px solid ${isDark() ? "#2a2c38" : "#e2e8f0"}`,
    borderRadius: "8px",
    color: isDark() ? "#f1f0fa" : "#1a1b22",
    fontSize: "13px",
  };

  const displayName = user?.name?.split(" ")[0] || (user?.email ? user.email.split("@")[0] : "Alex");

  function formatRelativeTime(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function getActivityIcon(action: string) {
    switch (action) {
      case "UPLOADED":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M12 2v13M12 2l-4 4M12 2l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      case "COMMENTED":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      case "COMPLETED":
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <circle cx="9" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
              <path d="M3 20c0-3 3-4 6-4M17 11v6M14 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        );
    }
  }

  return (
    <div className="space-y-6">
      {loading && <DashboardSkeleton />}

      {!loading && (
      <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
            Good morning, {displayName}
          </h1>
          <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
            You have {activeProjectsCount} projects requiring attention today.
          </p>
        </div>

        {/* Tab switch & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-white p-0.5 shadow-xs dark:bg-[#15171f] border border-[#e2e8f0] dark:border-[#2a2c38]">
            <button
              onClick={() => setActiveTab("overview")}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "overview"
                  ? "bg-[#00288e] text-white"
                  : "text-[#757684] hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "analytics"
                  ? "bg-[#00288e] text-white"
                  : "text-[#757684] hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:text-white"
              }`}
            >
              Sprint Analytics
            </button>
          </div>

          <div className="flex -space-x-1.5 overflow-hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dde1ff] text-[10px] font-bold text-[#001453] ring-2 ring-white dark:ring-[#0f1117]">SC</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e3e1eb] text-[10px] font-bold text-[#444653] ring-2 ring-white dark:ring-[#0f1117]">MT</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fcd34d] text-[10px] font-bold text-amber-900 ring-2 ring-white dark:ring-[#0f1117]">ER</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-700 ring-2 ring-white dark:ring-[#0f1117] dark:bg-gray-800 dark:text-gray-300">+4</span>
          </div>

          <button
            onClick={() => onNavigate && onNavigate("team")}
            className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a1b22] hover:bg-gray-50 dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-white dark:hover:bg-[#1e202b]"
          >
            Manage Team
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* --- OVERVIEW TAB --- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Active Projects Grid */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1a1b22] dark:text-white">Active Projects</h2>
              <button
                onClick={() => onNavigate && onNavigate("board")}
                className="text-xs font-semibold text-[#00288e] hover:underline dark:text-[#b8c4ff]"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? [1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-44 animate-pulse rounded-xl border border-[#e2e8f0] bg-white dark:border-[#2a2c38] dark:bg-[#15171f]"
                    />
                  ))
                : filteredProjects.slice(0, 3).map((project) => {
                    const isHigh = project.priority === "HIGH";
                    const formattedDate = project.dueDate
                      ? new Date(project.dueDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      : "No date";

                    return (
                      <div
                        key={project.id}
                        className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs transition-shadow hover:shadow-md dark:border-[#2a2c38] dark:bg-[#15171f]"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          {isHigh ? (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              project.priority === "HIGH"
                                ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                                : project.priority === "MEDIUM"
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
                                : "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                            }`}
                          >
                            {project.priority === "HIGH"
                              ? "High Priority"
                              : project.priority === "MEDIUM"
                              ? "In Progress"
                              : "Low"}
                          </span>
                        </div>

                        <h3 className="font-display text-base font-bold text-[#1a1b22] dark:text-white">
                          {project.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-[#757684] dark:text-[#a8aab8]">
                          {project.description}
                        </p>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#1a1b22] dark:text-[#f1f0fa]">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#f1f5f9] dark:bg-[#2a2c38]">
                            <div
                              className="h-full rounded-full bg-[#00288e] dark:bg-[#b8c4ff]"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-[#2a2c38]">
                          <div className="flex -space-x-1 overflow-hidden">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#dde1ff] text-[8px] font-bold text-[#001453]">SC</span>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e3e1eb] text-[8px] font-bold text-[#444653]">ER</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-[#757684] dark:text-[#a8aab8]">
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* Productivity Overview Banner */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#00288e] p-6 text-white shadow-xs md:flex-row md:items-center dark:bg-[#1e40af]">
            <div className="max-w-xl">
              <h3 className="font-display text-lg font-bold">Productivity Overview</h3>
              <p className="mt-1 text-sm text-white/80">
                Your team completed 24% more tasks this week compared to the last.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-8 border-t border-white/20 pt-4 md:mt-0 md:border-0 md:pt-0">
              <div className="text-center">
                <span className="block text-2xl font-bold font-display">14</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Completed</span>
              </div>
              <div className="h-8 w-[1px] bg-white/25" />
              <div className="text-center">
                <span className="block text-2xl font-bold font-display">8</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">In Review</span>
              </div>
            </div>
          </div>

          {/* Checklist & Activity feed */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Checklist */}
            <div className="lg:col-span-5 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1a1b22] dark:text-white">My Tasks</h2>
                <button className="text-[#757684] hover:text-[#1a1b22] dark:hover:text-white">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
                    <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
                    <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                {myTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg border border-[#f1f5f9] p-3 hover:bg-[#f8fafc] dark:border-[#2a2c38] dark:hover:bg-[#1e202b]"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === "DONE"}
                      onChange={() => handleToggleTask(task)}
                      className="mt-0.5 h-4.5 w-4.5 rounded border-[#e4e6eb] text-[#00288e] dark:border-[#2a2c38]"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold leading-snug ${
                          task.status === "DONE"
                            ? "text-[#757684] line-through dark:text-[#a8aab8]"
                            : "text-[#1a1b22] dark:text-[#f1f0fa]"
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="mt-1 text-[11px] font-bold text-[#757684] dark:text-[#a8aab8]">
                        Priority: {task.priority.toLowerCase()}
                      </p>
                    </div>
                  </div>
                ))}

                {showAddTask ? (
                  <form onSubmit={handleAddTaskInline} className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Add task title..."
                      className="flex-1 rounded-lg border border-[#e4e6eb] bg-white px-3 py-1.5 text-xs outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117]"
                      required
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-[#00288e] px-3 py-1.5 text-xs font-semibold text-white dark:bg-[#3b52d9]"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddTask(false)}
                      className="rounded-lg border border-[#e4e6eb] px-3 py-1.5 text-xs font-semibold dark:border-[#2a2c38]"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#e4e6eb] py-3 text-xs font-bold text-[#757684] hover:bg-[#f8fafc] dark:border-[#2a2c38] dark:hover:bg-[#1a1c26]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    Add Task
                  </button>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-7 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
              <h2 className="mb-4 text-base font-bold text-[#1a1b22] dark:text-white">Recent Activity</h2>

              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-xs text-[#757684] dark:text-[#a8aab8]">No activity logged yet.</p>
                ) : (
                  activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      {getActivityIcon(activity.action)}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[#757684] dark:text-[#a8aab8]">
                          {/* Formatting HTML style bold items */}
                          {activity.details.split(" ").map((word, wIdx) => {
                            const isBold =
                              word.startsWith("Sarah") ||
                              word.startsWith("Marcus") ||
                              word.startsWith("Elena") ||
                              word.startsWith("Alex") ||
                              word.startsWith("Automator") ||
                              word.includes("Quantum") ||
                              word.includes("Cloud") ||
                              word.includes("FlowForge");
                            return (
                              <span key={wIdx} className={isBold ? "font-bold text-[#1a1b22] dark:text-white" : ""}>
                                {word}{" "}
                              </span>
                            );
                          })}
                        </p>
                        <span className="mt-0.5 block text-[10px] text-[#757684]/70 dark:text-[#a8aab8]/60">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ANALYTICS TAB --- */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-fade-in">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 dark:border-[#2a2c38] dark:bg-[#15171f]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
                Total tasks
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-[#1a1b22] dark:text-white">
                {loading ? "—" : total}
              </p>
            </div>

            <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 dark:border-[#2a2c38] dark:bg-[#15171f]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                Todo
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-[#1a1b22] dark:text-white">
                {loading ? "—" : filteredTasks.filter((t) => t.status === "TODO").length}
              </p>
            </div>

            <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 dark:border-[#2a2c38] dark:bg-[#15171f]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
                <span className="h-2 w-2 rounded-full bg-[#00288e]" />
                In Progress
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-[#1a1b22] dark:text-white">
                {loading ? "—" : filteredTasks.filter((t) => t.status === "IN_PROGRESS").length}
              </p>
            </div>

            <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 dark:border-[#2a2c38] dark:bg-[#15171f]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Completed
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-[#1a1b22] dark:text-white">
                {loading ? "—" : filteredTasks.filter((t) => t.status === "DONE").length}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Pie Chart */}
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 dark:border-[#2a2c38] dark:bg-[#15171f]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#1a1b22] dark:text-white">Task Completion</h2>
                {!loading && total > 0 && (
                  <span className="rounded-full bg-[#dde1ff] px-2.5 py-0.5 text-xs font-semibold text-[#001453]">
                    {completionRate}% done
                  </span>
                )}
              </div>

              {loading ? (
                <div className="h-[260px] animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              ) : total === 0 ? (
                <div className="flex h-[260px] flex-col items-center justify-center text-center">
                  <p className="text-sm text-[#757684] dark:text-[#a8aab8]">No tasks yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={completionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {completionData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COMPLETION_COLORS[index % COMPLETION_COLORS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar Chart */}
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 dark:border-[#2a2c38] dark:bg-[#15171f]">
              <h2 className="mb-4 text-sm font-bold text-[#1a1b22] dark:text-white">Priority Breakdown</h2>

              {loading ? (
                <div className="h-[260px] animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={priorityData}>
                    <XAxis dataKey="priority" stroke="#757684" fontSize={11} />
                    <YAxis stroke="#757684" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {priorityData.map((entry) => (
                        <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}