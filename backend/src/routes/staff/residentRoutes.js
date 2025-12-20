import express from "express"
import {
  getResidents,
  getResidentById,
  updateResident, 
  deleteResident
} from "../../controller/staff/ResidentController.js"

import authMiddleware from "../../middleware/authMiddleware.js"
import { allowRoles } from "../../middleware/roleMiddleware.js"

const router = express.Router()

router.get("/", authMiddleware, getResidents)
router.get("/:id", authMiddleware, getResidentById)
router.put("/:id", authMiddleware, allowRoles("HEAD", "DEPUTY"), updateResident)
router.delete("/:id", authMiddleware, allowRoles("HEAD", "DEPUTY"), deleteResident)


export default router
