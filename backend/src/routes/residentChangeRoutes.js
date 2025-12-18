import express from "express"
import {
  createResidentChange,
  approveResidentChange,
  rejectResidentChange
} from "../controller/ResidentChangeController.js"

import { requireAuth } from "../middleware/authMiddleware.js"
import { requireRole } from "../middleware/roleMiddleware.js"

const router = express.Router()

// tạo thủ tục (HEAD/DEPUTY auto-approve)
router.post("/", requireAuth, requireRole(["HEAD", "DEPUTY"]), createResidentChange)

// duyệt (chức năng trong tương lai)
router.post("/:id/approve", requireAuth, requireRole(["HEAD", "DEPUTY"]), approveResidentChange)

// từ chối (chức năng trong tương lai)
router.post("/:id/reject", requireAuth, requireRole(["HEAD", "DEPUTY"]), rejectResidentChange)

export default router
