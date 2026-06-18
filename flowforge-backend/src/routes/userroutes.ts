import { Router } from "express";
import {
  getUsers,
  getUserById,
  updateUserRole,
  inviteUser,
  getProfile,
  updateProfile,
  changePassword,
  getNotifications,
  markNotificationsRead,
} from "../controllers/usercontroller.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/errorHandler.js";
import { inviteUserSchema, updateRoleSchema } from "../validation/schemas.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with pagination
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, MANAGER, MEMBER]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of users
 */
router.get("/", getUsers);

/**
 * @swagger
 * /api/users/invite:
 *   post:
 *     summary: Invite a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, MEMBER]
 *     responses:
 *       201:
 *         description: User invited
 *       403:
 *         description: Insufficient permissions
 */
router.post("/invite", requireRole("ADMIN"), validate(inviteUserSchema), inviteUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID with recent tasks
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get("/:id", getUserById);

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, MEMBER]
 *     responses:
 *       200:
 *         description: Role updated
 *       403:
 *         description: Insufficient permissions
 */
router.put("/:id/role", requireRole("ADMIN"), validate(updateRoleSchema), updateUserRole);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 */
router.get("/me", getProfile);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put("/me", updateProfile);

/**
 * @swagger
 * /api/users/me/password:
 *   put:
 *     summary: Change current user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put("/me/password", changePassword);

/**
 * @swagger
 * /api/users/me/notifications:
 *   get:
 *     summary: Get current user notifications
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get("/me/notifications", getNotifications);

/**
 * @swagger
 * /api/users/me/notifications:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications marked as read
 */
router.put("/me/notifications", markNotificationsRead);

export default router;
