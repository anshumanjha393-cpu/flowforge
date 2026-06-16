import { useState, useEffect } from "react";
import { socket } from "../socket";
import { api } from "../api/client";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import type { Project } from "../types";
import { KanbanSkeleton } from "../components/Skeleton";

type Priority = "LOW" | "MEDIUM" | "HIGH";
type Status = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  projectId: string | null;
  assigneeId: string | null;
}

const PRIORITY_STYLES: Record<Priority, { pill: string; label: string }> = {
  HIGH: {
    pill: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    label: "High",
  },
  MEDIUM: {
    pill: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    label: "Medium",
  },
  LOW: {
    pill: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    label: "Low",
  },
};

const COLUMNS: { id: Status; title: string; dot: string }[] = [
  { id: "TODO", title: "Todo", dot: "bg-gray-400" },
  { id: "IN_PROGRESS", title: "In Progress", dot: "bg-[#00288e]" },
  { id: "DONE", title: "Done", dot: "bg-emerald-500" },
];

export default function Kanban({ searchQuery = "" }: { searchQuery?: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New task form modal state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("MEDIUM");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("");
  const [addingTask, setAddingTask] = useState(false);

  // Filter state
  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<Status | "ALL">("ALL");
  const [showFilters, setShowFilters] = useState(false);

  // Load team users for assignee dropdown
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);

  const fetchProjectsAndTasks = async () => {
    try {
      const [projRes, taskRes, userRes] = await Promise.all([
        api.get<Project[]>("/projects"),
        api.get<Task[]>("/tasks"),
        api.get("/users"),
      ]);

      setProjects(projRes.data);
      setTasks(taskRes.data);
      setUsers(userRes.data);

      if (projRes.data.length > 0 && !selectedProjectId) {
        // Set "FlowForge Redesign" or first project as default
        const defaultProj =
          projRes.data.find((p) => p.name.includes("Redesign")) || projRes.data[0];
        setSelectedProjectId(defaultProj.id);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Couldn't load sprint board. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndTasks();
  }, []);

  // Socket synchronization
  useEffect(() => {
    socket.on("taskUpdated", (data: { taskId: string; status: Status }) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === data.taskId ? { ...task, status: data.status } : task
        )
      );
    });

    socket.on("tasksChanged", fetchProjectsAndTasks);

    return () => {
      socket.off("taskUpdated");
      socket.off("tasksChanged");
    };
  }, [selectedProjectId]);

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  // Filter tasks by active project, search query, and filter dropdowns
  const filteredTasks = tasks.filter((task) => {
    const matchesProject = task.projectId === selectedProjectId;
    const matchesSearch = searchQuery.trim()
      ? task.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true;
    const matchesPriority = filterPriority === "ALL" || task.priority === filterPriority;
    const matchesStatus = filterStatus === "ALL" || task.status === filterStatus;
    return matchesProject && matchesSearch && matchesPriority && matchesStatus;
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
      });

      setTasks((prev) => [...prev, res.data]);
      setNewTaskTitle("");
      setNewTaskPriority("MEDIUM");
      setNewTaskAssignee("");
      setShowAddTaskModal(false);
      socket.emit("tasksChanged");
    } catch (err) {
      console.error(err);
      setError("Couldn't add task.");
    } finally {
      setAddingTask(false);
    }
  };

  const updateStatus = async (id: string, newStatus: Status) => {
    try {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, status: newStatus } : task
        )
      );

      await api.put(`/tasks/${id}`, { status: newStatus });
      socket.emit("taskMoved", { taskId: id, status: newStatus });
    } catch (err) {
      console.error(err);
      setError("Failed to save task move.");
    }
  };

  const deleteTask = async (id: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await api.delete(`/tasks/${id}`);
      socket.emit("tasksChanged");
    } catch (err) {
      console.error(err);
      setError("Failed to delete task.");
      fetchProjectsAndTasks();
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as Status;
    updateStatus(taskId, newStatus);
  };

  // Mock icons matching the specific task card layout in the images
  const getCardIcon = (task: Task) => {
    if (task.status === "DONE") {
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-emerald-500">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    if (task.priority === "HIGH") {
      // Pencil or Loop sync icon
      return task.status === "IN_PROGRESS" ? (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-blue-500">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.57-1.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-gray-400">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    if (task.priority === "MEDIUM") {
      // Photo icon
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-gray-400">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }
    // Low: Document icon
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-gray-400">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  };

  // Mock subtask metrics matching image cards exactly
  const getSubtasksLabel = (title: string) => {
    if (title.includes("WebGL")) return "2/5";
    if (title.includes("Tailwind")) return "8/10";
    if (title.includes("Tokens")) return "4/4";
    if (title.includes("Endpoints")) return "1/3";
    if (title.includes("compression")) return "0/2";
    return "0/1";
  };

  const getAssigneeInitials = (assigneeId: string | null) => {
    const matched = users.find((u) => u.id === assigneeId);
    if (!matched) return "??";
    return matched.email.split("@")[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Board Header / Breadcrumbs */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">
            <span>Projects</span>
            <span>›</span>
            {/* Project dropdown switcher */}
            <div className="relative inline-block">
              <select
                value={selectedProjectId || ""}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent font-bold text-[#00288e] dark:text-[#b8c4ff] outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-[#15171f] dark:text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
            {activeProject ? activeProject.name : "Product Launch Roadmap"}
          </h1>
        </div>

        {/* Board actions */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1.5 overflow-hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dde1ff] text-[10px] font-bold text-[#001453] ring-2 ring-white dark:ring-[#0f1117]">SC</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e3e1eb] text-[10px] font-bold text-[#444653] ring-2 ring-white dark:ring-[#0f1117]">MT</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fcd34d] text-[10px] font-bold text-amber-900 ring-2 ring-white dark:ring-[#0f1117]">ER</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-700 ring-2 ring-white dark:ring-[#0f1117] dark:bg-gray-800 dark:text-gray-300">+4</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filterPriority !== "ALL" || filterStatus !== "ALL"
                  ? "border-[#00288e] bg-[#dde1ff] text-[#001453] dark:border-[#b8c4ff] dark:bg-[#1e40af] dark:text-[#dde1ff]"
                  : "border-[#e2e8f0] bg-white text-[#1a1b22] hover:bg-gray-50 dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-white dark:hover:bg-[#1e202b]"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Filter
              {(filterPriority !== "ALL" || filterStatus !== "ALL") && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00288e] text-[8px] font-bold text-white dark:bg-[#b8c4ff] dark:text-[#001453]">
                  {(filterPriority !== "ALL" ? 1 : 0) + (filterStatus !== "ALL" ? 1 : 0)}
                </span>
              )}
            </button>

            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-lg dark:border-[#2a2c38] dark:bg-[#15171f]">
                  <div className="mb-3">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
                      Priority
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setFilterPriority(p)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                            filterPriority === p
                              ? "bg-[#00288e] text-white dark:bg-[#3b52d9]"
                              : "bg-gray-100 text-[#757684] hover:bg-gray-200 dark:bg-[#1a1c26] dark:text-[#a8aab8] dark:hover:bg-[#2a2c38]"
                          }`}
                        >
                          {p === "ALL" ? "All" : p.charAt(0) + p.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilterStatus(s)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                            filterStatus === s
                              ? "bg-[#00288e] text-white dark:bg-[#3b52d9]"
                              : "bg-gray-100 text-[#757684] hover:bg-gray-200 dark:bg-[#1a1c26] dark:text-[#a8aab8] dark:hover:bg-[#2a2c38]"
                          }`}
                        >
                          {s === "ALL" ? "All" : s === "IN_PROGRESS" ? "In Progress" : s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setFilterPriority("ALL");
                      setFilterStatus("ALL");
                    }}
                    className="w-full rounded-lg border border-[#e2e8f0] py-1.5 text-[10px] font-bold text-[#757684] hover:bg-gray-50 dark:border-[#2a2c38] dark:text-[#a8aab8] dark:hover:bg-[#1a1c26]"
                  >
                    Clear Filters
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowAddTaskModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-[#3b52d9]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            New Task
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Kanban Board Grid */}
      {loading ? (
        <KanbanSkeleton />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {COLUMNS.map((column) => {
              const columnTasks = filteredTasks.filter((t) => t.status === column.id);

              return (
                <div key={column.id} className="flex flex-col">
                  {/* Column Header */}
                  <div className="mb-4 flex items-center justify-between px-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                      <h3 className="text-sm font-bold text-[#1a1b22] dark:text-white">
                        {column.title}
                      </h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-[#757684] dark:bg-[#1a1c26] dark:text-[#a8aab8]">
                        {columnTasks.length}
                      </span>
                    </div>

                    <button className="text-[#757684] hover:text-[#1a1b22] dark:hover:text-white">
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                        <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
                        <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
                        <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex min-h-[300px] flex-col gap-3 rounded-2xl bg-[#f8fafc] p-2.5 transition-all dark:bg-[#0b0d12] ${
                          snapshot.isDraggingOver
                            ? "bg-[#dde1ff]/30 dark:bg-[#1e40af]/10"
                            : ""
                        }`}
                      >
                        {columnTasks.length === 0 && (
                          <p className="py-12 text-center text-xs text-[#757684] italic">
                            Drop tasks here
                          </p>
                        )}

                        {columnTasks.map((task, index) => {
                          const isDone = task.status === "DONE";
                          const pillStyles = PRIORITY_STYLES[task.priority];

                          return (
                            <Draggable draggableId={task.id} index={index} key={task.id}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`group relative rounded-xl border border-[#e2e8f0] bg-white p-4.5 shadow-xs transition-shadow hover:shadow-md dark:border-[#2a2c38] dark:bg-[#15171f] ${
                                    snapshot.isDragging ? "shadow-lg scale-[1.02]" : ""
                                  }`}
                                >
                                  {/* Task Top: Priority Badges & Icons */}
                                  <div className="mb-3.5 flex items-center justify-between">
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                        isDone
                                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                          : pillStyles.pill
                                      }`}
                                    >
                                      {isDone ? "Completed" : pillStyles.label}
                                    </span>

                                    {getCardIcon(task)}
                                  </div>

                                  {/* Title */}
                                  <p
                                    className={`text-sm font-bold leading-snug ${
                                      isDone
                                        ? "text-[#757684] line-through dark:text-[#a8aab8]"
                                        : "text-[#1a1b22] dark:text-white"
                                    }`}
                                  >
                                    {task.title}
                                  </p>

                                  {/* Card Bottom: Subtasks & User Avatar */}
                                  <div className="mt-4.5 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-[#2a2c38]">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#757684] dark:text-[#a8aab8]">
                                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                        <path d="M17 3H7a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4z" stroke="currentColor" strokeWidth="2" />
                                        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                      </svg>
                                      <span>{getSubtasksLabel(task.title)}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {/* Delete button visible on hover */}
                                      <button
                                        onClick={() => deleteTask(task.id)}
                                        className="rounded-lg p-1 text-rose-500 opacity-0 transition-opacity hover:bg-rose-50 group-hover:opacity-100 dark:hover:bg-rose-500/10"
                                        title="Delete task"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      </button>

                                      <div className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#dde1ff] text-[8px] font-bold text-[#001453]">
                                        {getAssigneeInitials(task.assigneeId)}
                                      </div>
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
          <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl dark:border-[#2a2c38] dark:bg-[#15171f] text-[#1a1b22] dark:text-[#f1f0fa]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">New Task</h3>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                className="rounded-full p-1 text-[#757684] hover:bg-gray-100 dark:hover:bg-[#1e202b]"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Task Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Implement user authentication flow"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                    className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">Assignee</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117]"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email.split("@")[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="rounded-lg border border-[#e4e6eb] px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingTask}
                  className="rounded-lg bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-[#3b52d9]"
                >
                  {addingTask ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}