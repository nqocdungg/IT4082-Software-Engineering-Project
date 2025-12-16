import express from "express";
import {
  getResidents,
  getResidentStats,   // ✅ thêm
  getResidentById,
  createResident,
  updateResident,
  deleteResident,
} from "../controller/ResidentController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"), getResidents);

// ✅ phải đặt trước "/:id"
router.get("/stats", authMiddleware, allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"), getResidentStats);

router.get("/:id", authMiddleware, allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"), getResidentById);

router.post("/", authMiddleware, allowRoles("HEAD", "DEPUTY"), createResident);

router.put("/:id", authMiddleware, allowRoles("HEAD", "DEPUTY"), updateResident);

router.delete("/:id", authMiddleware, allowRoles("HEAD", "DEPUTY"), deleteResident);

export default router;
