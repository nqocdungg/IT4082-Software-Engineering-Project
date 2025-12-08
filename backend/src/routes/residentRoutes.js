import express from "express";
import {
  getResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident,
} from "../controller/residentController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"), getResidents);

router.get("/:id", authMiddleware, allowRoles("HEAD", "DEPUTY", "ACCOUNTANT"), getResidentById);

router.post("/", authMiddleware, allowRoles("HEAD", "DEPUTY"), createResident);

router.put("/:id", authMiddleware, allowRoles("HEAD", "DEPUTY"), updateResident);

router.delete("/:id", authMiddleware, allowRoles("HEAD", "DEPUTY"), deleteResident);

export default router;
