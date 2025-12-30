import express from "express"
import {
  getMyNotifications,
  markAsRead
} from "../../controller/resident/NotificationController.js"
import verifyToken from "../../middleware/authMiddleware.js"

const router = express.Router()
router.use(verifyToken)

router.get("/", getMyNotifications);
router.put("/:id/read", markAsRead);
export default router;
