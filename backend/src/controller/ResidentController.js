import prisma from "../../prisma/prismaClient.js"

function computeStatus(resident) {
  const latestApprovedChange = resident.latestApprovedChange || null
  const hasActiveTemp = (resident.temporaryResidences?.length || 0) > 0

  if (latestApprovedChange?.changeType === 8) return 4 // đã qua đời
  if (latestApprovedChange?.changeType === 4) return 3 // đã chuyển đi

  if (latestApprovedChange?.changeType === 2) {
    const now = new Date()
    const from = latestApprovedChange.fromDate
      ? new Date(latestApprovedChange.fromDate)
      : null
    const to = latestApprovedChange.toDate
      ? new Date(latestApprovedChange.toDate)
      : null
    const inRange = (!from || now >= from) && (!to || now <= to)
    if (inRange) return 2 // tạm vắng
  }

  if (hasActiveTemp) return 1 // tạm trú
  if (resident.householdId != null) return 0 // thường trú
  return 1 // mặc định
}

// GET /api/residents
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
      select: {
        id: true,
        residentCCCD: true,
        fullname: true,
        dob: true,
        gender: true,
        relationToOwner: true,
        createdAt: true,
        updatedAt: true,
        householdId: true, // ✅ mã hộ khẩu = Household.id
        household: { select: { id: true, address: true } },
        temporaryResidences: {
          where: { status: 0 },
          select: { id: true, address: true, fromDate: true, toDate: true }
        }
      }
    })

    const ids = residents.map(r => r.id)
    if (ids.length === 0) {
      return res.json({ message: "Fetched residents", data: [] })
    }

    const latestApproved = await prisma.residentChange.findMany({
      where: { residentId: { in: ids }, approvalStatus: 1 },
      orderBy: [{ residentId: "asc" }, { createdAt: "desc" }],
      select: {
        residentId: true,
        changeType: true,
        fromDate: true,
        toDate: true,
        createdAt: true
      }
    })

    const latestMap = new Map()
    for (const ch of latestApproved) {
      if (!latestMap.has(ch.residentId)) latestMap.set(ch.residentId, ch)
    }

    const mapped = residents.map(r => {
      const latestApprovedChange = latestMap.get(r.id) || null
      const status = computeStatus({
        ...r,
        latestApprovedChange,
        temporaryResidences: r.temporaryResidences
      })

      return {
        ...r,
        residentCCCD: r.residentCCCD ?? "",
        householdCode: r.householdId ?? null,
        status
      }
    })

    return res.json({
      message: "Fetched residents",
      data: mapped
    })
  } catch (err) {
    console.error("getResidents error:", err)
    return res.status(500).json({ message: err.message || "Server error" })
  }
}

//
// GET /api/residents/stats
//
export const getResidentStats = async (req, res) => {
  try {
    const now = new Date()

    // latest approved change per resident (chỉ lấy 1 cái mới nhất)
    const latestApprovedPerResident = await prisma.residentChange.findMany({
      where: { approvalStatus: 1 },
      orderBy: [{ residentId: "asc" }, { createdAt: "desc" }],
      select: {
        residentId: true,
        changeType: true,
        fromDate: true,
        toDate: true,
        createdAt: true
      }
    })

    const latestChangeMap = new Map()
    for (const ch of latestApprovedPerResident) {
      if (!latestChangeMap.has(ch.residentId)) latestChangeMap.set(ch.residentId, ch)
    }

    // tạm vắng hiện tại: approved + changeType=2 + đang trong khoảng
    const tamVangRows = await prisma.residentChange.findMany({
      where: {
        approvalStatus: 1,
        changeType: 2,
        fromDate: { lte: now },
        OR: [{ toDate: null }, { toDate: { gte: now } }]
      },
      select: { residentId: true }
    })
    const tamVangSet = new Set(tamVangRows.map(x => x.residentId))

    // residents + temp active
    const residents = await prisma.resident.findMany({
      select: {
        id: true,
        householdId: true,
        temporaryResidences: {
          where: { status: 0 },
          select: { id: true }
        }
      }
    })

    let thuongTru = 0
    let tamTru = 0
    let tamVang = 0
    let daChuyenDi = 0
    let daQuaDoi = 0

    for (const r of residents) {
      const latest = latestChangeMap.get(r.id) || null
      const dead = latest?.changeType === 8
      const movedOut = latest?.changeType === 4

      if (dead) {
        daQuaDoi++
        continue
      }

      if (movedOut) {
        daChuyenDi++
        continue
      }

      if (tamVangSet.has(r.id)) {
        tamVang++
        continue
      }

      const hasActiveTemp = (r.temporaryResidences?.length || 0) > 0
      if (hasActiveTemp) {
        tamTru++
        continue
      }

      if (r.householdId != null) {
        thuongTru++
        continue
      }

      // fallback (m đang muốn tính vào "tạm trú")
      tamTru++
    }

    const total = thuongTru + tamTru + tamVang

    return res.json({
      message: "Fetched stats",
      data: { total, thuongTru, tamTru, tamVang, daChuyenDi, daQuaDoi }
    })
  } catch (err) {
    console.error("getResidentStats error:", err)
    return res.status(500).json({ message: err.message || "Server error" })
  }
}

