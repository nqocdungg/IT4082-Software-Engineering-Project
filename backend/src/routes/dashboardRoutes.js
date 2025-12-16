import express from "express"
import { getDashboard } from "../controller/DashboardController.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

router.get("/", verifyToken, getDashboard)

export default router