import express from "express"
import {
  listResidentChangeHistory,
  getResidentChangeHistoryDetail,
  exportResidentChangeHistoryExcel
} from "../../controller/staff/ResidentChangeHistoryController.js"

import verifyToken from "../../middleware/authMiddleware.js"
import { allowRoles } from "../../middleware/roleMiddleware.js"

const router = express.Router()

router.use(verifyToken)

/**
 * Lịch sử biến động nhân khẩu
 * Quyền: HEAD, DEPUTY, ACCOUNTANT
 */

// lấy danh sách + filter + search
router.get(
  "/history",
  allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"),
  listResidentChangeHistory
)

// xuất excel
router.get(
  "/history/export-excel",
  allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"),
  exportResidentChangeHistoryExcel
)

// xem chi tiết 1 biến động
router.get(
  "/history/:id",
  allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"),
  getResidentChangeHistoryDetail
)

export default router
