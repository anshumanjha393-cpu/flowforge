import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import type { User } from "../types";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<"profile" | "password" | "about">("profile");

  const [name, setName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put<User>("/users/me", { name: name.trim() || null });
      const updatedUser = { ...user, name: res.data.name };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    try {
      await api.put("/users/me/password", { currentPassword, newPassword });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const sections = [
    { id: "profile" as const, label: "Profile", icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    )},
    { id: "password" as const, label: "Security", icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/></svg>
    )},
    { id: "about" as const, label: "About", icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
          Manage your account preferences and system settings
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <div className="w-full shrink-0 lg:w-56">
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-2 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                  activeSection === section.id
                    ? "bg-[#dde1ff] text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]"
                    : "text-[#757684] hover:bg-[#f8fafc] dark:text-[#a8aab8] dark:hover:bg-[#1a1c26]"
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === "profile" && (
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
              <h2 className="mb-1 text-base font-bold text-[#1a1b22] dark:text-white">
                Profile Settings
              </h2>
              <p className="mb-5 text-xs text-[#757684] dark:text-[#a8aab8]">
                Update your personal information
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#dde1ff] text-lg font-bold text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]">
                    {user?.name
                      ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
                      : user?.email?.split("@")[0].slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1a1b22] dark:text-white">
                      {user?.name || user?.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-[#757684] dark:text-[#a8aab8]">{user?.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-[#dde1ff] px-2 py-0.5 text-[10px] font-bold text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]">
                      {user?.role}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2.5 text-sm text-[#1a1b22] outline-none transition-colors focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:focus:border-[#b8c4ff]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">
                    Email Address
                  </label>
                  <div className="rounded-lg border border-[#e4e6eb] bg-[#f8fafc] px-3.5 py-2.5 text-sm text-[#757684] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-[#a8aab8]">
                    {user?.email}
                  </div>
                  <p className="mt-1 text-[10px] text-[#757684] dark:text-[#a8aab8]">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">
                    Account Created
                  </label>
                  <div className="rounded-lg border border-[#e4e6eb] bg-[#f8fafc] px-3.5 py-2.5 text-sm text-[#757684] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-[#a8aab8]">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-lg bg-[#00288e] px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-[#3b52d9]"
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "password" && (
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
              <h2 className="mb-1 text-base font-bold text-[#1a1b22] dark:text-white">
                Security Settings
              </h2>
              <p className="mb-5 text-xs text-[#757684] dark:text-[#a8aab8]">
                Change your password to keep your account secure
              </p>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#1a1b22] outline-none transition-colors focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:focus:border-[#b8c4ff]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757684] hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:text-white"
                    >
                      {showCurrentPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#1a1b22] outline-none transition-colors focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:focus:border-[#b8c4ff]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757684] hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:text-white"
                    >
                      {showNewPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                      )}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 6 && (
                    <p className="mt-1 text-[10px] text-rose-500">Password must be at least 6 characters</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2.5 text-sm text-[#1a1b22] outline-none transition-colors focus:border-[#00288e] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:focus:border-[#b8c4ff]"
                    required
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-[10px] text-rose-500">Passwords do not match</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                    className="rounded-lg bg-[#00288e] px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-[#3b52d9]"
                  >
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "about" && (
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
              <h2 className="mb-1 text-base font-bold text-[#1a1b22] dark:text-white">
                About FlowForge
              </h2>
              <p className="mb-5 text-xs text-[#757684] dark:text-[#a8aab8]">
                System information and details
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-[#f1f5f9] bg-[#f8fafc] p-4 dark:border-[#2a2c38] dark:bg-[#0b0d12]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">Version</p>
                    <p className="mt-1 text-sm font-bold text-[#1a1b22] dark:text-white">2.1.0-enterprise</p>
                  </div>
                  <div className="rounded-lg border border-[#f1f5f9] bg-[#f8fafc] p-4 dark:border-[#2a2c38] dark:bg-[#0b0d12]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">Database</p>
                    <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">Connected (PostgreSQL)</p>
                  </div>
                  <div className="rounded-lg border border-[#f1f5f9] bg-[#f8fafc] p-4 dark:border-[#2a2c38] dark:bg-[#0b0d12]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">Real-time</p>
                    <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">Active (Socket.io)</p>
                  </div>
                  <div className="rounded-lg border border-[#f1f5f9] bg-[#f8fafc] p-4 dark:border-[#2a2c38] dark:bg-[#0b0d12]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">Cache</p>
                    <p className="mt-1 text-sm font-bold text-[#757684] dark:text-[#a8aab8]">In-Memory</p>
                  </div>
                </div>

                <div className="rounded-lg border border-[#e2e8f0] p-4 dark:border-[#2a2c38]">
                  <p className="text-xs font-bold text-[#1a1b22] dark:text-white">Tech Stack</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["React 19", "TypeScript", "Vite", "Tailwind CSS v4", "Express 5", "Prisma", "PostgreSQL", "Socket.io"].map((tech) => (
                      <span key={tech} className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[10px] font-bold text-[#757684] dark:bg-[#1a1c26] dark:text-[#a8aab8]">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
