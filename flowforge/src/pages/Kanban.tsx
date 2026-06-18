import { useState, useEffect, useCallback } from "react";
import { socket } from "../socket";
import { api } from "../api/client";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import type { Project, PaginatedResponse } from "../types";
import { KanbanSkeleton } from "../components/Skeleton";
import TaskDetailModal from "../components/TaskDetailModal";
import { useDebounce } from "../hooks/useDebounce";

type Priority = "LOW" | "MEDIUM" | "HIGH";
type Status = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  projectId: string | null;
  assigneeId: string | null;
  dueDate: string | null;
  _count?: { comments: number; attachments: number };
}

const PRIORITY_STYLES: Record<Priority, { pill: string; label: string }> = {
  HIGH: { pill: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400", label: "High" },
  MEDIUM: { pill: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400", label: "Medium" },
  LOW: { pill: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400", label: "Low" },
};

const COLUMNS: { id: Status; title: string; dot: string }[] = [
  { id: "TODO", title: "Todo", dot: "bg-gray-400" },
  { id: "IN_PROGRESS", title: "In Progress", dot: "bg-[#00288e]" },
  { id: "DONE", title: "Done", dot: "bg-emerald-500" },
];

function isOverdue(date: string | null, status: string) {
  if (!date || status === "DONE") return false;
  return new Date(date) < new Date();
}

function formatShortDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Kanban({ searchQuery = "" }: { searchQuery?: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("MEDIUM");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<Status | "ALL">("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);

  const fetchProjectsAndTasks = useCallback(async () => {
    try {
      const [projRes, taskRes, userRes] = await Promise.all([
        api.get<PaginatedResponse<Project>>("/projects"),
        api.get<PaginatedResponse<Task>>("/tasks", {
          params: { search: debouncedSearch || undefined, projectId: selectedProjectId || undefined },
        }),
        api.get<PaginatedResponse<{ id: string; email: string }>>("/users"),
      ]);

      setProjects(projRes.data.data);
      setTasks(taskRes.data.data);
      setUsers(userRes.data.data);

      if (projRes.data.data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projRes.data.data[0].id);
      }
      setError(null);
    } catch {
      setError("Couldn't load sprint board. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedProjectId]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [projRes, taskRes, userRes] = await Promise.all([
          api.get<PaginatedResponse<Project>>("/projects"),
          api.get<PaginatedResponse<Task>>("/tasks", {
            params: { search: debouncedSearch || undefined, projectId: selectedProjectId || undefined },
          }),
          api.get<PaginatedResponse<{ id: string; email: string }>>("/users"),
        ]);
        if (active) {
          setProjects(projRes.data.data);
          setTasks(taskRes.data.data);
          setUsers(userRes.data.data);
          if (projRes.data.data.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projRes.data.data[0].id);
          }
          setError(null);
        }
      } catch {
        if (active) setError("Couldn't load sprint board. Is the backend running?");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [debouncedSearch, selectedProjectId]);

  useEffect(() => {
    socket.on("taskUpdated", (data: { taskId: string; status: Status }) => {
      setTasks((prev) => prev.map((task) => task.id === data.taskId ? { ...task, status: data.status } : task));
    });
    socket.on("tasksChanged", fetchProjectsAndTasks);
    return () => { socket.off("taskUpdated"); socket.off("tasksChanged", fetchProjectsAndTasks); };
  }, [fetchProjectsAndTasks]);

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  const filteredTasks = tasks.filter((task) => {
    const matchesProject = task.projectId === selectedProjectId;
    const matchesPriority = filterPriority === "ALL" || task.priority === filterPriority;
    const matchesStatus = filterStatus === "ALL" || task.status === filterStatus;
    return matchesProject && matchesPriority && matchesStatus;
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || addingTask || !selectedProjectId) return;
    setAddingTask(true);
    try {
      const res = await api.post("/tasks", {
        title: newTaskTitle.trim(),
        status: "TODO",
        priority: newTaskPriority,
        projectId: selectedProjectId,
        assigneeId: newTaskAssignee || null,
        dueDate: newTaskDueDate || null,
      });
      setTasks((prev) => [...prev, res.data]);
      setNewTaskTitle("");
      setNewTaskPriority("MEDIUM");
      setNewTaskAssignee("");
      setNewTaskDueDate("");
      setShowAddTaskModal(false);
      socket.emit("tasksChanged");
    } catch {
      setError("Couldn't add task.");
    } finally {
      setAddingTask(false);
    }
  };

  const updateStatus = async (id: string, newStatus: Status) => {
    const prevTasks = [...tasks];
    setTasks((prev) => prev.map((task) => task.id === id ? { ...task, status: newStatus } : task));
    try {
      await api.put(`/tasks/${id}`, { status: newStatus });
      socket.emit("taskMoved", { taskId: id, status: newStatus });
    } catch {
      setTasks(prevTasks);
      setError("Failed to save task move.");
    }
  };

  const deleteTask = async (id: string) => {
    const prevTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.delete(`/tasks/${id}`);
      socket.emit("tasksChanged");
    } catch {
      setTasks(prevTasks);
      setError("Failed to delete task.");
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    updateStatus(result.draggableId, result.destination.droppableId as Status);
  };

  const getAssigneeInitials = (assigneeId: string | null) => {
    const matched = users.find((u) => u.id === assigneeId);
    if (!matched) return "??";
    return matched.email.split("@")[0].slice(0, 2).toUpperCase();
  };

  const activeFilterCount = (filterPriority !== "ALL" ? 1 : 0) + (filterStatus !== "ALL" ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Board Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">
            <span>Projects</span>
            <span>&rsaquo;</span>
            <select
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent font-bold text-[#00288e] outline-none cursor-pointer dark:text-[#b8c4ff]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-[#15171f] dark:text-white">{p.name}</option>
              ))}
            </select>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
            {activeProject?.name || "Sprint Board"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                activeFilterCount > 0
                  ? "border-[#00288e] bg-[#dde1ff] text-[#001453] dark:border-[#b8c4ff] dark:bg-[#1e40af] dark:text-[#dde1ff]"
                  : "border-[#e2e8f0] bg-white text-[#1a1b22] hover:bg-gray-50 dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-white dark:hover:bg-[#1e202b]"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Filter
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#00288e] text-[8px] font-bold text-white dark:bg-[#b8c4ff] dark:text-[#001453]">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xl dark:border-[#2a2c38] dark:bg-[#15171f]">
                  <div className="mb-3">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">Priority</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                        <button key={p} onClick={() => setFilterPriority(p)} className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${filterPriority === p ? "bg-[#00288e] text-white dark:bg-[#3b52d9]" : "bg-gray-100 text-[#757684] hover:bg-gray-200 dark:bg-[#1a1c26] dark:text-[#a8aab8]"}`}>
                          {p === "ALL" ? "All" : p.charAt(0) + p.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">Status</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
                        <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${filterStatus === s ? "bg-[#00288e] text-white dark:bg-[#3b52d9]" : "bg-gray-100 text-[#757684] hover:bg-gray-200 dark:bg-[#1a1c26] dark:text-[#a8aab8]"}`}>
                          {s === "ALL" ? "All" : s === "IN_PROGRESS" ? "In Progress" : s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { setFilterPriority("ALL"); setFilterStatus("ALL"); }} className="w-full rounded-lg border border-[#e2e8f0] py-1.5 text-[10px] font-bold text-[#757684] hover:bg-gray-50 dark:border-[#2a2c38] dark:text-[#a8aab8]">
                    Clear Filters
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowAddTaskModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#00288e] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#001e70] active:scale-[0.98] dark:bg-[#3b52d9] dark:hover:bg-[#2d42b8]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
            New Task
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      {loading ? <KanbanSkeleton /> : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {COLUMNS.map((column) => {
              const columnTasks = filteredTasks.filter((t) => t.status === column.id);
              return (
                <div key={column.id} className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                      <h3 className="text-sm font-bold text-[#1a1b22] dark:text-white">{column.title}</h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-[#757684] dark:bg-[#1a1c26] dark:text-[#a8aab8]">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex min-h-[300px] flex-col gap-2.5 rounded-2xl bg-[#f8fafc] p-2.5 transition-all dark:bg-[#0b0d12] ${snapshot.isDraggingOver ? "bg-[#dde1ff]/30 dark:bg-[#1e40af]/10" : ""}`}
                      >
                        {columnTasks.length === 0 && (
                          <p className="py-12 text-center text-xs text-[#757684] italic">Drop tasks here</p>
                        )}

                        {columnTasks.map((task, index) => {
                          const isDone = task.status === "DONE";
                          const pillStyles = PRIORITY_STYLES[task.priority];
                          const overdue = isOverdue(task.dueDate, task.status);
                          const dueDateStr = formatShortDate(task.dueDate);

                          return (
                            <Draggable draggableId={task.id} index={index} key={task.id}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setSelectedTask(task)}
                                  className={`group relative cursor-pointer rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xs transition-all hover:shadow-md dark:border-[#2a2c38] dark:bg-[#15171f] ${snapshot.isDragging ? "shadow-lg scale-[1.02]" : ""}`}
                                >
                                  <div className="mb-2.5 flex items-center justify-between">
                                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${isDone ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : pillStyles.pill}`}>
                                      {isDone ? "Completed" : pillStyles.label}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {!isDone && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); updateStatus(task.id, "DONE"); }}
                                          title="Mark as done"
                                          className="rounded p-1 text-emerald-500 opacity-0 transition-opacity hover:bg-emerald-50 group-hover:opacity-100 dark:hover:bg-emerald-500/10"
                                        >
                                          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                        className="rounded p-1 text-rose-500 opacity-0 transition-opacity hover:bg-rose-50 group-hover:opacity-100 dark:hover:bg-rose-500/10"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                                      </button>
                                    </div>
                                  </div>

                                  <p className={`text-sm font-bold leading-snug ${isDone ? "text-[#757684] line-through dark:text-[#a8aab8]" : "text-[#1a1b22] dark:text-white"}`}>
                                    {task.title}
                                  </p>

                                  <div className="mt-3 flex items-center justify-between border-t border-[#f1f5f9] pt-2.5 dark:border-[#2a2c38]">
                                    <div className="flex items-center gap-2">
                                      {dueDateStr && (
                                        <span className={`flex items-center gap-1 text-[10px] font-bold ${overdue ? "text-rose-500" : "text-[#757684] dark:text-[#a8aab8]"}`}>
                                          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
                                          </svg>
                                          {dueDateStr}
                                        </span>
                                      )}
                                      {task._count && task._count.comments > 0 && (
                                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#757684] dark:text-[#a8aab8]">
                                          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" /></svg>
                                          {task._count.comments}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#dde1ff] text-[8px] font-bold text-[#001453]">
                                      {getAssigneeInitials(task.assigneeId)}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* New Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xl dark:border-[#2a2c38] dark:bg-[#15171f] text-[#1a1b22] dark:text-[#f1f0fa]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">New Task</h3>
              <button onClick={() => setShowAddTaskModal(false)} className="rounded-full p-1 text-[#757684] hover:bg-gray-100 dark:hover:bg-[#1e202b]">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Task Title</label>
                <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="e.g. Implement user authentication flow" className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#00288e] focus:ring-2 focus:ring-[#00288e]/10 dark:border-[#2a2c38] dark:bg-[#0f1117]" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Priority</label>
                  <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as Priority)} className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2.5 text-sm outline-none dark:border-[#2a2c38] dark:bg-[#0f1117]">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Due Date</label>
                  <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2.5 text-sm outline-none dark:border-[#2a2c38] dark:bg-[#0f1117]" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Assignee</label>
                <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2.5 text-sm outline-none dark:border-[#2a2c38] dark:bg-[#0f1117]">
                  <option value="">Unassigned</option>
                  {users.map((u) => (<option key={u.id} value={u.id}>{u.email.split("@")[0]}</option>))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddTaskModal(false)} className="rounded-lg border border-[#e4e6eb] px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 dark:border-[#2a2c38]">Cancel</button>
                <button type="submit" disabled={addingTask} className="rounded-lg bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#001e70] disabled:opacity-50 dark:bg-[#3b52d9]">
                  {addingTask ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={fetchProjectsAndTasks} />
      )}
    </div>
  );
}
