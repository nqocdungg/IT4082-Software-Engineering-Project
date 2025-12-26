import express from "express";
import {
  getAllFees,
  createFee,
  updateFee,
  deleteFee,
  createTransaction,
  getTransactions,
  getFeeSummary,
} from "../../controller/staff/FeeController.js";

const router = express.Router();

router.get("/list", getAllFees);
router.post("/create", createFee);
router.put("/update/:id", updateFee);
router.delete("/delete/:id", deleteFee);

router.post("/pay", createTransaction);
router.get("/history", getTransactions);

router.get("/summary", getFeeSummary);

export default router;
