import { Router } from "express";
import {
  getSprints,
  createSprint,
  updateSprint,
  startSprint,
  completeSprint,
  getSprintById,
} from "../controllers/sprintcontroller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", getSprints);
router.post("/", createSprint);
router.get("/:id", getSprintById);
router.put("/:id", updateSprint);
router.post("/:id/start", startSprint);
router.post("/:id/complete", completeSprint);

export default router;
