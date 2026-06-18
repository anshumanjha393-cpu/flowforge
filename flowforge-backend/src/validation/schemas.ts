import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(true),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional().default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
  assigneeId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
  dueDate: z.string().datetime().nullable().optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]).optional().default("MEMBER"),
});

export const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
