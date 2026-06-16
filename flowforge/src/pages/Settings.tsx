import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
          Manage your account preferences and system settings
        </p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Profile Section */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 dark:border-[#2a2c38] dark:bg-[#15171f]">
          <h2 className="mb-4 text-base font-semibold text-[#1a1b22] dark:text-white">
            Workspace Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">
                Email Address
              </label>
              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2 text-sm text-[#757684] dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-[#a8aab8]">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#757684] dark:text-[#a8aab8]">
                System Role
              </label>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dde1ff] px-2.5 py-0.5 text-xs font-semibold text-[#001453]">
                {user?.role}
              </div>
            </div>
          </div>
        </div>

        {/* System info */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 dark:border-[#2a2c38] dark:bg-[#15171f]">
          <h2 className="mb-4 text-base font-semibold text-[#1a1b22] dark:text-white">
            About FlowForge
          </h2>
          <div className="space-y-2 text-sm text-[#757684] dark:text-[#a8aab8]">
            <p>Version: 2.1.0-enterprise</p>
            <p>Database: Connected (PostgreSQL)</p>
            <p>Real-time Sync: Active (Socket.io)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
