import { useEffect, useState } from "react";
import { api } from "../api/client";
import { socket } from "../socket";
import type { Project, Task } from "../types";

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

export default function Project() {
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectWithTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get("/projects");
        const projectsData = res.data.data || res.data;
        if (active) {
          setProjects(projectsData);
          if (projectsData.length > 0) {
            setSelectedProject((prev) => prev ?? projectsData[0]);
          }
          setError(null);
        }
      } catch (err) {
        if (active) { console.error(err); setError("Failed to fetch projects"); }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handler = () => {
      api.get("/projects")
        .then((res) => {
          const projectsData = res.data.data || res.data;
          setProjects(projectsData);
          if (projectsData.length > 0) {
            setSelectedProject((prev) => prev ?? projectsData[0]);
          }
          setError(null);
        })
        .catch(() => {});
    };
    socket.on("tasksChanged", handler);
    return () => { socket.off("tasksChanged", handler); };
  }, []);

  const taskStats = selectedProject
    ? {
        total: selectedProject.tasks.length,
        todo: selectedProject.tasks.filter((t) => t.status === "TODO").length,
        inProgress: selectedProject.tasks.filter((t) => t.status === "IN_PROGRESS").length,
        done: selectedProject.tasks.filter((t) => t.status === "DONE").length,
      }
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#00288e]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a1b22] dark:text-white md:text-3xl">
            Projects
          </h1>
          <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
            Manage and track your team's projects
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Project List */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
          <h2 className="mb-4 text-base font-bold text-[#1a1b22] dark:text-white">
            All Projects ({projects.length})
          </h2>
          <div className="space-y-2">
            {projects.map((project) => {
              const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
              const totalTasks = project.tasks.length;
              const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    selectedProject?.id === project.id
                      ? "border-[#00288e] bg-[#dde1ff]/30 dark:border-[#b8c4ff] dark:bg-[#1e40af]/20"
                      : "border-[#e2e8f0] hover:bg-[#f8fafc] dark:border-[#2a2c38] dark:hover:bg-[#1e202b]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1a1b22] dark:text-white">
                      {project.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        project.priority === "HIGH"
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                          : project.priority === "MEDIUM"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                      }`}
                    >
                      {project.priority}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-[#757684] dark:text-[#a8aab8]">
                    {project.description || "No description"}
                  </p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#757684] dark:text-[#a8aab8]">
                      <span>{doneTasks}/{totalTasks} tasks</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-[#f1f5f9] dark:bg-[#2a2c38]">
                      <div
                        className="h-full rounded-full bg-[#00288e] dark:bg-[#b8c4ff]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}

            {projects.length === 0 && (
              <p className="py-8 text-center text-sm text-[#757684] dark:text-[#a8aab8]">
                No projects yet. Create one from the sidebar.
              </p>
            )}
          </div>
        </div>

        {/* Project Detail */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xs dark:border-[#2a2c38] dark:bg-[#15171f]">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#1a1b22] dark:text-white">
                    {selectedProject.name}
                  </h2>
                  <p className="mt-1 text-sm text-[#757684] dark:text-[#a8aab8]">
                    {selectedProject.description || "No description provided"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    selectedProject.priority === "HIGH"
                      ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                      : selectedProject.priority === "MEDIUM"
                      ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
                      : "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                  }`}
                >
                  {selectedProject.priority} Priority
                </span>
              </div>

              {/* Stats Grid */}
              {taskStats && (
                <div className="mb-6 grid grid-cols-4 gap-3">
                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-center dark:border-[#2a2c38] dark:bg-[#0b0d12]">
                    <p className="text-2xl font-bold text-[#1a1b22] dark:text-white">
                      {taskStats.total}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
                      Total
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-center dark:border-[#2a2c38] dark:bg-[#0b0d12]">
                    <p className="text-2xl font-bold text-gray-500">{taskStats.todo}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
                      Todo
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-center dark:border-[#2a2c38] dark:bg-[#0b0d12]">
                    <p className="text-2xl font-bold text-[#00288e]">{taskStats.inProgress}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
                      In Progress
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3 text-center dark:border-[#2a2c38] dark:bg-[#0b0d12]">
                    <p className="text-2xl font-bold text-emerald-500">{taskStats.done}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#757684] dark:text-[#a8aab8]">
                      Done
                    </p>
                  </div>
                </div>
              )}

              {/* Task List */}
              <h3 className="mb-3 text-sm font-bold text-[#1a1b22] dark:text-white">
                Tasks ({selectedProject.tasks.length})
              </h3>
              <div className="space-y-2">
                {selectedProject.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-[#f1f5f9] p-3 hover:bg-[#f8fafc] dark:border-[#2a2c38] dark:hover:bg-[#1e202b]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          task.status === "DONE"
                            ? "bg-emerald-500"
                            : task.status === "IN_PROGRESS"
                            ? "bg-[#00288e]"
                            : "bg-gray-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          task.status === "DONE"
                            ? "text-[#757684] line-through dark:text-[#a8aab8]"
                            : "text-[#1a1b22] dark:text-white"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        task.priority === "HIGH"
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                          : task.priority === "MEDIUM"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}

                {selectedProject.tasks.length === 0 && (
                  <p className="py-8 text-center text-sm text-[#757684] dark:text-[#a8aab8]">
                    No tasks in this project yet. Go to the Kanban board to add tasks.
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              {taskStats && taskStats.total > 0 && (
                <div className="mt-6 border-t border-[#e2e8f0] pt-4 dark:border-[#2a2c38]">
                  <div className="flex items-center justify-between text-xs font-bold text-[#757684] dark:text-[#a8aab8]">
                    <span>Overall Progress</span>
                    <span>{Math.round((taskStats.done / taskStats.total) * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-[#f1f5f9] dark:bg-[#2a2c38]">
                    <div
                      className="h-full rounded-full bg-[#00288e] dark:bg-[#b8c4ff]"
                      style={{ width: `${Math.round((taskStats.done / taskStats.total) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-[#e2e8f0] dark:border-[#2a2c38]">
              <p className="text-sm text-[#757684] dark:text-[#a8aab8]">
                Select a project to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
