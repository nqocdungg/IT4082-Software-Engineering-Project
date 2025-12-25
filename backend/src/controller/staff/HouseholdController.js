import prisma from "../../../prisma/prismaClient.js"

/* =====================================================
 * UTIL: Generate random 9-digit household code (unique)
 * ===================================================== */
function random9Digits() {
  return Math.floor(100000000 + Math.random() * 900000000).toString()
}

async function generateUniqueHouseholdCode(tx) {
  while (true) {
    const code = random9Digits()

    const existed = await tx.household.findUnique({
      where: { householdCode: code }
    })

    if (!existed) return code
  }
}

/* =====================================================
 * GET /api/households
 * ===================================================== */
export const getAllHouseholds = async (req, res) => {
  try {
    const households = await prisma.household.findMany({
      include: {
        owner: true,
        residents: true
      }
    })

    return res.status(200).json({
      success: true,
      data: households
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

/* =====================================================
 * GET /api/households/:id
 * ===================================================== */
export const getHouseholdById = async (req, res) => {
  try {
    const household = await prisma.household.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        owner: true,
        residents: true,
        feeRecords: true
      }
    })

    if (!household) {
      return res.status(404).json({
        success: false,
        message: "Household not found"
      })
    }

    return res.status(200).json({
      success: true,
      data: household
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

/* =====================================================
 * GET /api/households/generate-code
 * Sinh mã hộ khẩu 9 số (KHÔNG tạo household)
 * ===================================================== */
export const generateHouseholdCode = async (req, res) => {
  try {
    const code = await prisma.$transaction(tx => generateUniqueHouseholdCode(tx))

    return res.status(200).json({
      success: true,
      code
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

/* =====================================================
 * POST /api/households
 * Tạo hộ khẩu mới (có chủ hộ + nhân khẩu ban đầu)
 * ===================================================== */
export const createHousehold = async (req, res) => {
  const { address, owner, members = [] } = req.body

  if (!address || !owner) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    })
  }

  const cccdSet = new Set()

if (owner.residentCCCD) {
  cccdSet.add(owner.residentCCCD)
}

for (const m of members) {
  if (!m.residentCCCD) continue
  if (cccdSet.has(m.residentCCCD)) {
    throw new Error("CCCD bị trùng trong danh sách nhân khẩu")
  }
  cccdSet.add(m.residentCCCD)
}

  try {
    const result = await prisma.$transaction(async tx => {
      /* ============================
       * 1. Sinh mã hộ khẩu
       * ============================ */
      const householdCode = await generateUniqueHouseholdCode(tx)

      /* ============================
       * 2. Kiểm tra CCCD chủ hộ
       * ============================ */
      if (owner.residentCCCD) {
        const existedOwner = await tx.resident.findUnique({
          where: { residentCCCD: owner.residentCCCD }
        })

        if (existedOwner) {
          throw new Error("Chủ hộ đã tồn tại trong hệ thống")
        }
      }

      /* ============================
       * 3. Kiểm tra CCCD các thành viên
       * ============================ */
      for (const m of members) {
        if (!m.residentCCCD) continue

        const existed = await tx.resident.findUnique({
          where: { residentCCCD: m.residentCCCD }
        })

        if (existed) {
          throw new Error(`Nhân khẩu ${m.fullname} đã tồn tại trong hệ thống`)
        }
      }

      /* ============================
       * 4. Tạo Household
       * ============================ */
      const household = await tx.household.create({
        data: {
          householdCode,
          address,
          status: 1
        }
      })

      /* ============================
       * 5. Tạo Resident CHỦ HỘ
       * ============================ */
      const ownerResident = await tx.resident.create({
        data: {
          residentCCCD: owner.residentCCCD,
          fullname: owner.fullname,
          dob: new Date(owner.dob),
          gender: owner.gender,
          ethnicity: owner.ethnicity,
          religion: owner.religion,
          nationality: owner.nationality,
          hometown: owner.hometown,
          occupation: owner.occupation,
          relationToOwner: "Chủ hộ",
          householdId: household.id,
          status: 0
        }
      })

      /* ============================
       * 6. Gán ownerId cho Household
       * ============================ */
      await tx.household.update({
        where: { id: household.id },
        data: { ownerId: ownerResident.id }
      })

      /* ============================
       * 7. Tạo các thành viên còn lại
       * ============================ */
      for (const m of members) {
        await tx.resident.create({
          data: {
            residentCCCD: m.residentCCCD,
            fullname: m.fullname,
            dob: new Date(m.dob),
            gender: m.gender,
            ethnicity: m.ethnicity,
            religion: m.religion,
            nationality: m.nationality,
            hometown: m.hometown,
            occupation: m.occupation,
            relationToOwner: m.relationToOwner,
            householdId: household.id,
            status: 0
          }
        })
      }

      return household
    })

    return res.status(201).json({
      success: true,
      data: result
    })
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    })
  }
}

/* =====================================================
 * PATCH /api/households/:id/status
 * - active (1): moved_out (3) -> active (0)
 * - inactive (0): active(0), temporary(1), absent(2) -> moved_out (3)
 * - deceased (4) không đổi
 * ===================================================== */
export const changeHouseholdStatus = async (req, res) => {
  const householdId = Number(req.params.id)
  const nextStatus = Number(req.body?.status)

  if (!householdId || Number.isNaN(householdId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid household id"
    })
  }

  if (![0, 1].includes(nextStatus)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status (only 0 or 1)"
    })
  }

  try {
    const updated = await prisma.$transaction(async tx => {
      const household = await tx.household.update({
        where: { id: householdId },
        data: { status: nextStatus }
      })

      if (nextStatus === 1) {
        await tx.resident.updateMany({
          where: {
            householdId,
            status: 3
          },
          data: {
            status: 0
          }
        })
      } else {
        await tx.resident.updateMany({
          where: {
            householdId,
            status: { in: [0, 1, 2] }
          },
          data: {
            status: 3
          }
        })
      }

      return household
    })

    return res.status(200).json({
      success: true,
      data: updated
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}
