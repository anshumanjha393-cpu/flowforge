import { Router } from "express";
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookLogs,
} from "../controllers/webhookcontroller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);

router.get("/", getWebhooks);
router.post("/", createWebhook);
router.get("/:id/logs", getWebhookLogs);
router.put("/:id", updateWebhook);
router.delete("/:id", deleteWebhook);
router.post("/:id/test", testWebhook);

export default router;
