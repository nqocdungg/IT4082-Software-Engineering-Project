import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"
 
import authRoutes from "./src/routes/authRoutes.js"
 
/* STAFF */
import staffHouseholdRoutes from "./src/routes/staff/householdRoutes.js"
import staffResidentRoutes from "./src/routes/staff/residentRoutes.js"
import staffFeeRoutes from "./src/routes/staff/feeRoutes.js"
import staffDashboardRoutes from "./src/routes/staff/dashboardRoutes.js"
import staffResidentChangeRoutes from "./src/routes/staff/residentChangeRoutes.js"
import staffFeeReportRoutes from "./src/routes/staff/feeReportRoutes.js"
import staffFeeHistoryRoutes from "./src/routes/staff/feeHistoryRoutes.js"
import staffNotificationRoutes from "./src/routes/staff/notificationRoutes.js"
import residentChangeHistoryRoutes from "./src/routes/staff/residentChangeHistoryRoutes.js"

/* RESIDENT */
import householdInfoRoutes from "./src/routes/resident/householdInfoRoutes.js"
import feeViewRoutes from "./src/routes/resident/feeViewRoutes.js"
import residentNotificationRoutes from "./src/routes/resident/notificationRoutes.js"

/* SERVICES */
import { startCronJobs } from "./src/services/cronService.js"

dotenv.config()
 
const app = express()
const PORT = process.env.PORT || 5000
 
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
)

app.use(express.json())
startCronJobs()

app.use("/api/auth", authRoutes)

/* STAFF */
app.use("/api/dashboard", staffDashboardRoutes)
app.use("/api/households", staffHouseholdRoutes)
app.use("/api/residents", staffResidentRoutes)
app.use("/api/fees", staffFeeRoutes)

// ✅ FIX: mount history trước để không bị residentChangeRoutes ăn nhầm /history
app.use("/api/resident-changes", residentChangeHistoryRoutes)
app.use("/api/resident-changes", staffResidentChangeRoutes)

app.use("/api/fee-report", staffFeeReportRoutes)
app.use("/api/fee-history", staffFeeHistoryRoutes)
app.use("/api/notifications", staffNotificationRoutes)

/* RESIDENT */
app.use("/api/resident", householdInfoRoutes)
app.use("/api", feeViewRoutes)
app.use("/api/resident/notifications", residentNotificationRoutes)
 
const distPath = path.join(__dirname, "../frontend/dist")
app.use(express.static(distPath))
 
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"))
})
 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
