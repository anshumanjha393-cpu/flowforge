import { useState, useEffect } from "react";
import axios from "axios";
import { socket } from "../socket";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

type Priority = "LOW" | "MEDIUM" | "HIGH";
type Status = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
}

const API_URL = "http://localhost:5001/api/tasks";

// Priority -> accent styling. Keep this as the one place that maps
// data to color, so the rest of the UI just reads from it.
const PRIORITY_STYLES: Record<
  Priority,
  { bar: string; pill: string; label: string }
> = {
  HIGH: {
    bar: "bg-rose-400",
    pill: "bg-rose-400/10 text-rose-300 ring-1 ring-inset ring-rose-400/30",
    label: "High",
  },
  MEDIUM: {
    bar: "bg-amber-400",
    pill: "bg-amber-400/10 text-amber-300 ring-1 ring-inset ring-amber-400/30",
    label: "Medium",
  },
  LOW: {
    bar: "bg-emerald-400",
    pill: "bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/30",
    label: "Low",
  },
};

const COLUMNS: { id: Status; title: string; dot: string }[] = [
  { id: "TODO", title: "Todo", dot: "bg-slate-400" },
  { id: "IN_PROGRESS", title: "In Progress", dot: "bg-sky-400" },
  { id: "DONE", title: "Done", dot: "bg-emerald-400" },
];

