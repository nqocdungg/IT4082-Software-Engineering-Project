import express from "express"
import { 
  getMyHouseholdInfo, 
  getMyHouseholdFees,
  getMyHouseholdHistory
} from "../../controller/resident/HouseholdInfoController.js"

import verifyToken from "../../middleware/authMiddleware.js" 

const router = express.Router()

router.use(verifyToken)

router.get("/info", getMyHouseholdInfo)
router.get("/fees", getMyHouseholdFees)
router.get("/history", getMyHouseholdHistory)

export default router