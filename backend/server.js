import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

import authRoutes from "./src/routes/authRoutes.js"
import householdRoutes from "./src/routes/householdRoutes.js"
import residentRoutes from "./src/routes/residentRoutes.js"
import feeRoutes from "./src/routes/feeRoutes.js"   
import dashboardRoutes from "./src/routes/dashboardRoutes.js"  
import residentChangeRoutes from "./src/routes/residentChangeRoutes.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))

app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/households", householdRoutes)
app.use("/api/residents", residentRoutes)
app.use("/api/fees", feeRoutes) 
app.use("/api/dashboard", dashboardRoutes) 
app.use("/api/resident-change", residentChangeRoutes) 

const distPath = path.join(__dirname, "../frontend/dist")
app.use(express.static(distPath))

app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
