import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { toast } from "sonner";

interface ShareLink {
  id: string;
  projectId: string;
  token: string;
  role: "VIEWER" | "EDITOR";
  userId: string;
  expiresAt: string | null;
  createdAt: string;
  user?: { id: string; email: string; name: string | null };
}

export default function BoardShareManage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newRole, setNewRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [expiry, setExpiry] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get(`/board-shares?projectId=${projectId}`);
        if (active) setShares(res.data.data || []);
      } catch {
        if (!active) return;
        toast.error("Failed to load share links");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [projectId]);

  const fetchShares = async () => {
    try {
      const res = await api.get(`/board-shares?projectId=${projectId}`);
      setShares(res.data.data || []);
    } catch {
      toast.error("Failed to load share links");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/board-shares", {
        projectId,
        role: newRole,
        expiresAt: expiry ? new Date(expiry).toISOString() : null,
      });
      setShowModal(false);
      setExpiry("");
      toast.success("Share link created");
      fetchShares();
    } catch {
      toast.error("Failed to create share link");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.delete(`/board-shares/${id}`);
      toast.success("Share link revoked");
      fetchShares();
    } catch {
      toast.error("Failed to revoke link");
    }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
    toast.success("Link copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#00288e]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Board Share Links</h1>
          <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">Manage public share links for this project</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-xl bg-[#00288e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#001e70] dark:bg-[#3b52d9] dark:hover:bg-[#2d42b8]"
        >
          + Create Link
        </button>
      </div>

      {shares.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e2e8f0] bg-white p-12 text-center dark:border-[#2a2c38] dark:bg-[#15171f]">
          <p className="text-sm text-[#757684] dark:text-[#a8aab8]">No share links yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white dark:border-[#2a2c38] dark:bg-[#15171f]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-xs font-semibold uppercase tracking-wider text-[#757684] dark:border-[#2a2c38] dark:bg-[#1a1c26] dark:text-[#a8aab8]">
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#2a2c38]">
              {shares.map((share) => (
                <tr key={share.id} className="transition-colors hover:bg-[#f8fafc] dark:hover:bg-[#1a1c26]">
                  <td className="px-4 py-3 font-mono text-xs text-[#1a1b22] dark:text-[#f1f0fa]">
                    {share.token.slice(0, 12)}...
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      share.role === "EDITOR"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300"
                    }`}>
                      {share.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#757684] dark:text-[#a8aab8]">
                    {share.user?.email || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#757684] dark:text-[#a8aab8]">
                    {share.expiresAt ? new Date(share.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyLink(share.token)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-[#00288e] hover:bg-[#dde1ff] dark:text-[#b8c4ff] dark:hover:bg-[#1e40af]/30"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleRevoke(share.id)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xl dark:border-[#2a2c38] dark:bg-[#15171f]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Create Share Link</h3>
              <button onClick={() => setShowModal(false)} className="rounded-full p-1 text-[#757684] hover:bg-gray-100 dark:hover:bg-[#1e202b]">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Access Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "VIEWER" | "EDITOR")}
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2.5 text-sm dark:border-[#2a2c38] dark:bg-[#0f1117]"
                >
                  <option value="VIEWER">Viewer (Read-only)</option>
                  <option value="EDITOR">Editor (Can update tasks)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2.5 text-sm dark:border-[#2a2c38] dark:bg-[#0f1117]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-[#e4e6eb] px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="rounded-lg bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#001e70] disabled:opacity-50 dark:bg-[#3b52d9]">
                  {creating ? "Creating..." : "Create Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
