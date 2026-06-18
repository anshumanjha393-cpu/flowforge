export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  taskId: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  userId: string;
  taskId: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

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

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string | null;
  assigneeId: string | null;
  dueDate: string | null;
  assignee?: { id: string; email: string; name: string | null } | null;
  project?: { id: string; name: string } | null;
  _count?: { comments: number; attachments: number };
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  taskId: string | null;
  createdAt: string;
}

// ── Enterprise Feature Types ──────────────────────────────────────

export type BoardShareRole = "VIEWER" | "EDITOR";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  owner: User;
  members?: WorkspaceMember[];
  _count?: { members: number; projects: number };
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  user: User;
  workspaceId: string;
  role: Role;
  joinedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  goal: string | null;
  projectId: string;
  project?: { id: string; name: string };
  workspaceId: string | null;
  tasks?: Task[];
  _count?: { tasks: number };
  createdAt: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  projectId: string;
  workspaceId: string | null;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  description: string | null;
  hours: number;
  date: string;
  userId: string;
  user?: User;
  taskId: string;
  task?: { id: string; title: string; project?: { id: string; name: string } };
  createdAt: string;
}

export interface TimeSummary {
  date: string;
  totalHours: number;
}

export interface TimeSummaryResponse {
  summary: TimeSummary[];
  grandTotal: number;
  groupBy: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  userId: string;
  workspaceId: string | null;
  _count?: { logs: number };
  createdAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: unknown;
  status: number;
  response: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues: unknown;
  newValues: unknown;
  ip: string | null;
  createdAt: string;
}

export interface BoardShare {
  id: string;
  projectId: string;
  token: string;
  role: BoardShareRole;
  userId: string;
  workspaceId: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface SearchResult {
  type: "project" | "task" | "user" | "activity";
  id: string;
  title: string;
  subtitle: string;
  url: string;
}
