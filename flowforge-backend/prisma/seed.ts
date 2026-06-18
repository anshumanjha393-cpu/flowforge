import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  // Clean in dependency order: children first, parents last
// Clean in dependency order: children first, parents last
await prisma.webhookLog.deleteMany({});
await prisma.webhook.deleteMany({});
await prisma.auditLog.deleteMany({});
await prisma.notification.deleteMany({});
await prisma.boardShare.deleteMany({});
await prisma.timeEntry.deleteMany({});
await prisma.milestone.deleteMany({});
await prisma.sprint.deleteMany({});
await prisma.attachment.deleteMany({});
await prisma.comment.deleteMany({});
await prisma.activity.deleteMany({});
await prisma.task.deleteMany({});
await prisma.project.deleteMany({});
await prisma.workspaceMember.deleteMany({});
await prisma.workspace.deleteMany({});
await prisma.user.deleteMany({});            // user last

  console.log("Seeding users...");
  const hashedPassword = await bcrypt.hash("password", 10);

  const sarah = await prisma.user.create({
    data: {
      email: "sarah.chen@flowforge.com",
      name: "Sarah Chen",
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const marcus = await prisma.user.create({
    data: {
      email: "m.thorne@flowforge.com",
      name: "Marcus Thorne",
      password: hashedPassword,
      role: "MANAGER",
      status: "ACTIVE",
    },
  });

  const david = await prisma.user.create({
    data: {
      email: "dwilson@partner.co",
      name: "David Wilson",
      password: hashedPassword,
      role: "MEMBER",
      status: "INVITED",
    },
  });

  const elena = await prisma.user.create({
    data: {
      email: "elena.r@flowforge.com",
      name: "Elena Rodriguez",
      password: hashedPassword,
      role: "MEMBER",
      status: "ACTIVE",
    },
  });

  // Default Alex Rivera user, so we have the "Good morning, Alex" state
  const alex = await prisma.user.create({
    data: {
      email: "alex.rivera@flowforge.com",
      name: "Alex Rivera",
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("Seeding projects...");
  const quantum = await prisma.project.create({
    data: {
      name: "Quantum Rebrand",
      description: "Phase 2: Visual identity guidelines and design system documentation.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      progress: 68,
      dueDate: new Date("2026-10-24T00:00:00Z"),
    },
  });

  const cloud = await prisma.project.create({
    data: {
      name: "Cloud Migration",
      description: "Migrating legacy databases to AWS infrastructure with zero downtime.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      progress: 32,
      dueDate: new Date("2026-11-12T00:00:00Z"),
    },
  });

  const redesign = await prisma.project.create({
    data: {
      name: "FlowForge Redesign",
      description: "Complete UI redesign of the sprint board and layout.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      progress: 40,
      dueDate: new Date("2026-12-31T00:00:00Z"),
    },
  });

  console.log("Seeding tasks...");
  // Kanban board tasks
  await prisma.task.create({
    data: {
      title: "Implement WebGL Hero shader for home page",
      priority: "HIGH",
      status: "TODO",
      projectId: redesign.id,
      assigneeId: sarah.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Audit asset compression pipeline",
      priority: "MEDIUM",
      status: "TODO",
      projectId: redesign.id,
      assigneeId: marcus.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Refactor Tailwind config for dynamic dark mode",
      priority: "HIGH",
      status: "IN_PROGRESS",
      projectId: redesign.id,
      assigneeId: elena.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Documentation for API Endpoints",
      priority: "LOW",
      status: "IN_PROGRESS",
      projectId: redesign.id,
      assigneeId: alex.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Finalize Design Tokens JSON structure",
      priority: "MEDIUM",
      status: "DONE",
      projectId: redesign.id,
      assigneeId: elena.id,
    },
  });

  // My Tasks assigned to Alex Rivera
  await prisma.task.create({
    data: {
      title: "Update project roadmap",
      priority: "HIGH",
      status: "TODO",
      projectId: quantum.id,
      assigneeId: alex.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Review sprint velocity",
      priority: "MEDIUM",
      status: "TODO",
      projectId: cloud.id,
      assigneeId: alex.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Stakeholder sync prep",
      priority: "LOW",
      status: "TODO",
      projectId: redesign.id,
      assigneeId: alex.id,
    },
  });

  console.log("Seeding activities...");
  await prisma.activity.create({
    data: {
      userId: sarah.id,
      userEmail: sarah.email,
      action: "UPLOADED",
      details: "Sarah Chen uploaded 4 files to Quantum Rebrand",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  });

  await prisma.activity.create({
    data: {
      userId: marcus.id,
      userEmail: marcus.email,
      action: "COMMENTED",
      details: 'Marcus commented on task "Review sprint velocity"',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
  });

  await prisma.activity.create({
    data: {
      userId: "system-automator",
      userEmail: "automator@flowforge.com",
      action: "COMPLETED",
      details: "Automator completed Security Audit",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    },
  });

  await prisma.activity.create({
    data: {
      userId: alex.id,
      userEmail: alex.email,
      action: "INVITED",
      details: "Alex Rivera invited Mark T. to the Team",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Oct 21 / 5 days ago
    },
  });

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
