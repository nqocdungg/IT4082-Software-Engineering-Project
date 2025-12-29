import express from "express"
import {
  getAllFees,
  createFee,
  updateFee,
  deleteFee,
  createTransaction,
  getTransactions,
  getFeeSummary,
} from "../../controller/staff/FeeController.js"

import verifyToken from "../../middleware/authMiddleware.js"
import { allowRoles } from "../../middleware/roleMiddleware.js"

const router = express.Router()

router.use(verifyToken)

router.get(
  "/list",
  allowRoles("ACCOUNTANT", "HEAD", "DEPUTY"),
  getAllFees
)

router.post(
  "/create",
  allowRoles("ACCOUNTANT", "HEAD", "DEPUTY"),
  createFee
)

router.put(
  "/update/:id",
  allowRoles("ACCOUNTANT", "HEAD", "DEPUTY"),
  updateFee
)

router.delete(
  "/delete/:id",
  allowRoles("ACCOUNTANT", "HEAD", "DEPUTY"),
  deleteFee
)

router.post(
  "/pay",
  allowRoles("ACCOUNTANT", "HEAD", "DEPUTY"),
  createTransaction
)

router.get(
  "/history",
  allowRoles("ACCOUNTANT", "HEAD", "DEPUTY"),
  getTransactions
)

router.get(
  "/summary",
  allowRoles("ACCOUNTANT", "HEAD", "DEPUTY"),
  getFeeSummary
)

export default router
