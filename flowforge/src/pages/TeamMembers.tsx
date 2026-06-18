import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Role, TeamMember, TeamMemberDetail, PaginatedResponse } from "../types";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
};

export default function TeamMembers({ searchQuery = "" }: { searchQuery?: string }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INVITED">("ALL");

  // Details
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TeamMemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const params: Record<string, string> = {};
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (roleFilter !== "ALL") params.role = roleFilter;

    api
      .get<PaginatedResponse<TeamMember>>("/users", { params })
      .then((res) => {
        if (!active) return;
        let filtered = res.data.data;
        if (statusFilter !== "ALL") {
          filtered = filtered.filter((m) => m.status === statusFilter);
        }
        setMembers(filtered);
        setError(null);
      })
      .catch(() => {
        if (active) setError("Couldn't load team members. Is the backend running?");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    if (!selectedId) return;

    let active = true;
    api
      .get<TeamMemberDetail>(`/users/${selectedId}`)
      .then((res) => { if (active) setDetail(res.data); })
      .catch(() => { if (active) setDetail(null); })
      .finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [selectedId]);

  const handleRoleChange = (newRole: Role) => {
    if (!selectedId || !detail || updatingRole) return;
    setUpdatingRole(true);

    api
      .put(`/users/${selectedId}/role`, { role: newRole })
      .then((res) => {
        setDetail((prev) => (prev ? { ...prev, role: res.data.role } : prev));
        setMembers((prev) =>
          prev.map((m) => (m.id === selectedId ? { ...m, role: res.data.role } : m))
        );
      })
      .catch(() => setError("Couldn't update role. Admin access required."))
      .finally(() => setUpdatingRole(false));
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      const res = await api.post("/users/invite", {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setMembers((prev) => [res.data, ...prev]);
      setInviteEmail("");
      setInviteRole("MEMBER");
      setShowInviteModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to invite member";
      setInviteError(message);
    } finally {
      setInviteLoading(false);
    }
  };

  const getInitials = (email: string) => {
    const name = email.split("@")[0];
    return name.slice(0, 2).toUpperCase();
  };

  const getName = (email: string) => {
    const local = email.split("@")[0];
    if (local === "sarah.chen") return "Sarah Chen";
    if (local === "m.thorne") return "Marcus Thorne";
    if (local === "dwilson") return "David Wilson";
    if (local === "elena.r") return "Elena Rodriguez";
    if (local === "alex.rivera") return "Alex Rivera";
    return local.charAt(0).toUpperCase() + local.slice(1).replace(".", " ");
  };

  const getProjectBadges = (email: string) => {
    const local = email.split("@")[0];
    if (local === "sarah.chen") return ["FB", "MT", "+2"];
    if (local === "m.thorne") return ["UX", "DS"];
    if (local === "dwilson") return []; // invited
    if (local === "elena.r") return ["AI"];
    return ["FE"];
  };

  const handleClearFilters = () => {
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
            Team Management
          </h1>
          <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
            Manage permissions, roles, and project access for your organization.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-[#3b52d9]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
              <circle cx="9" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
              <path d="M15 12h6m-3-3v6M3 20c0-3 3-4 6-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Invite Member
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Total Members */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
            Total Members
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-[#1a1b22] dark:text-white">124</span>
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              +4
            </span>
          </div>
        </div>

        {/* Active Now */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
            Active Now
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-[#1a1b22] dark:text-white">86</span>
            <span className="text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">69%</span>
          </div>
        </div>

        {/* Pending Invites */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
            Pending Invites
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-[#1a1b22] dark:text-white">12</span>
            <span className="text-xs font-semibold text-[#e11d48]/80">Expires soon</span>
          </div>
        </div>

        {/* Storage Used */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
            Storage Used
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="font-display text-2xl font-bold text-[#1a1b22] dark:text-white">82%</span>
            <div className="h-2 w-24 rounded-full bg-[#f1f5f9] dark:bg-[#2a2c38]">
              <div className="h-full rounded-full bg-[#00288e] dark:bg-[#b8c4ff]" style={{ width: "82%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 sm:flex-row sm:items-center dark:border-[#2a2c38] dark:bg-[#15171f]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-[#757684] dark:text-[#a8aab8]">Filters:</span>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | "ALL")}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117]"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="MEMBER">Member</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INVITED")}
            className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117]"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INVITED">Invited</option>
          </select>
        </div>

        {(roleFilter !== "ALL" || statusFilter !== "ALL") && (
          <button
            onClick={handleClearFilters}
            className="text-xs font-bold text-[#e11d48] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Main Table + Detail Sidebar Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Table list */}
        <div className="lg:col-span-8 rounded-xl border border-[#e2e8f0] bg-white shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] font-bold text-[#757684] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-[#a8aab8] uppercase tracking-wider">
                  <th className="px-5 py-4">Member</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Assigned Projects</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] dark:divide-[#2a2c38]">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="h-16 px-5" />
                    </tr>
                  ))
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#757684]">
                      No team members match the filters.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => {
                    const isSelected = member.id === selectedId;
                    const initials = getInitials(member.email);
                    const fullName = getName(member.email);
                    const projectAcronyms = getProjectBadges(member.email);
                    const status = member.status || "ACTIVE";

                    return (
                      <tr
                        key={member.id}
                        onClick={() => setSelectedId(member.id)}
                        className={`cursor-pointer transition-colors hover:bg-gray-50/50 dark:hover:bg-[#1e202b] ${
                          isSelected ? "bg-[#dde1ff]/20 dark:bg-[#1e40af]/15" : ""
                        }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dde1ff] text-[10px] font-bold text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#1a1b22] dark:text-white truncate">
                                {fullName}
                              </p>
                              <p className="text-[10px] text-[#757684] dark:text-[#a8aab8] truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3 font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">
                          {ROLE_LABELS[member.role]}
                        </td>

                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-bold ${
                              status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                status === "ACTIVE" ? "bg-emerald-500" : "bg-blue-500"
                              }`}
                            />
                            {status === "ACTIVE" ? "Active" : "Invited"}
                          </span>
                        </td>

                        <td className="px-5 py-3">
                          <div className="flex -space-x-1">
                            {projectAcronyms.length === 0 ? (
                              <span className="text-[10px] font-semibold text-[#757684] italic">
                                Pending acceptance
                              </span>
                            ) : (
                              projectAcronyms.map((acronym, idx) => (
                                <span
                                  key={idx}
                                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ring-2 ring-white dark:ring-[#15171f] ${
                                    acronym.startsWith("+")
                                      ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                      : "bg-[#dde1ff] text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]"
                                  }`}
                                >
                                  {acronym}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3">
                          <button className="text-[#757684] hover:text-[#1a1b22] dark:hover:text-white">
                            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                              <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
                              <circle cx="12" cy="5" r="1" stroke="currentColor" strokeWidth="2" />
                              <circle cx="12" cy="19" r="1" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#e2e8f0] px-5 py-4 sm:flex-row dark:border-[#2a2c38]">
            <span className="text-xs text-[#757684] dark:text-[#a8aab8]">
              Showing 1-10 of 124 members
            </span>
            <div className="flex items-center gap-1">
              <button className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]">
                Previous
              </button>
              <button className="rounded-lg bg-[#00288e] px-3 py-1.5 text-xs font-bold text-white dark:bg-[#3b52d9]">
                1
              </button>
              <button className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]">
                2
              </button>
              <button className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]">
                3
              </button>
              <button className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Member Details Sidebar (functional) */}
        <div className="lg:col-span-4 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
          {!selectedId ? (
            <div className="flex h-full min-h-60 flex-col items-center justify-center text-center">
              <svg viewBox="0 0 24 24" fill="none" className="mb-3 h-10 w-10 text-[#757684]">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M4 20c0-3 3-4 6-4h4c3 0 6 1 6 4" stroke="currentColor" strokeWidth="2" />
              </svg>
              <p className="text-sm font-bold">Select a member</p>
              <p className="mt-1 text-xs text-[#757684]">
                Click a row to view details and role configurations.
              </p>
            </div>
          ) : detailLoading ? (
            <div className="space-y-4">
              <div className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
              <div className="h-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            </div>
          ) : detail ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dde1ff] text-sm font-bold text-[#001453]">
                  {getInitials(detail.email)}
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#1a1b22] dark:text-white">
                    {getName(detail.email)}
                  </h3>
                  <span className="inline-block rounded-full bg-[#dde1ff] px-2 py-0.5 text-[10px] font-bold text-[#001453]">
                    {ROLE_LABELS[detail.role]}
                  </span>
                </div>
              </div>

              <div className="space-y-3.5 border-t border-[#e2e8f0] pt-4 text-xs dark:border-[#2a2c38]">
                <div className="flex justify-between">
                  <span className="font-bold text-[#757684]">Email Address</span>
                  <span className="font-semibold">{detail.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-[#757684]">Joined</span>
                  <span className="font-semibold">
                    {new Date(detail.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-[#757684]">Assigned Tasks</span>
                  <span className="font-bold">{detail.taskCount}</span>
                </div>
              </div>

              {isAdmin && detail.id !== user?.id && (
                <div className="border-t border-[#e2e8f0] pt-4 dark:border-[#2a2c38]">
                  <p className="mb-2 text-xs font-bold text-[#757684]">Change Role</p>
                  <div className="flex gap-2">
                    {(["ADMIN", "MANAGER", "MEMBER"] as Role[]).map((r) => (
                      <button
                        key={r}
                        disabled={updatingRole || detail.role === r}
                        onClick={() => handleRoleChange(r)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                          detail.role === r
                            ? "bg-[#00288e] text-white border-[#00288e]"
                            : "bg-white border-[#e2e8f0] text-[#757684] hover:bg-gray-50 dark:bg-[#15171f] dark:border-[#2a2c38]"
                        }`}
                      >
                        {ROLE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-[#e2e8f0] pt-4 dark:border-[#2a2c38]">
                <p className="mb-3 text-xs font-bold text-[#757684]">Recent Tasks</p>
                {detail.recentTasks.length === 0 ? (
                  <p className="text-xs text-[#757684] italic">No tasks assigned yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.recentTasks.map((t) => (
                      <li
                        key={t.id}
                        className="rounded-lg border border-[#e2e8f0] p-3 dark:border-[#2a2c38]"
                      >
                        <p className="text-xs font-bold">{t.title}</p>
                        <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-[#757684]">
                          <span>Status: {t.status}</span>
                          <span>Priority: {t.priority}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl dark:border-[#2a2c38] dark:bg-[#15171f] text-[#1a1b22] dark:text-[#f1f0fa]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Invite Member</h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="rounded-full p-1 text-[#757684] hover:bg-gray-100 dark:hover:bg-[#1e202b]"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {inviteError && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@flowforge.com"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">Workspace Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117]"
                >
                  <option value="MEMBER">Member</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="mt-5 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg border border-[#e4e6eb] px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 dark:border-[#2a2c38] dark:hover:bg-[#1e202b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="rounded-lg bg-[#00288e] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-[#3b52d9]"
                >
                  {inviteLoading ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
