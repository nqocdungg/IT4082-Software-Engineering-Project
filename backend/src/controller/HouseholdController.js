import prisma from "../../prisma/prismaClient.js"

/**
 * GET /api/households
 */
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

/**
 * GET /api/households/:id
 */
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

/**
 * POST /api/households
 * Tạo hộ khẩu mới hoàn toàn (có chủ hộ + danh sách nhân khẩu ban đầu)
 */
export const createHousehold = async (req, res) => {
  const { householdCode, address, owner, members = [] } = req.body

  if (!householdCode || !address || !owner) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      /* =====================================================
       * 1. Kiểm tra CCCD chủ hộ đã tồn tại chưa
       * ===================================================== */
      if (owner.residentCCCD) {
        const existedOwner = await tx.resident.findUnique({
          where: { residentCCCD: owner.residentCCCD }
        })

        if (existedOwner) {
          throw new Error("Chủ hộ đã tồn tại trong hệ thống")
        }
      }

      /* =====================================================
       * 2. Kiểm tra CCCD các nhân khẩu khác
       * ===================================================== */
      for (const m of members) {
        if (!m.residentCCCD) continue

        const existed = await tx.resident.findUnique({
          where: { residentCCCD: m.residentCCCD }
        })

        if (existed) {
          throw new Error(
            `Nhân khẩu ${m.fullname} đã tồn tại trong hệ thống`
          )
        }
      }

      /* =====================================================
       * 3. Tạo Household (chưa có ownerId)
       * ===================================================== */
      const household = await tx.household.create({
        data: {
          householdCode,
          address,
          status: 1
        }
      })

      /* =====================================================
       * 4. Tạo Resident CHỦ HỘ
       * ===================================================== */
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

      /* =====================================================
       * 5. Gán ownerId cho Household
       * ===================================================== */
      await tx.household.update({
        where: { id: household.id },
        data: {
          ownerId: ownerResident.id
        }
      })

      /* =====================================================
       * 6. Tạo các nhân khẩu còn lại
       * ===================================================== */
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

/**
 * PATCH /api/households/:id/status
 */
export const changeHouseholdStatus = async (req, res) => {
  const householdId = Number(req.params.id)
  const { status } = req.body

  try {
    const updated = await prisma.household.update({
      where: { id: householdId },
      data: { status: Number(status) }
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
