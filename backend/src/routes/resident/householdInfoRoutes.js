import express from "express"
import {
  getMyHouseholdInfo,
  getMyHouseholdHistory
} from "../../controller/resident/HouseholdInfoController.js"

import verifyToken from "../../middleware/authMiddleware.js"

const router = express.Router()

router.use(verifyToken)
router.get("/household/info", getMyHouseholdInfo)
router.get("/household/history", getMyHouseholdHistory)

export default router
