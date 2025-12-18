import prisma from "../../prisma/prismaClient.js"

/**
 * Tính trạng thái cư trú từ ResidentChange
 * status:
 * 0: thường trú
 * 1: tạm trú
 * 2: tạm vắng
 * 3: đã chuyển đi
 * 4: đã qua đời
 */
function computeStatus({ householdId, latestChange }) {
  if (!latestChange) {
    return householdId ? 0 : 1
  }

  switch (latestChange.changeType) {
    case 7: // death
      return 4
    case 4: // move_out
      return 3
    case 2: { // temp_absence
      const now = new Date()
      const from = latestChange.fromDate
      const to = latestChange.toDate
      if ((!from || now >= from) && (!to || now <= to)) {
        return 2
      }
      return householdId ? 0 : 1
    }
    case 1: // temp_residence
      return 1
    default:
      return householdId ? 0 : 1
  }
}

/**
 * GET /api/residents
 */
export const getResidents = async (req, res) => {
  try {
    const { householdId, search, gender } = req.query
    const where = {}

    if (householdId) where.householdId = Number(householdId)
    if (gender && gender !== "ALL") {
      where.gender = gender === "Nam" ? "M" : "F"
    }
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: "insensitive" } },
        { residentCCCD: { contains: search, mode: "insensitive" } }
      ]
    }

    const residents = await prisma.resident.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        household: {
          select: { id: true, householdCode: true, address: true }
        }
      }
    })

    if (residents.length === 0) {
      return res.json({ success: true, data: [] })
    }

    const ids = residents.map(r => r.id)

    const latestChanges = await prisma.residentChange.findMany({
      where: {
        residentId: { in: ids },
        approvalStatus: 1
      },
      orderBy: [
        { residentId: "asc" },
        { createdAt: "desc" }
      ]
    })

    const latestMap = new Map()
    for (const ch of latestChanges) {
      if (!latestMap.has(ch.residentId)) {
        latestMap.set(ch.residentId, ch)
      }
    }

    const mapped = residents.map(r => {
      const latestChange = latestMap.get(r.id) || null
      return {
        id: r.id,
        residentCCCD: r.residentCCCD ?? "",
        fullname: r.fullname,
        dob: r.dob,
        gender: r.gender,
        relationToOwner: r.relationToOwner,
        householdId: r.householdId,
        householdCode: r.household?.householdCode ?? null,
        address: r.household?.address ?? null,
        status: computeStatus({
          householdId: r.householdId,
          latestChange
        }),
        createdAt: r.createdAt
      }
    })

    return res.json({
      success: true,
      data: mapped
    })
  } catch (err) {
    console.error("getResidents error:", err)
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

/**
 * GET /api/residents/:id
 */
export const getResidentById = async (req, res) => {
  try {
    const residentId = Number(req.params.id)

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      include: {
        household: {
          select: { id: true, householdCode: true, address: true }
        },
        changes: {
          orderBy: { createdAt: "desc" }
        }
      }
    })

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found"
      })
    }

    const latestApprovedChange = await prisma.residentChange.findFirst({
      where: {
        residentId,
        approvalStatus: 1
      },
      orderBy: { createdAt: "desc" }
    })

    return res.json({
      success: true,
      data: {
        id: resident.id,
        residentCCCD: resident.residentCCCD ?? "",
        fullname: resident.fullname,
        dob: resident.dob,
        gender: resident.gender,
        ethnicity: resident.ethnicity,
        religion: resident.religion,
        nationality: resident.nationality,
        hometown: resident.hometown,
        occupation: resident.occupation,
        relationToOwner: resident.relationToOwner,
        householdId: resident.householdId,
        householdCode: resident.household?.householdCode ?? null,
        address: resident.household?.address ?? null,
        status: computeStatus({
          householdId: resident.householdId,
          latestChange: latestApprovedChange
        }),
        changes: resident.changes,
        createdAt: resident.createdAt,
        updatedAt: resident.updatedAt
      }
    })
  } catch (err) {
    console.error("getResidentById error:", err)
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

/**
 * PUT /api/residents/:id
 * Chỉ cập nhật thông tin hành chính (KHÔNG xử lý biến động cư trú)
 */
export const updateResident = async (req, res) => {
  try {
    const residentId = Number(req.params.id)
    const {
      residentCCCD,
      fullname,
      dob,
      gender,
      ethnicity,
      religion,
      nationality,
      hometown,
      occupation,
      relationToOwner
    } = req.body

    const existing = await prisma.resident.findUnique({
      where: { id: residentId }
    })

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Resident not found"
      })
    }

    if (residentCCCD && residentCCCD !== existing.residentCCCD) {
      const dup = await prisma.resident.findUnique({
        where: { residentCCCD }
      })
      if (dup) {
        return res.status(400).json({
          success: false,
          message: "CCCD already exists"
        })
      }
    }

    const updated = await prisma.resident.update({
      where: { id: residentId },
      data: {
        residentCCCD: residentCCCD ?? existing.residentCCCD,
        fullname: fullname ?? existing.fullname,
        dob: dob ? new Date(dob) : existing.dob,
        gender: gender ?? existing.gender,
        ethnicity: ethnicity ?? existing.ethnicity,
        religion: religion ?? existing.religion,
        nationality: nationality ?? existing.nationality,
        hometown: hometown ?? existing.hometown,
        occupation: occupation ?? existing.occupation,
        relationToOwner: relationToOwner ?? existing.relationToOwner
      }
    })

    return res.json({
      success: true,
      data: updated
    })
  } catch (err) {
    console.error("updateResident error:", err)
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}

/**
 * DELETE /api/residents/:id
 * CHỈ dùng cho DEV (không dùng nghiệp vụ thật)
 */
export const deleteResident = async (req, res) => {
  try {
    const residentId = Number(req.params.id)

    const existing = await prisma.resident.findUnique({
      where: { id: residentId }
    })

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Resident not found"
      })
    }

    await prisma.resident.delete({
      where: { id: residentId }
    })

    return res.json({
      success: true,
      message: "Resident deleted (DEV only)"
    })
  } catch (err) {
    console.error("deleteResident error:", err)
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}
