import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './src/routes/authRoutes.js'
import dotenv from "dotenv"
dotenv.config()
const app = express()
const PORT = process.env.PORT || 5000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}))

app.use(express.json())
app.use('/api/auth', authRoutes)

app.use(express.static(path.join(__dirname, "../frontend/dist")))

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});




app.listen(PORT, () => {
    console.log(`Server has started on port: ${PORT}`)
})