import express from "express"
import {
  getResidentChanges,
  getResidentChangeById,
  createResidentChange,
  approveResidentChange,
  rejectResidentChange
} from "../../controller/staff/ResidentChangeController.js"

import authMiddleware from "../../middleware/authMiddleware.js"
import { allowRoles } from "../../middleware/roleMiddleware.js"

const router = express.Router()

// ==========================
// GET: danh sách biến động (tất cả staff)
// ==========================
router.get("/", authMiddleware, getResidentChanges)

// ==========================
// GET: chi tiết biến động (tất cả staff)
// ==========================
router.get("/:id", authMiddleware, getResidentChangeById)

// ==========================
// POST: tạo thủ tục (tất cả staff)
// ==========================
router.post("/", authMiddleware, createResidentChange)

// ==========================
// POST: duyệt (chỉ HEAD / DEPUTY)
// ==========================
router.post("/:id/approve", authMiddleware, allowRoles("HEAD", "DEPUTY"), approveResidentChange)

// ==========================
// POST: từ chối (chỉ HEAD / DEPUTY)
// ==========================
router.post("/:id/reject", authMiddleware, allowRoles("HEAD", "DEPUTY"), rejectResidentChange)

export default router
