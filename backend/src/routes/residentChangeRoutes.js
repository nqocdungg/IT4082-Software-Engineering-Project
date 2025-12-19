import express from "express"
import {
  createResidentChange,
  approveResidentChange,
  rejectResidentChange
} from "../controller/ResidentChangeController.js"

import authMiddleware from "../middleware/authMiddleware.js"
import { allowRoles } from "../middleware/roleMiddleware.js"

const router = express.Router()

// tạo thủ tục (HEAD/DEPUTY auto-approve)
router.post("/", authMiddleware, allowRoles(["HEAD", "DEPUTY"]), createResidentChange)

// duyệt (chức năng trong tương lai)
router.post("/:id/approve", authMiddleware, allowRoles(["HEAD", "DEPUTY"]), approveResidentChange)

// từ chối (chức năng trong tương lai)
router.post("/:id/reject", authMiddleware, allowRoles(["HEAD", "DEPUTY"]), rejectResidentChange)

export default router
