import express from "express"
import {
  getAllHouseholds,
  createHousehold,
  getHouseholdById,
  changeHouseholdStatus,
  generateHouseholdCode,
  searchHouseholds,
  getHouseholdMembers
} from "../../controller/staff/HouseholdController.js"

const router = express.Router()

function validateHouseholdId(req, res, next) {
  const raw = req.params.id
  const id = Number.parseInt(String(raw ?? ""), 10)

  if (!raw) return res.status(400).json({ success: false, message: "Missing household id" })
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "Invalid household id" })
  }

  req.params.id = String(id)
  next()
}

// LOG toàn bộ request vào households để bắt chính xác đường nào gây lỗi
router.use((req, _res, next) => {
  console.log("[/api/households] ", req.method, req.originalUrl)
  next()
})

router.get("/", getAllHouseholds)
router.get("/generate-code", generateHouseholdCode)
router.get("/search", searchHouseholds)
router.get("/:id/members", validateHouseholdId, getHouseholdMembers)

router.post("/", createHousehold)
router.put("/:id/status", validateHouseholdId, changeHouseholdStatus)
router.get("/:id", validateHouseholdId, getHouseholdById)

export default router