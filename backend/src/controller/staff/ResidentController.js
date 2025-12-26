import prisma from "../../../prisma/prismaClient.js"

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
          select: {
            id: true,
            householdCode: true,
            address: true
          }
        }
      }
    })

    const mapped = residents.map(r => ({
      id: r.id,
      residentCCCD: r.residentCCCD ?? "",
      fullname: r.fullname,
      dob: r.dob,
      gender: r.gender,
      relationToOwner: r.relationToOwner,
      householdId: r.householdId,
      householdCode: r.household?.householdCode ?? null,
      address: r.household?.address ?? null,
      status: r.status, // ✅ dùng trực tiếp status
      createdAt: r.createdAt
    }))

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
          select: {
            id: true,
            householdCode: true,
            address: true
          }
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
        status: resident.status, // ✅ dùng trực tiếp status
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
 * Chỉ cập nhật thông tin hành chính
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
 * Cho phép xóa dân cư (quản lý / DEV)
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

    // xóa trước các biến động để tránh lỗi FK
    await prisma.residentChange.deleteMany({
      where: { residentId }
    })

    await prisma.resident.delete({
      where: { id: residentId }
    })

    return res.json({
      success: true,
      message: "Resident deleted successfully"
    })
  } catch (err) {
    console.error("deleteResident error:", err)
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}
