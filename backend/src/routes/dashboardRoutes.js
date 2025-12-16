import express from "express"
import { getDashboard } from "../controllers/DashboardController.js"
import { verifyToken } from "../middlewares/auth.js"

const router = express.Router()

router.get("/", verifyToken, getDashboard)

export default router
