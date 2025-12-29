import express from "express"
import {
  getPendingFees,
  getFeeHistory,
  processPayment
} from "../../controller/resident/FeeViewController.js"

import verifyToken from "../../middleware/authMiddleware.js"
import { allowRoles } from "../../middleware/roleMiddleware.js"

const router = express.Router()

router.use(verifyToken)

router.get("/household/fees/pending", allowRoles("HOUSEHOLD"), getPendingFees)

router.get("/household/fees/history", allowRoles("HOUSEHOLD"), getFeeHistory)

router.post("/household/pay", allowRoles("HOUSEHOLD"), processPayment)

export default router
