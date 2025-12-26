import express from "express"
import {
  getAllHouseholds,
  createHousehold,
  getHouseholdById,
  changeHouseholdStatus, 
  generateHouseholdCode
} from "../../controller/staff/HouseholdController.js"

const router = express.Router()

router.get("/", getAllHouseholds)
router.get("/generate-code", generateHouseholdCode)
router.get("/:id", getHouseholdById)
router.post("/", createHousehold)
router.put("/:id/status", changeHouseholdStatus)

export default router
