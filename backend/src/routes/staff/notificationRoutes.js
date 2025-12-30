import express from "express";
import {
  createAnnouncement,
  getSentNotifications,
  deleteNotification
} from "../../controller/staff/NotificationController.js";

import verifyToken from "../../middleware/authMiddleware.js";
import { allowRoles } from "../../middleware/roleMiddleware.js"; 

const router = express.Router();

router.use(verifyToken);

router.post("/create", allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"), createAnnouncement);
router.get("/history", allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"), getSentNotifications);
router.delete("/:id", allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"), deleteNotification);

export default router;