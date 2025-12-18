import express from "express"
import {
  getAllHouseholds,
  createHousehold,
  getHouseholdById,
  changeHouseholdStatus
} from "../controller/HouseholdController.js"

const router = express.Router()

router.get("/", getAllHouseholds)
router.post("/", createHousehold)
router.get("/:id", getHouseholdById)
router.put("/:id/status", changeHouseholdStatus)

export default router
