import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
} from "recharts";
import { api } from "../api/client";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";
import type { Project, Task, Activity, PaginatedResponse } from "../types";
import { DashboardSkeleton } from "../components/Skeleton";

const COMPLETION_COLORS = ["#00288e", "#e2e8f0"];
const PRIORITY_COLORS = { HIGH: "#e11d48", MEDIUM: "#f59e0b", LOW: "#10b981" };

const isDark = () => typeof document !== "undefined" && document.documentElement.classList.contains("dark");

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface DashboardProps {
  searchQuery?: string;
  onNavigate?: (page: string) => void;
}

export default function Dashboard({ searchQuery = "" }: DashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">("overview");
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTitle] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [projRes, taskRes, actRes] = await Promise.all([
          api.get<PaginatedResponse<Project>>("/projects"),
          api.get<PaginatedResponse<Task>>("/tasks"),
          api.get<PaginatedResponse<Activity>>("/activities"),
        ]);
        if (active) {
          setProjects(projRes.data.data);
          setTasks(taskRes.data.data);
          setActivities(actRes.data.data);
          setError(null);
        }
      } catch {
        if (active) setError("Failed to fetch dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleSync = async () => {
      try {
        const [projRes, taskRes, actRes] = await Promise.all([
          api.get<PaginatedResponse<Project>>("/projects"),
          api.get<PaginatedResponse<Task>>("/tasks"),
          api.get<PaginatedResponse<Activity>>("/activities"),
        ]);
        setProjects(projRes.data.data);
        setTasks(taskRes.data.data);
        setActivities(actRes.data.data);
        setError(null);
      } catch {
        setError("Failed to fetch dashboard data.");
      }
    };
    socket.on("tasksChanged", handleSync);
    socket.on("activitiesChanged", handleSync);
    socket.on("taskUpdated", handleSync);
    return () => { socket.off("tasksChanged", handleSync); socket.off("activitiesChanged", handleSync); socket.off("taskUpdated", handleSync); };
  }, []);

  const q = searchQuery?.trim().toLowerCase() ?? "";
  const filteredProjects = q ? projects.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) : projects;
  const filteredTasks = q ? tasks.filter((t) => t.title.toLowerCase().includes(q)) : tasks;

  const myTasks = useMemo(() => {
    return user ? filteredTasks.filter((t) => t.assigneeId === user.id) : [];
  }, [filteredTasks, user]);

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === "DONE" ? "TODO" : "DONE";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    try {
      await api.put(`/tasks/${task.id}`, { status: nextStatus });
      socket.emit("taskMoved", { taskId: task.id, status: nextStatus });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  };

  const handleAddTaskInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;
    try {
      await api.post("/tasks", { title: newTaskTitle.trim(), status: "TODO", priority: "MEDIUM", assigneeId: user.id });
      setNewTitle("");
      setShowAddTask(false);
      socket.emit("tasksChanged");
    } catch { /* */ }
  };

  const activeProjectsCount = filteredProjects.filter((p) => p.status === "IN_PROGRESS").length;
  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.status === "DONE").length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  const completionData = [{ name: "Completed", value: completed }, { name: "Remaining", value: total - completed }];
  const priorityData = (["HIGH", "MEDIUM", "LOW"] as const).map((priority) => ({ priority, count: filteredTasks.filter((task) => task.priority === priority).length }));
  const tooltipStyle = { background: isDark() ? "#15171f" : "#ffffff", border: `1px solid ${isDark() ? "#2a2c38" : "#e2e8f0"}`, borderRadius: "8px", color: isDark() ? "#f1f0fa" : "#1a1b22", fontSize: "13px" };
  const displayName = user?.name?.split(" ")[0] || (user?.email ? user.email.split("@")[0] : "User");

  function getActivityIcon(action: string) {
    const s = { CREATED: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", MOVED: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", COMPLETED: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", COMMENTED: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400", UPLOADED: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400", INVITED: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", DELETED: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" }[action] || "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400";
    const icons: Record<string, React.ReactElement> = {
      CREATED: <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      MOVED: <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      COMPLETED: <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      COMMENTED: <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2"/></svg>,
      UPLOADED: <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M12 2v13M12 2l-4 4M12 2l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    };
    return <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${s}`}>{icons[action] || icons.CREATED}</div>;
  }

  return (
    <div className="space-y-5">
      {loading && <DashboardSkeleton />}
      {!loading && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
                Good morning, {displayName}
              </h1>
              <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
                You have {activeProjectsCount} projects requiring attention today.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex rounded-lg bg-white p-0.5 shadow-xs dark:bg-[#15171f] border border-[#e2e8f0] dark:border-[#2a2c38]">
                {(["overview", "analytics"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${activeTab === tab ? "bg-[#00288e] text-white dark:bg-[#3b52d9]" : "text-[#757684] hover:text-[#1a1b22] dark:text-[#a8aab8]"}`}>
                    {tab === "overview" ? "Overview" : "Analytics"}
                  </button>
                ))}
              </div>
              <button onClick={() => navigate("/team")} className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a1b22] hover:bg-gray-50 dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-white dark:hover:bg-[#1e202b]">
                Manage Team
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Active Projects */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#1a1b22] dark:text-white">Active Projects</h2>
                  <button onClick={() => navigate("/projects")} className="text-xs font-semibold text-[#00288e] hover:underline dark:text-[#b8c4ff]">View All</button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProjects.slice(0, 3).map((project) => {
                    const formattedDate = project.dueDate ? new Date(project.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No date";
                    return (
                      <div key={project.id} className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-[#2a2c38] dark:bg-[#15171f]">
                        <div className="mb-3 flex items-center justify-between">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${project.priority === "HIGH" ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"}`}>
                            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${project.priority === "HIGH" ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" : project.priority === "MEDIUM" ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" : "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"}`}>
                            {project.priority === "HIGH" ? "High" : project.priority === "MEDIUM" ? "In Progress" : "Low"}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-[#1a1b22] dark:text-white">{project.name}</h3>
                        <p className="mt-1 line-clamp-2 text-xs text-[#757684] dark:text-[#a8aab8]">{project.description}</p>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#1a1b22] dark:text-[#f1f0fa]">
                            <span>Progress</span><span>{project.progress}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#f1f5f9] dark:bg-[#2a2c38]">
                            <div className="h-full rounded-full bg-[#00288e] dark:bg-[#b8c4ff]" style={{ width: `${project.progress}%` }} />
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-[#f1f5f9] pt-3 dark:border-[#2a2c38]">
                          <div className="flex items-center gap-1.5 text-xs text-[#757684] dark:text-[#a8aab8]">
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/></svg>
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Productivity Banner */}
              <div className="flex flex-col justify-between rounded-2xl bg-[#00288e] p-6 text-white shadow-xs md:flex-row md:items-center dark:bg-[#1e40af]">
                <div className="max-w-xl">
                  <h3 className="font-display text-lg font-bold">Productivity Overview</h3>
                  <p className="mt-1 text-sm text-white/80">Your team completed {completionRate}% of all tasks. Keep up the great work!</p>
                </div>
                <div className="mt-4 flex items-center gap-8 border-t border-white/20 pt-4 md:mt-0 md:border-0 md:pt-0">
                  <div className="text-center">
                    <span className="block text-2xl font-bold font-display">{completed}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Completed</span>
                  </div>
                  <div className="h-8 w-[1px] bg-white/25" />
                  <div className="text-center">
                    <span className="block text-2xl font-bold font-display">{tasks.filter((t) => t.status === "IN_PROGRESS").length}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">In Progress</span>
                  </div>
                </div>
              </div>

              {/* My Tasks & Activity */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="lg:col-span-5 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#1a1b22] dark:text-white">My Tasks</h2>
                  </div>
                  <div className="space-y-2">
                    {myTasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-3 rounded-lg border border-[#f1f5f9] p-3 hover:bg-[#f8fafc] dark:border-[#2a2c38] dark:hover:bg-[#1e202b]">
                        <input type="checkbox" checked={task.status === "DONE"} onChange={() => handleToggleTask(task)} className="mt-0.5 h-4 w-4 rounded border-[#e4e6eb] text-[#00288e] dark:border-[#2a2c38]" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold leading-snug ${task.status === "DONE" ? "text-[#757684] line-through dark:text-[#a8aab8]" : "text-[#1a1b22] dark:text-[#f1f0fa]"}`}>{task.title}</p>
                          <p className="mt-1 text-[11px] font-bold text-[#757684] dark:text-[#a8aab8]">Priority: {task.priority.toLowerCase()}</p>
                        </div>
                      </div>
                    ))}
                    {showAddTask ? (
                      <form onSubmit={handleAddTaskInline} className="mt-2 flex items-center gap-2">
                        <input type="text" value={newTaskTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add task title..." className="flex-1 rounded-lg border border-[#e4e6eb] bg-white px-3 py-1.5 text-xs outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117]" required autoFocus />
                        <button type="submit" className="rounded-lg bg-[#00288e] px-3 py-1.5 text-xs font-semibold text-white dark:bg-[#3b52d9]">Add</button>
                        <button type="button" onClick={() => setShowAddTask(false)} className="rounded-lg border border-[#e4e6eb] px-3 py-1.5 text-xs font-semibold dark:border-[#2a2c38]">Cancel</button>
                      </form>
                    ) : (
                      <button onClick={() => setShowAddTask(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#e4e6eb] py-3 text-xs font-bold text-[#757684] hover:bg-[#f8fafc] dark:border-[#2a2c38] dark:hover:bg-[#1a1c26]">
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
                        Add Task
                      </button>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-7 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#1a1b22] dark:text-white">Recent Activity</h2>
                    <button onClick={() => navigate("/activities")} className="text-xs font-semibold text-[#00288e] hover:underline dark:text-[#b8c4ff]">View All</button>
                  </div>
                  <div className="space-y-3">
                    {activities.length === 0 ? (
                      <p className="text-xs text-[#757684] dark:text-[#a8aab8]">No activity logged yet.</p>
                    ) : (
                      activities.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          {getActivityIcon(activity.action)}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-[#757684] dark:text-[#a8aab8]">
                              {activity.details.split(" ").map((word, wIdx) => {
                                const isBold = word.startsWith("Sarah") || word.startsWith("Marcus") || word.startsWith("Elena") || word.startsWith("Alex") || word.includes("\"");
                                return <span key={wIdx} className={isBold ? "font-bold text-[#1a1b22] dark:text-white" : ""}>{word}{" "}</span>;
                              })}
                            </p>
                            <span className="mt-0.5 block text-[10px] text-[#757684]/70 dark:text-[#a8aab8]/60">{formatRelativeTime(activity.timestamp)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === "analytics" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Total Tasks", value: total, color: "text-[#1a1b22] dark:text-white" },
                  { label: "Todo", value: filteredTasks.filter((t) => t.status === "TODO").length, color: "text-gray-500" },
                  { label: "In Progress", value: filteredTasks.filter((t) => t.status === "IN_PROGRESS").length, color: "text-[#00288e]" },
                  { label: "Completed", value: completed, color: "text-emerald-500" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-[#e2e8f0] bg-white p-4 dark:border-[#2a2c38] dark:bg-[#15171f]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">{stat.label}</p>
                    <p className={`mt-2 font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 dark:border-[#2a2c38] dark:bg-[#15171f]">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#1a1b22] dark:text-white">Task Completion</h2>
                    {total > 0 && <span className="rounded-full bg-[#dde1ff] px-2.5 py-0.5 text-xs font-semibold text-[#001453]">{completionRate}% done</span>}
                  </div>
                  {total === 0 ? (
                    <div className="flex h-[260px] flex-col items-center justify-center"><p className="text-sm text-[#757684]">No tasks yet</p></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={completionData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                          {completionData.map((_, index) => (<Cell key={index} fill={COMPLETION_COLORS[index]} stroke="none" />))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend formatter={(value) => <span className="text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 dark:border-[#2a2c38] dark:bg-[#15171f]">
                  <h2 className="mb-4 text-sm font-bold text-[#1a1b22] dark:text-white">Priority Breakdown</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={priorityData}>
                      <XAxis dataKey="priority" stroke="#757684" fontSize={11} />
                      <YAxis stroke="#757684" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                        {priorityData.map((entry) => (<Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority]} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
