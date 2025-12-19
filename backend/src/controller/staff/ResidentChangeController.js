import prisma from "../../../prisma/prismaClient.js"

/**
 * POST /api/resident-changes
 */
export const createResidentChange = async (req, res) => {
  try {
    const {
      residentId,
      changeType,
      fromAddress,
      toAddress,
      fromDate,
      toDate,
      reason,
      extraData
    } = req.body

    const user = req.user
    const isLeader = user.role === "HEAD" || user.role === "DEPUTY"

    const extra = extraData || {}

    let finalResidentId = residentId ?? null

    if (changeType === 0) {
      if (!extra.fullname || !extra.dob || !extra.householdId) {
        return res.status(400).json({ message: "Missing birth info" })
      }

      const newborn = await prisma.resident.create({
        data: {
          residentCCCD: null,
          fullname: extra.fullname,
          dob: new Date(extra.dob),
          gender: extra.gender,
          ethnicity: extra.ethnicity,
          religion: extra.religion,
          nationality: extra.nationality ?? "Việt Nam",
          hometown: extra.hometown,
          occupation: null,
          relationToOwner: extra.relationToOwner ?? "Con",
          householdId: extra.householdId,
          status: 0
        }
      })

      finalResidentId = newborn.id
    }

    // =========================
    // 2. NHẬP HỘ / CHUYỂN ĐẾN (move_in = 3)
    // AUTO-DUYỆT → GÁN LUÔN householdId
    // =========================
    if (changeType === 3) {
      if (!extra.fullname || !extra.dob || !extra.householdId) {
        return res.status(400).json({ message: "Missing resident info" })
      }

      if (extra.residentCCCD) {
        const existed = await prisma.resident.findUnique({
          where: { residentCCCD: extra.residentCCCD }
        })
        if (existed) {
          return res.status(400).json({ message: "Resident already exists" })
        }
      }

      const resident = await prisma.resident.create({
        data: {
          residentCCCD: extra.residentCCCD ?? null,
          fullname: extra.fullname,
          dob: new Date(extra.dob),
          gender: extra.gender,
          ethnicity: extra.ethnicity,
          religion: extra.religion,
          nationality: extra.nationality ?? "Việt Nam",
          hometown: extra.hometown,
          occupation: extra.occupation,
          relationToOwner: extra.relationToOwner,
          householdId: extra.householdId, // ✅ gán luôn
          status: 0
        }
      })

      finalResidentId = resident.id
    }

    // =========================
    // VALIDATE
    // =========================
    if (!finalResidentId) {
      return res.status(400).json({ message: "residentId is required" })
    }

    // =========================
    // CREATE RESIDENT CHANGE
    // =========================
    const change = await prisma.residentChange.create({
      data: {
        residentId: finalResidentId,
        changeType,
        fromAddress,
        toAddress,
        fromDate: fromDate ? new Date(fromDate) : new Date(),
        toDate: toDate ? new Date(toDate) : null,
        reason: extraData ? JSON.stringify(extraData) : reason,
        approvalStatus: isLeader ? 1 : 0,
        managerId: isLeader ? user.id : null
      }
    })

    // auto-duyệt
    if (isLeader) {
      await handleApprovedChange(change)
    }

    return res.status(201).json({
      success: true,
      data: change
    })
  } catch (err) {
    console.error("createResidentChange error:", err)
    return res.status(500).json({ message: err.message })
  }
}

/**
 * PUT /api/resident-changes/:id/approve
 */
export const approveResidentChange = async (req, res) => {
  const changeId = Number(req.params.id)
  const managerId = req.user.id

  try {
    const change = await prisma.residentChange.findUnique({
      where: { id: changeId }
    })

    if (!change || change.approvalStatus !== 0) {
      return res.status(400).json({ message: "Invalid change" })
    }

    const approved = await prisma.residentChange.update({
      where: { id: changeId },
      data: {
        approvalStatus: 1,
        managerId
      }
    })

    await handleApprovedChange(approved)

    return res.json({ message: "Approved successfully" })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

/**
 * PUT /api/resident-changes/:id/reject
 */
export const rejectResidentChange = async (req, res) => {
  const changeId = Number(req.params.id)
  const managerId = req.user.id

  try {
    const change = await prisma.residentChange.findUnique({
      where: { id: changeId }
    })

    if (!change || change.approvalStatus !== 0) {
      return res.status(400).json({ message: "Invalid change" })
    }

    await prisma.residentChange.update({
      where: { id: changeId },
      data: {
        approvalStatus: 2,
        managerId
      }
    })

    return res.json({ message: "Rejected successfully" })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

/**
 * Xử lý sau khi duyệt
 */
async function handleApprovedChange(change) {
  const residentId = change.residentId
  const extra = change.reason ? safeParseJSON(change.reason) : {}

  switch (change.changeType) {
    // 4: move_out
    case 4:
      await prisma.resident.update({
        where: { id: residentId },
        data: {
          householdId: null
        }
      })
      break

    // 6: change_household_head
    case 6:
      if (extra.householdId && extra.newOwnerId) {
        await prisma.household.update({
          where: { id: extra.householdId },
          data: { ownerId: extra.newOwnerId }
        })
      }
      break

    // các case khác giữ nguyên
    default:
      break
  }
}

function safeParseJSON(value) {
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}
