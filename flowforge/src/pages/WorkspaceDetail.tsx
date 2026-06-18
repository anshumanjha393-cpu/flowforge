import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Role, Workspace } from "../types";

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  MANAGER: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  MEMBER: "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400",
};

export default function WorkspaceDetail() {
  const { id } = useParams<{ id: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    api
      .get<Workspace>(`/workspaces/${id}`)
      .then((res) => {
        if (active) { setWorkspace(res.data); setError(null); }
      })
      .catch(() => {
        if (active) setError("Failed to load workspace.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const fetchWorkspace = async () => {
    if (!id) return;
    setLoading(true);
    api
      .get<Workspace>(`/workspaces/${id}`)
      .then((res) => {
        setWorkspace(res.data);
        setError(null);
      })
      .catch(() => {
        setError("Failed to load workspace.");
      })
      .finally(() => setLoading(false));
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !id) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      await api.post(`/workspaces/${id}/members`, { email: inviteEmail.trim() });
      setInviteEmail("");
      fetchWorkspace();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to invite member";
      setInviteError(message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;
    try {
      await api.delete(`/workspaces/${id}/members/${memberId}`);
      setWorkspace((prev) =>
        prev
          ? { ...prev, members: prev.members?.filter((m) => m.id !== memberId) }
          : prev
      );
    } catch {
      setError("Failed to remove member.");
    }
  };

  const handleRoleChange = async (memberId: string, role: Role) => {
    if (!id) return;
    setUpdatingRole(memberId);
    try {
      await api.put(`/workspaces/${id}/members/${memberId}/role`, { role });
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members?.map((m) =>
                m.id === memberId ? { ...m, role } : m
              ),
            }
          : prev
      );
    } catch {
      setError("Failed to update role.");
    } finally {
      setUpdatingRole(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
        {error}
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#dde1ff] text-lg font-bold text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]">
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-2xl">
              {workspace.name}
            </h1>
            <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
              {workspace.description || "No description"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M4 20c0-3 3-4 6-4h4c3 0 6 1 6 4" stroke="currentColor" strokeWidth="2" />
                </svg>
                Owned by {workspace.owner.name || workspace.owner.email}
              </span>
              <span>{workspace._count?.members ?? 0} members</span>
              <span>{workspace._count?.projects ?? 0} projects</span>
              <span>Created {new Date(workspace.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Members Section */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
          <div className="border-b border-[#e2e8f0] px-5 py-4 dark:border-[#2a2c38]">
            <h2 className="font-display text-sm font-bold text-[#1a1b22] dark:text-white">
              Members
            </h2>
          </div>

          {/* Invite form */}
          <div className="border-b border-[#e2e8f0] p-4 dark:border-[#2a2c38]">
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@email.com"
                className="flex-1 rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-xs outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
                required
              />
              <button
                type="submit"
                disabled={inviteLoading}
                className="shrink-0 rounded-lg bg-[#00288e] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-[#3b52d9]"
              >
                {inviteLoading ? "..." : "Invite"}
              </button>
            </form>
            {inviteError && (
              <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                {inviteError}
              </p>
            )}
          </div>

          {/* Members list */}
          <div className="divide-y divide-[#e2e8f0] dark:divide-[#2a2c38]">
            {!workspace.members || workspace.members.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-[#757684] dark:text-[#a8aab8]">
                No members yet.
              </div>
            ) : (
              workspace.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dde1ff] text-[10px] font-bold text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]">
                      {(member.user.name || member.user.email)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#1a1b22] dark:text-white">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="truncate text-[10px] text-[#757684] dark:text-[#a8aab8]">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(member.id, e.target.value as Role)
                      }
                      disabled={updatingRole === member.id}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold outline-none ${ROLE_COLORS[member.role]}`}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="MEMBER">Member</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="rounded p-1 text-[#757684] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                      title="Remove member"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Projects Section */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
          <div className="border-b border-[#e2e8f0] px-5 py-4 dark:border-[#2a2c38]">
            <h2 className="font-display text-sm font-bold text-[#1a1b22] dark:text-white">
              Projects
            </h2>
          </div>
          <div className="p-5">
            <p className="text-xs text-[#757684] dark:text-[#a8aab8]">
              Projects for this workspace will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
