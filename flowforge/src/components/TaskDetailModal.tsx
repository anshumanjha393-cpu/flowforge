import { useState, useEffect } from "react";
import { api } from "../api/client";
import { socket } from "../socket";
import CommentSection from "./CommentSection";
import AttachmentSection from "./AttachmentSection";

interface TaskDetailModalProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate?: string | null;
    assigneeId?: string | null;
    projectId?: string | null;
  };
  onClose: () => void;
  onUpdate?: () => void;
}

export default function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"comments" | "attachments">("comments");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || "");
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);

  useEffect(() => {
    api.get("/users").then((res) => setUsers(res.data.data || [])).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/tasks/${task.id}`, {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
      });
      socket.emit("tasksChanged");
      onUpdate?.();
      setEditing(false);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "No due date";
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl dark:border-[#2a2c38] dark:bg-[#15171f]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e2e8f0] px-6 py-4 dark:border-[#2a2c38]">
          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-base font-bold outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white"
              />
            ) : (
              <h3 className="font-display text-base font-bold text-[#1a1b22] dark:text-white">
                {task.title}
              </h3>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {editing ? (
                <>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-[#e4e6eb] bg-white px-2.5 py-1 text-[11px] font-bold outline-none dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white"
                  >
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="rounded-lg border border-[#e4e6eb] bg-white px-2.5 py-1 text-[11px] font-bold outline-none dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </>
              ) : (
                <>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    task.status === "DONE"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : task.status === "IN_PROGRESS"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400"
                  }`}>
                    {task.status.replace("_", " ")}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    task.priority === "HIGH"
                      ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                      : task.priority === "MEDIUM"
                      ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                      : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                  }`}>
                    {task.priority}
                  </span>
                  {isOverdue && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                      Overdue
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-[#e4e6eb] px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-[#00288e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#001e70] disabled:opacity-50 dark:bg-[#3b52d9]"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg border border-[#e4e6eb] px-3 py-1.5 text-xs font-semibold text-[#757684] hover:bg-gray-50 dark:border-[#2a2c38] dark:text-[#a8aab8] dark:hover:bg-[#1e202b]"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[#757684] hover:bg-gray-100 dark:hover:bg-[#1e202b]"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Task Info Row */}
        <div className="flex items-center gap-4 border-b border-[#f1f5f9] px-6 py-3 dark:border-[#2a2c38]">
          <div className="flex items-center gap-2 text-xs text-[#757684] dark:text-[#a8aab8]">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {editing ? (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded border border-[#e4e6eb] bg-white px-2 py-1 text-xs outline-none dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white"
              />
            ) : (
              <span className={isOverdue ? "font-bold text-rose-600 dark:text-rose-400" : ""}>
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#757684] dark:text-[#a8aab8]">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {editing ? (
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="rounded border border-[#e4e6eb] bg-white px-2 py-1 text-xs outline-none dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.email.split("@")[0]}</option>
                ))}
              </select>
            ) : (
              <span>{task.assigneeId ? users.find((u) => u.id === task.assigneeId)?.email.split("@")[0] || "Assigned" : "Unassigned"}</span>
            )}
          </div>
        </div>

        {/* Description */}
        {(editing || description) && (
          <div className="border-b border-[#f1f5f9] px-6 py-3 dark:border-[#2a2c38]">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">Description</p>
            {editing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={3}
                className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-xs outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white"
              />
            ) : (
              <p className="text-xs text-[#757684] dark:text-[#a8aab8]">{description || "No description"}</p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#e2e8f0] px-6 dark:border-[#2a2c38]">
          <button
            onClick={() => setActiveTab("comments")}
            className={`border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === "comments"
                ? "border-[#00288e] text-[#00288e] dark:border-[#b8c4ff] dark:text-[#b8c4ff]"
                : "border-transparent text-[#757684] hover:text-[#1a1b22] dark:text-[#a8aab8]"
            }`}
          >
            Comments
          </button>
          <button
            onClick={() => setActiveTab("attachments")}
            className={`border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
              activeTab === "attachments"
                ? "border-[#00288e] text-[#00288e] dark:border-[#b8c4ff] dark:text-[#b8c4ff]"
                : "border-transparent text-[#757684] hover:text-[#1a1b22] dark:text-[#a8aab8]"
            }`}
          >
            Attachments
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "comments" ? (
            <CommentSection taskId={task.id} projectId={task.projectId} />
          ) : (
            <AttachmentSection taskId={task.id} />
          )}
        </div>
      </div>
    </div>
  );
}