function Kanban() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(socket.connected);

  // --- load tasks from backend ---
  const fetchTasks = () => {
    axios
      .get(API_URL)
      .then((res) => {
        setTasks(res.data);
        setError(null);
      })
      .catch((err) => {
        console.log(err);
        setError("Couldn't load tasks. Is the backend running?");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // --- socket sync ---
// ✅ Fixed — define handlers outside .on() so you can reference them
useEffect(() => {
  const onConnect    = () => setConnected(true);
  const onDisconnect = () => setConnected(false);
  const onTaskUpdated = (data: { taskId: string; status: Status }) => {
    setTasks((prev) =>
      prev.map((t) => t.id === data.taskId ? { ...t, status: data.status } : t)
    );
  };

  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);
  socket.on("taskUpdated", onTaskUpdated);
  socket.on("tasksChanged", fetchTasks);

  return () => {
    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);
    socket.off("taskUpdated", onTaskUpdated);
    socket.off("tasksChanged", fetchTasks);
  };
}, []); // fetchTasks is stable so this is fine

  // --- add task with priority ---
  const [newTask, setNewTask] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [adding, setAdding] = useState(false);

  const addTask = () => {
    if (!newTask.trim() || adding) return;
    setAdding(true);

    axios
      .post(API_URL, { title: newTask, status: "TODO", priority })
      .then((res) => {
        setTasks((prev) => [...prev, res.data]);
        setNewTask("");
        socket.emit("tasksChanged");
      })
      .catch((err) => {
        console.log(err);
        setError("Couldn't add the task. Try again.");
      })
      .finally(() => setAdding(false));
  };

  // --- persist a status change (used by drag, arrows) ---
  const updateStatus = (id: string, newStatus: Status) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, status: newStatus } : task
      )
    );

    axios
      .put(`${API_URL}/${id}`, { status: newStatus })
      .then(() => {
        socket.emit("taskMoved", { taskId: id, status: newStatus });
      })
      .catch((err) => {
        console.log(err);
        setError("Couldn't save that move. Refresh to resync.");
      });
  };

  const moveLeft = (task: Task) => {
    if (task.status === "IN_PROGRESS") updateStatus(task.id, "TODO");
    else if (task.status === "DONE") updateStatus(task.id, "IN_PROGRESS");
  };

  const moveRight = (task: Task) => {
    if (task.status === "TODO") updateStatus(task.id, "IN_PROGRESS");
    else if (task.status === "IN_PROGRESS") updateStatus(task.id, "DONE");
  };

  // --- delete ---
  const deleteTask = (id: string) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== id));

    axios
      .delete(`${API_URL}/${id}`)
      .then(() => {
        socket.emit("tasksChanged");
      })
      .catch((err) => {
        console.log(err);
        setError("Couldn't delete the task.");
        setTasks(previous); // roll back
      });
  };

  // --- drag and drop ---
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const taskId = result.draggableId; // already a string (UUID)
    const newStatus = result.destination.droppableId as Status;

    updateStatus(taskId, newStatus);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/10 ring-1 ring-inset ring-emerald-400/30">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-emerald-400"
              >
                <path
                  d="M12 2L4 12l8 10 8-10-8-10z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 2v20M4 12h16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-50">
                FlowForge
              </h1>
              <p className="text-sm text-slate-500">Sprint board</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-emerald-400" : "bg-slate-500"
              }`}
            />
            {connected ? "Live" : "Offline"}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Add task bar */}
        <div className="mb-8 flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a task..."
            className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <div className="flex gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none focus:border-emerald-400/50"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <button
              onClick={addTask}
              disabled={adding}
              className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {adding ? "Adding..." : "Add task"}
            </button>
          </div>
        </div>

        {/* Board */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div
                key={column.id}
                className="h-40 animate-pulse rounded-xl border border-slate-800 bg-slate-900/40"
              />
            ))}
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {COLUMNS.map((column) => {
                const columnTasks = tasks.filter(
                  (t) => t.status === column.id
                );

                return (
                  <Droppable droppableId={column.id} key={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`rounded-xl border p-3 transition-colors ${
                          snapshot.isDraggingOver
                            ? "border-emerald-400/40 bg-slate-900"
                            : "border-slate-800 bg-slate-900/40"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${column.dot}`}
                            />
                            <h2 className="text-sm font-medium text-slate-200">
                              {column.title}
                            </h2>
                          </div>
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                            {columnTasks.length}
                          </span>
                        </div>

                        <div className="flex min-h-[60px] flex-col gap-2">
                          {columnTasks.length === 0 && (
                            <p className="rounded-lg border border-dashed border-slate-800 px-3 py-6 text-center text-xs text-slate-600">
                              Drop tasks here
                            </p>
                          )}

                          {columnTasks.map((task, index) => {
                            const accent = PRIORITY_STYLES[task.priority];

                            return (
                              <Draggable
                                draggableId={task.id}
                                index={index}
                                key={task.id}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`group relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900 pl-3 transition-shadow ${
                                      snapshot.isDragging
                                        ? "shadow-lg shadow-black/40 ring-1 ring-emerald-400/30"
                                        : ""
                                    }`}
                                  >
                                    <span
                                      className={`absolute left-0 top-0 h-full w-1 ${accent.bar}`}
                                    />

                                    <div className="px-3 py-2.5">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm text-slate-200">
                                          {task.title}
                                        </p>

                                        <button
                                          onClick={() => deleteTask(task.id)}
                                          aria-label="Delete task"
                                          className="rounded-md p-1 text-slate-600 opacity-0 transition-opacity hover:bg-rose-400/10 hover:text-rose-400 group-hover:opacity-100"
                                        >
                                          <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            className="h-3.5 w-3.5"
                                          >
                                            <path
                                              d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 11.2A2 2 0 0 1 14.2 20H9.8a2 2 0 0 1-2-1.8L7 7"
                                              stroke="currentColor"
                                              strokeWidth="1.6"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        </button>
                                      </div>

                                      <div className="mt-2 flex items-center justify-between">
                                        <span
                                          className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${accent.pill}`}
                                        >
                                          {accent.label}
                                        </span>

                                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                          <button
                                            onClick={() => moveLeft(task)}
                                            disabled={task.status === "TODO"}
                                            aria-label="Move left"
                                            className="rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-200 disabled:opacity-30"
                                          >
                                            ←
                                          </button>
                                          <button
                                            onClick={() => moveRight(task)}
                                            disabled={task.status === "DONE"}
                                            aria-label="Move right"
                                            className="rounded-md border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-200 disabled:opacity-30"
                                          >
                                            →
                                          </button>
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
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}

export default Kanban;
