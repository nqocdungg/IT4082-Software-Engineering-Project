import express from "express"
import authMiddleware from "../../middleware/authMiddleware.js"
import { allowRoles } from "../../middleware/roleMiddleware.js"

import {
  getFeeReportOverview,
  getMonthlyFeeReport,
  getFeeReportByFeeType,
  getHouseholdPaymentStatus,
  getFeeReportComparison,
  exportFeeReportExcel,
} from "../../controller/staff/FeeReportController.js"

const router = express.Router()

// ===== REPORT APIs =====
router.get(
  "/overview",
  authMiddleware,
  allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"),
  getFeeReportOverview
)

router.get(
  "/monthly",
  authMiddleware,
  allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"),
  getMonthlyFeeReport
)

router.get(
  "/by-fee-type",
  authMiddleware,
  allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"),
  getFeeReportByFeeType
)

router.get(
  "/household-status",
  authMiddleware,
  allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"),
  getHouseholdPaymentStatus
)

router.get(
  "/comparison",
  authMiddleware,
  allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"),
  getFeeReportComparison
)

// ===== EXPORT =====
router.get(
  "/export",
  authMiddleware,
  allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"),
  exportFeeReportExcel
)

export default router
