import { Router } from "express";
import {
  createBoardShare,
  getBoardShares,
  getBoardShareByToken,
  deleteBoardShare,
} from "../controllers/boardsharecontroller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/public/:token", getBoardShareByToken);

router.use(authenticate);

router.post("/", createBoardShare);
router.get("/", getBoardShares);
router.delete("/:id", deleteBoardShare);

export default router;
