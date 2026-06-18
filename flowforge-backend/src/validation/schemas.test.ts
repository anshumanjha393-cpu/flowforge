import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  createTaskSchema,
  updateTaskSchema,
  createProjectSchema,
  inviteUserSchema,
  updateRoleSchema,
} from "./schemas.js";

describe("Validation Schemas", () => {
  describe("registerSchema", () => {
    it("should accept valid registration data", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = registerSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "12345",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login data", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should default rememberMe to true", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rememberMe).toBe(true);
      }
    });
  });

  describe("createTaskSchema", () => {
    it("should accept valid task data", () => {
      const result = createTaskSchema.safeParse({
        title: "Test task",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty title", () => {
      const result = createTaskSchema.safeParse({
        title: "",
      });
      expect(result.success).toBe(false);
    });

    it("should accept all optional fields", () => {
      const result = createTaskSchema.safeParse({
        title: "Test task",
        status: "IN_PROGRESS",
        priority: "HIGH",
        assigneeId: "550e8400-e29b-41d4-a716-446655440000",
        projectId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = createTaskSchema.safeParse({
        title: "Test",
        status: "INVALID",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateTaskSchema", () => {
    it("should accept partial updates", () => {
      const result = updateTaskSchema.safeParse({
        title: "Updated title",
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = updateTaskSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("createProjectSchema", () => {
    it("should accept valid project data", () => {
      const result = createProjectSchema.safeParse({
        name: "New Project",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = createProjectSchema.safeParse({
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should accept all optional fields", () => {
      const result = createProjectSchema.safeParse({
        name: "Project",
        description: "Description",
        priority: "HIGH",
        dueDate: "2025-12-31T00:00:00.000Z",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("inviteUserSchema", () => {
    it("should accept valid invite data", () => {
      const result = inviteUserSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = inviteUserSchema.safeParse({
        email: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateRoleSchema", () => {
    it("should accept valid role", () => {
      const result = updateRoleSchema.safeParse({
        role: "ADMIN",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid role", () => {
      const result = updateRoleSchema.safeParse({
        role: "SUPERADMIN",
      });
      expect(result.success).toBe(false);
    });
  });
});
