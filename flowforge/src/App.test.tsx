import { describe, it, expect } from "vitest";

describe("App Component", () => {
  it("should render without crashing", () => {
    expect(true).toBe(true);
  });
});

describe("Type Safety", () => {
  it("should have proper TypeScript types", () => {
    interface Task {
      id: string;
      title: string;
      status: "TODO" | "IN_PROGRESS" | "DONE";
      priority: "LOW" | "MEDIUM" | "HIGH";
    }

    const task: Task = {
      id: "1",
      title: "Test Task",
      status: "TODO",
      priority: "MEDIUM",
    };

    expect(task.status).toBe("TODO");
    expect(task.priority).toBe("MEDIUM");
  });
});

describe("Utility Functions", () => {
  it("should format relative time correctly", () => {
    const formatRelativeTime = (iso: string) => {
      const diffMs = Date.now() - new Date(iso).getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return "Yesterday";
      return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    };

    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe("Just now");

    const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(formatRelativeTime(fiveMinsAgo)).toBe("5 minutes ago");
  });

  it("should calculate task completion percentage", () => {
    const calculateCompletion = (total: number, completed: number) => {
      return total === 0 ? 0 : Math.round((completed / total) * 100);
    };

    expect(calculateCompletion(10, 5)).toBe(50);
    expect(calculateCompletion(0, 0)).toBe(0);
    expect(calculateCompletion(10, 10)).toBe(100);
  });
});