// GET /api/residents/:id
export const getResidentById = async (req, res) => {
  try {
    const { id } = req.params
    const residentId = Number(id)

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      select: {
        id: true,
        residentCCCD: true,
        fullname: true,
        dob: true,
        gender: true,
        relationToOwner: true,
        createdAt: true,
        updatedAt: true,
        householdId: true,
        household: { select: { id: true, address: true } },
        temporaryResidences: {
          where: { status: 0 },
          select: { id: true, address: true, fromDate: true, toDate: true }
        },
        changes: { orderBy: { createdAt: "desc" } }
      }
    })

    if (!resident) return res.status(404).json({ message: "Resident not found" })

    const latestApprovedChange = await prisma.residentChange.findFirst({
      where: { residentId, approvalStatus: 1 },
      orderBy: { createdAt: "desc" },
      select: { changeType: true, fromDate: true, toDate: true, createdAt: true }
    })

    const status = computeStatus({ ...resident, latestApprovedChange })

    return res.json({
      message: "Fetched resident",
      data: {
        ...resident,
        residentCCCD: resident.residentCCCD ?? "",
        householdCode: resident.householdId ?? null,
        status
      }
    })
  } catch (err) {
    console.error("getResidentById error:", err)
    return res.status(500).json({ message: err.message || "Server error" })
  }
}

// POST /api/residents
export const createResident = async (req, res) => {
  try {
    const { residentCCCD, fullname, dob, gender, relationToOwner, householdId } = req.body

    if (!fullname || !dob || !relationToOwner) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    if (residentCCCD) {
      const existed = await prisma.resident.findUnique({ where: { residentCCCD } })
      if (existed) return res.status(400).json({ message: "CCCD already exists" })
    }

    if (householdId) {
      const household = await prisma.household.findUnique({
        where: { id: Number(householdId) }
      })
      if (!household) return res.status(400).json({ message: "Household not found" })
    }

    const newResident = await prisma.resident.create({
      data: {
        residentCCCD: residentCCCD || null,
        fullname,
        dob: new Date(dob),
        gender,
        relationToOwner,
        householdId: householdId ? Number(householdId) : null
      }
    })

    return res.status(201).json({
      message: "Resident created",
      data: {
        ...newResident,
        residentCCCD: newResident.residentCCCD ?? "",
        householdCode: newResident.householdId ?? null,
        status: newResident.householdId ? 0 : 1
      }
    })
  } catch (err) {
    console.error("createResident error:", err)
    return res.status(500).json({ message: err.message || "Server error" })
  }
}

// PUT /api/residents/:id
export const updateResident = async (req, res) => {
  try {
    const { id } = req.params
    const residentId = Number(id)
    const { residentCCCD, fullname, dob, gender, relationToOwner, householdId } = req.body

    const existing = await prisma.resident.findUnique({ where: { id: residentId } })
    if (!existing) return res.status(404).json({ message: "Resident not found" })

    if (residentCCCD && residentCCCD !== existing.residentCCCD) {
      const dup = await prisma.resident.findUnique({ where: { residentCCCD } })
      if (dup) return res.status(400).json({ message: "CCCD already exists" })
    }

    if (householdId !== undefined && householdId !== null) {
      const household = await prisma.household.findUnique({
        where: { id: Number(householdId) }
      })
      if (!household) return res.status(400).json({ message: "Household not found" })
    }

    const updated = await prisma.resident.update({
      where: { id: residentId },
      data: {
        residentCCCD:
          residentCCCD !== undefined ? (residentCCCD || null) : existing.residentCCCD,
        fullname: fullname ?? existing.fullname,
        dob: dob ? new Date(dob) : existing.dob,
        gender: gender ?? existing.gender,
        relationToOwner: relationToOwner ?? existing.relationToOwner,
        householdId:
          householdId !== undefined ? (householdId ? Number(householdId) : null) : existing.householdId
      }
    })

    const latestApprovedChange = await prisma.residentChange.findFirst({
      where: { residentId, approvalStatus: 1 },
      orderBy: { createdAt: "desc" },
      select: { changeType: true, fromDate: true, toDate: true, createdAt: true }
    })

    const tempActive = await prisma.temporaryResidence.count({
      where: { residentId, status: 0 }
    })

    const status = computeStatus({
      ...updated,
      temporaryResidences: tempActive > 0 ? [{}] : [],
      latestApprovedChange
    })

    return res.json({
      message: "Resident updated",
      data: {
        ...updated,
        residentCCCD: updated.residentCCCD ?? "",
        householdCode: updated.householdId ?? null,
        status
      }
    })
  } catch (err) {
    console.error("updateResident error:", err)
    return res.status(500).json({ message: err.message || "Server error" })
  }
}

// DELETE /api/residents/:id
export const deleteResident = async (req, res) => {
  try {
    const { id } = req.params
    const residentId = Number(id)

    const existing = await prisma.resident.findUnique({ where: { id: residentId } })
    if (!existing) return res.status(404).json({ message: "Resident not found" })

    await prisma.resident.delete({ where: { id: residentId } })

    return res.json({ message: "Resident deleted (DEV only)" })
  } catch (err) {
    console.error("deleteResident error:", err)
    return res.status(500).json({ message: err.message || "Server error" })
  }
}
