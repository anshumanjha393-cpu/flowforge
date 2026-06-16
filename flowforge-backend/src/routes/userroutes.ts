import { Router } from "express";
import {
  getUsers,
  getUserById,
  updateUserRole,
  inviteUser,
} from "../controllers/usercontroller.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", getUsers);
router.post("/invite", requireRole("ADMIN"), inviteUser);
router.get("/:id", getUserById);
router.put("/:id/role", requireRole("ADMIN"), updateUserRole);

export default router;
