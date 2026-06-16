export type Role = "ADMIN" | "MANAGER" | "MEMBER";
export type UserStatus = "ACTIVE" | "INVITED";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  status?: UserStatus;
  createdAt: string;
}

export interface TeamMember extends User {
  taskCount: number;
}

export interface TeamMemberDetail extends User {
  taskCount: number;
  recentTasks: {
    id: string;
    title: string;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH";
  }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: string;
  progress: number;
  dueDate: string | null;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string | null;
  assigneeId: string | null;
}
