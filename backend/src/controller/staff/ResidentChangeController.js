import prisma from "../../../prisma/prismaClient.js"

export const getResidentChanges = async (req, res) => {
  try {
    const { search, approvalStatus, changeType } = req.query
    const where = {}

    if (approvalStatus !== undefined && approvalStatus !== "ALL" && approvalStatus !== "") {
      where.approvalStatus = Number(approvalStatus)
    }

    if (changeType !== undefined && changeType !== "ALL" && changeType !== "") {
      where.changeType = Number(changeType)
    }

    if (search && String(search).trim()) {
      const q = String(search).trim()
      where.OR = [
        { resident: { fullname: { contains: q, mode: "insensitive" } } },
        { resident: { residentCCCD: { contains: q, mode: "insensitive" } } },
        { resident: { household: { householdCode: { contains: q, mode: "insensitive" } } } }
      ]
    }

    const changes = await prisma.residentChange.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        resident: {
          include: {
            household: { select: { id: true, householdCode: true, address: true } }
          }
        },
        manager: { select: { id: true, username: true, fullname: true, role: true } }
      }
    })

    return res.json({ success: true, data: changes })
  } catch (err) {
    console.error("getResidentChanges error:", err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const getResidentChangeById = async (req, res) => {
  try {
    const id = Number(req.params.id)

    const change = await prisma.residentChange.findUnique({
      where: { id },
      include: {
        resident: {
          include: {
            household: { select: { id: true, householdCode: true, address: true } }
          }
        },
        manager: { select: { id: true, username: true, fullname: true, role: true } }
      }
    })

    if (!change) return res.status(404).json({ success: false, message: "Resident change not found" })
    return res.json({ success: true, data: change })
  } catch (err) {
    console.error("getResidentChangeById error:", err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const createResidentChange = async (req, res) => {
  try {
    const { residentId, changeType, fromAddress, toAddress, fromDate, toDate, reason, extraData } = req.body

    const ct = Number(changeType)
    if (Number.isNaN(ct)) return res.status(400).json({ message: "changeType is invalid" })

    if (ct === 0 || ct === 3) {
      const extra = extraData || {}
      if (!extra.fullname || !extra.dob || !extra.householdId) {
        return res.status(400).json({ message: "Missing resident info (fullname/dob/householdId)" })
      }
    } else {
      if (!residentId) return res.status(400).json({ message: "residentId is required" })
    }

    const change = await prisma.residentChange.create({
      data: {
        residentId: ct === 0 || ct === 3 ? null : Number(residentId),
        changeType: ct,
        fromAddress,
        toAddress,
        fromDate: fromDate ? new Date(fromDate) : new Date(),
        toDate: toDate ? new Date(toDate) : null,
        reason: extraData ? JSON.stringify(extraData) : reason ?? null,
        approvalStatus: 0,
        managerId: null
      }
    })

    return res.status(201).json({ success: true, data: change })
  } catch (err) {
    console.error("createResidentChange error:", err)
    return res.status(500).json({ message: err.message })
  }
}

export const approveResidentChange = async (req, res) => {
  const changeId = Number(req.params.id)
  const managerId = req.user.id

  try {
    const change = await prisma.residentChange.findUnique({ where: { id: changeId } })
    if (!change || change.approvalStatus !== 0) {
      return res.status(400).json({ message: "Invalid change" })
    }

    const approved = await prisma.$transaction(async tx => {
      const c1 = await tx.residentChange.update({
        where: { id: changeId },
        data: { approvalStatus: 1, managerId }
      })

      const updated = await handleApprovedChange(tx, c1)
      return updated
    })

    return res.json({ success: true, message: "Approved successfully", data: approved })
  } catch (err) {
    console.error("approveResidentChange error:", err)
    return res.status(500).json({ message: err.message })
  }
}

export const rejectResidentChange = async (req, res) => {
  const changeId = Number(req.params.id)
  const managerId = req.user.id

  try {
    const change = await prisma.residentChange.findUnique({ where: { id: changeId } })
    if (!change || change.approvalStatus !== 0) {
      return res.status(400).json({ message: "Invalid change" })
    }

    await prisma.residentChange.update({
      where: { id: changeId },
      data: { approvalStatus: 2, managerId }
    })

    return res.json({ success: true, message: "Rejected successfully" })
  } catch (err) {
    console.error("rejectResidentChange error:", err)
    return res.status(500).json({ message: err.message })
  }
}

async function handleApprovedChange(tx, change) {
  const extra = change.reason ? safeParseJSON(change.reason) : {}

  switch (change.changeType) {
    case 0: {
      const newborn = await tx.resident.create({
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
          householdId: Number(extra.householdId),
          status: 0
        }
      })

      return await tx.residentChange.update({
        where: { id: change.id },
        data: { residentId: newborn.id },
        include: {
          resident: { include: { household: { select: { id: true, householdCode: true, address: true } } } },
          manager: { select: { id: true, username: true, fullname: true, role: true } }
        }
      })
    }

    case 3: {
      if (extra.residentCCCD) {
        const existed = await tx.resident.findUnique({ where: { residentCCCD: extra.residentCCCD } })
        if (existed) throw new Error("Resident already exists")
      }

      const resident = await tx.resident.create({
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
          householdId: Number(extra.householdId),
          status: 0
        }
      })

      return await tx.residentChange.update({
        where: { id: change.id },
        data: { residentId: resident.id },
        include: {
          resident: { include: { household: { select: { id: true, householdCode: true, address: true } } } },
          manager: { select: { id: true, username: true, fullname: true, role: true } }
        }
      })
    }

    case 4: {
      if (!change.residentId) throw new Error("residentId missing for move_out")

      const r = await tx.resident.findUnique({
        where: { id: change.residentId },
        select: { status: true }
      })
      if (!r) throw new Error("Resident not found")

      if (r.status === 4) return change

      await tx.resident.update({
        where: { id: change.residentId },
        data: { status: 3, householdId: null }
      })

      return change
    }

    case 6: {
      if (extra.householdId && extra.newOwnerId) {
        await tx.household.update({
          where: { id: Number(extra.householdId) },
          data: { ownerId: Number(extra.newOwnerId) }
        })
      }
      return change
    }

    default:
      return change
  }
}

function safeParseJSON(value) {
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}
