import { Router } from "express";
import {
  getWorkspaces,
  createWorkspace,
  getWorkspaceById,
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "../controllers/workspacecontroller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", getWorkspaces);
router.post("/", createWorkspace);
router.get("/:id", getWorkspaceById);
router.post("/:id/members", addWorkspaceMember);
router.delete("/:id/members/:memberId", removeWorkspaceMember);
router.put("/:id/members/:memberId/role", updateWorkspaceMemberRole);

export default router;
