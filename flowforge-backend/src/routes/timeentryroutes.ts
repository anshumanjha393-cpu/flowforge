import { Router } from "express";
import {
  getTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getTimeSummary,
} from "../controllers/timeentrycontroller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/summary", getTimeSummary);
router.get("/", getTimeEntries);
router.post("/", createTimeEntry);
router.put("/:id", updateTimeEntry);
router.delete("/:id", deleteTimeEntry);

export default router;
