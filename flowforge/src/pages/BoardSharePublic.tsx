import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";

interface PublicProject {
  id: string;
  name: string;
  description: string | null;
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee?: { email: string; name: string | null } | null;
  }[];
}

export default function BoardSharePublic() {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<PublicProject | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data } = await api.get(`/board-shares/public/${token}`);
        setProject(data.project || data);
      } catch {
        setError("This share link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] dark:bg-[#0f1117]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#00288e]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] dark:bg-[#0f1117]">
        <div className="text-center">
          <div className="mb-4 text-4xl">🔒</div>
          <h1 className="font-display text-xl font-bold text-[#1a1b22] dark:text-white">Access Denied</h1>
          <p className="mt-2 text-sm text-[#757684] dark:text-[#a8aab8]">{error}</p>
        </div>
      </div>
    );
  }

  const statusColor = (s: string) => {
    if (s === "DONE") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
    if (s === "IN_PROGRESS") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    return "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300";
  };

  const priorityColor = (p: string) => {
    if (p === "HIGH" || p === "CRITICAL") return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300";
    if (p === "MEDIUM") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    return "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f1117]">
      <header className="border-b border-[#e2e8f0] bg-white px-6 py-4 dark:border-[#2a2c38] dark:bg-[#15171f]">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-[#1a1b22] dark:text-white">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">{project.description}</p>
            )}
          </div>
          <span className="rounded-full bg-[#dde1ff] px-3 py-1 text-xs font-semibold text-[#001453] dark:bg-[#1e40af] dark:text-[#dde1ff]">
            Shared Board
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        {project.tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e2e8f0] bg-white p-12 text-center dark:border-[#2a2c38] dark:bg-[#15171f]">
            <p className="text-sm text-[#757684] dark:text-[#a8aab8]">No tasks in this project</p>
          </div>
        ) : (
          <div className="space-y-2">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 transition-colors hover:bg-[#f8fafc] dark:border-[#2a2c38] dark:bg-[#15171f] dark:hover:bg-[#1a1c26]"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor(task.status)}`}>
                    {task.status.replace("_", " ")}
                  </span>
                  <span className="text-sm font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">{task.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.assignee && (
                    <span className="text-xs text-[#757684] dark:text-[#a8aab8]">
                      {task.assignee.name || task.assignee.email}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#e2e8f0] py-4 text-center dark:border-[#2a2c38]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a8aab8]">
          Powered by FlowForge
        </p>
      </footer>
    </div>
  );
}
