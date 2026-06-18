import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { Attachment } from "../types";

interface AttachmentSectionProps {
  taskId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/"))
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-purple-500">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  if (mimeType === "application/pdf")
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-rose-500">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-blue-500">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function AttachmentSection({ taskId }: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchAttachments() {
      try {
        const res = await api.get<Attachment[]>(`/tasks/${taskId}/attachments`);
        if (active) setAttachments(res.data);
      } catch (err) {
        if (active) console.error("Failed to fetch attachments", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchAttachments();
    return () => { active = false; };
  }, [taskId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post<Attachment>(`/tasks/${taskId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachments((prev) => [res.data, ...prev]);
      e.target.value = "";
    } catch (err) {
      console.error("Failed to upload file", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
    window.open(`${baseUrl}/api/tasks/${taskId}/attachments/${attachment.id}/download`, "_blank");
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      console.error("Failed to delete attachment", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-[#1a1c26]" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
          Attachments ({attachments.length})
        </h4>
        <label className="cursor-pointer">
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          <span className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] px-2.5 py-1 text-[10px] font-bold text-[#757684] hover:bg-gray-50 dark:border-[#2a2c38] dark:text-[#a8aab8] dark:hover:bg-[#1e202b]">
            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
              <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M12 2v13M12 2l-4 4M12 2l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {uploading ? "Uploading..." : "Upload"}
          </span>
        </label>
      </div>

      {attachments.length === 0 ? (
        <p className="py-4 text-center text-xs text-[#757684] dark:text-[#a8aab8]">
          No attachments yet.
        </p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group flex items-center gap-3 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] p-2.5 dark:border-[#2a2c38] dark:bg-[#0f1117]"
            >
              {getFileIcon(attachment.mimeType)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#1a1b22] dark:text-white">
                  {attachment.originalName}
                </p>
                <p className="text-[10px] text-[#757684] dark:text-[#a8aab8]">
                  {formatFileSize(attachment.size)}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleDownload(attachment)}
                  className="rounded p-1 text-[#00288e] hover:bg-blue-50 dark:text-[#b8c4ff] dark:hover:bg-[#1e40af]/20"
                  title="Download"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  title="Delete"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
