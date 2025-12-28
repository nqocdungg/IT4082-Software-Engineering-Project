import express from "express"
import {
  getPendingFees,
  getFeeHistory
} from "../../controller/resident/FeeViewController.js"

import verifyToken from "../../middleware/authMiddleware.js"

const router = express.Router()

router.use(verifyToken)
router.get("/household/fees/pending", getPendingFees)
router.get("/household/fees/history", getFeeHistory)

export default router
