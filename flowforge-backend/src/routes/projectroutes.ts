import { Router } from "express";
import { getProjects, createProject } from "../controllers/projectcontroller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", getProjects);
router.post("/", createProject);

export default router;
