import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import { getNotifications, deleteNotifications, deleteSingleNotification } from "../controllers/notification.controller.js";
const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.delete("/", protectRoute, deleteNotifications);
router.delete("/:id", protectRoute, deleteSingleNotification);
export default router;