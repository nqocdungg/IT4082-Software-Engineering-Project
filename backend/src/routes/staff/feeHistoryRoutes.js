import express from "express"
import {
  getFeeHistory,
  getFeeHistoryDetail,
  createOfflineFeeRecord,
  exportFeeHistoryExcel, 
  printFeeInvoicePdf
} from "../../controller/staff/FeeHistoryController.js"

import verifyToken from "../../middleware/authMiddleware.js"

const router = express.Router()
router.use(verifyToken)

router.get("/", getFeeHistory)
router.get("/export-excel", exportFeeHistoryExcel)
router.get("/:id/invoice", printFeeInvoicePdf)
router.get("/:id", getFeeHistoryDetail)
router.post("/", createOfflineFeeRecord)

export default router
