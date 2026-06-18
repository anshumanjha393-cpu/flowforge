import { Router } from "express";
import {
  getAuditLogs,
  getAuditLogsByEntity,
  exportAuditLogs,
} from "../controllers/auditlogcontroller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/export", exportAuditLogs);
router.get("/", getAuditLogs);
router.get("/entity/:entity/:entityId", getAuditLogsByEntity);

export default router;
