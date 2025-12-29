import express from "express"
import {
  reportSummary,
  reportByFee,
  reportOutstandingByFee,
  exportFeeReportExcel
} from "../../controller/staff/FeeReportController.js"

const router = express.Router()

router.get("/report/summary", reportSummary)
router.get("/report/by-fee", reportByFee)
router.get("/report/outstanding", reportOutstandingByFee)
router.get("/report/export-excel", exportFeeReportExcel)

export default router
