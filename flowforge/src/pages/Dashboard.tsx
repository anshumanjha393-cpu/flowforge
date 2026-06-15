import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import axios from "axios";
import { socket } from "../socket";

type Priority = "LOW" | "MEDIUM" | "HIGH";
type Status = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
}

const API_URL = "http://localhost:5001/api/tasks";

// const COMPLETION_COLORS = ["#34d399", "#1e293b"]; // emerald / slate-800
const COMPLETION_COLORS = ["#34d399", "#fb7185"];
const PRIORITY_COLORS: Record<Priority, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#fbbf24",
  LOW: "#34d399",
};
const STATUS_META: { id: Status; label: string; dot: string }[] = [
  { id: "TODO", label: "Todo", dot: "bg-slate-400" },
  { id: "IN_PROGRESS", label: "In Progress", dot: "bg-sky-400" },
  { id: "DONE", label: "Done", dot: "bg-emerald-400" },
];

function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = () => {
    axios
      .get(API_URL)
      .then((res) => {
        setTasks(res.data);
        setError(null);
      })
      .catch((err) => {
        console.log(err);
        setError("Couldn't load tasks. Is the backend running?");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Stay live: refetch whenever the board changes anywhere
  useEffect(() => {
    socket.on("taskUpdated", fetchTasks);
    socket.on("tasksChanged", fetchTasks);

    return () => {
      socket.off("taskUpdated", fetchTasks);
      socket.off("tasksChanged", fetchTasks);
    };
  }, []);

  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "DONE").length;
  const remaining = total - completed;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  const completionData = [
    { name: "Completed", value: completed },
    { name: "Remaining", value: remaining },
  ];

  const priorityData = (["HIGH", "MEDIUM", "LOW"] as Priority[]).map(
    (priority) => ({
      priority,
      count: tasks.filter((task) => task.priority === priority).length,
    })
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              A live view of your FlowForge sprint board
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Live
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Stat cards */}
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-500">Total tasks</p>
            <p className="mt-1 text-2xl font-semibold text-slate-50">
              {loading ? "—" : total}
            </p>
          </div>

          {STATUS_META.map((status) => (
            <div
              key={status.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                {status.label}
              </div>
              <p className="mt-1 text-2xl font-semibold text-slate-50">
                {loading
                  ? "—"
                  : tasks.filter((t) => t.status === status.id).length}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Pie Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">
                Task Completion
              </h2>
              {!loading && total > 0 && (
                <span className="rounded-md bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/30">
                  {completionRate}% done
                </span>
              )}
            </div>

            {loading ? (
              <div className="h-[260px] animate-pulse rounded-lg bg-slate-800/40" />
            ) : total === 0 ? (
              <div className="flex h-[260px] flex-col items-center justify-center text-center">
                <p className="text-sm text-slate-400">No tasks yet</p>
                <p className="mt-1 text-xs text-slate-600">
                  Add a task on the board to see your progress here.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={completionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {completionData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COMPLETION_COLORS[index % COMPLETION_COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-slate-400">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="mb-4 text-sm font-medium text-slate-300">
              Priority Breakdown
            </h2>

            {loading ? (
              <div className="h-[260px] animate-pulse rounded-lg bg-slate-800/40" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={priorityData}>
                  <XAxis dataKey="priority" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
                    {priorityData.map((entry) => (
                      <Cell
                        key={entry.priority}
                        fill={PRIORITY_COLORS[entry.priority]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;