import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Comment } from "../types";

interface CommentSectionProps {
  taskId: string;
  projectId?: string | null;
}

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function CommentSection({ taskId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function fetchComments() {
      try {
        const res = await api.get<Comment[]>(`/tasks/${taskId}/comments`);
        if (active) setComments(res.data);
      } catch (err) {
        if (active) console.error("Failed to fetch comments", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchComments();
    return () => { active = false; };
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || sending) return;

    setSending(true);
    try {
      const res = await api.post<Comment>(`/tasks/${taskId}/comments`, {
        content: newComment.trim(),
      });
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await api.delete(`/tasks/${taskId}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-[#1a1c26]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
        Comments ({comments.length})
      </h4>

      <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#757684] dark:text-[#a8aab8]">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          comments.map((comment) => {
            const isOwn = comment.userId === user?.id;
            return (
              <div
                key={comment.id}
                className="group rounded-lg border border-[#f1f5f9] bg-[#f8fafc] p-3 dark:border-[#2a2c38] dark:bg-[#0f1117]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dde1ff] text-[8px] font-bold text-[#001453]">
                      {comment.user.email.split("@")[0].slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold text-[#1a1b22] dark:text-white">
                      {comment.user.name || comment.user.email.split("@")[0]}
                    </span>
                    <span className="text-[10px] text-[#757684] dark:text-[#a8aab8]">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="rounded p-1 text-rose-500 opacity-0 transition-opacity hover:bg-rose-50 group-hover:opacity-100 dark:hover:bg-rose-500/10"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-[#1a1b22] dark:text-[#f1f0fa]">{comment.content}</p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-xs outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117]"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || sending}
          className="rounded-lg bg-[#00288e] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-[#3b52d9]"
        >
          {sending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
