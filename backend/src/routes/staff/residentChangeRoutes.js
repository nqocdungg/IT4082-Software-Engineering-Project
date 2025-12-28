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

function validateIdParam(req, res, next) {
  const raw = req.params.id
  const id = Number(raw)

  if (!raw) {
    return res.status(400).json({ success: false, message: "Missing id" })
  }
  if (Number.isNaN(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid id" })
  }

  req.params.id = String(id) // normalize
  next()
}

// ==========================
// GET: danh sách biến động (tất cả staff)
// ==========================
router.get("/", authMiddleware, getResidentChanges)

// ==========================
// POST: tạo thủ tục (tất cả staff)
// ==========================
router.post("/", authMiddleware, createResidentChange)

// ==========================
// POST: duyệt (chỉ HEAD / DEPUTY)
// ==========================
router.post(
  "/:id/approve",
  authMiddleware,
  validateIdParam,
  allowRoles("HEAD", "DEPUTY"),
  approveResidentChange
)

// ==========================
// POST: từ chối (chỉ HEAD / DEPUTY)
// ==========================
router.post(
  "/:id/reject",
  authMiddleware,
  validateIdParam,
  allowRoles("HEAD", "DEPUTY"),
  rejectResidentChange
)

router.get("/:id", authMiddleware, validateIdParam, getResidentChangeById)

export default router