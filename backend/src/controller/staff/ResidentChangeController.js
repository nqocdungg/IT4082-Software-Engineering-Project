import prisma from "../../../prisma/prismaClient.js"

//////////////////////////////////////////////////////
// GET LIST
//////////////////////////////////////////////////////
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
        { resident: { fullname: { startsWith: q, mode: "insensitive" } } },
        { resident: { residentCCCD: { startsWith: q, mode: "insensitive" } } },
        { resident: { household: { householdCode: { startsWith: q, mode: "insensitive" } } } }
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
    return res.status(500).json({ success: false, message: err.message })
  }
}

//////////////////////////////////////////////////////
// GET BY ID
//////////////////////////////////////////////////////
export const getResidentChangeById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ success: false, message: "Missing residentChange id" })
    }
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: "ResidentChange id is invalid" })
    }

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

    if (!change) {
      return res.status(404).json({ success: false, message: "Resident change not found" })
    }

    return res.json({ success: true, data: change })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

//////////////////////////////////////////////////////
// CREATE
//////////////////////////////////////////////////////
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

    const ct = Number(changeType)
    if (Number.isNaN(ct)) {
      return res.status(400).json({ success: false, message: "changeType is invalid" })
    }

    let finalResidentId = residentId != null && residentId !== "" ? Number(residentId) : null
    if (finalResidentId != null && Number.isNaN(finalResidentId)) {
      return res.status(400).json({ success: false, message: "residentId is invalid" })
    }

    let extraDataToSave = null

    // ===== NHÓM TẠO CƯ DÂN MỚI (0/1/3) =====
    if (ct === 0 || ct === 1 || ct === 3) {
      const extra = extraData || {}
      if (!extra.fullname || !extra.dob) {
        return res.status(400).json({ success: false, message: "Missing resident info (fullname/dob)" })
      }

      if (extra.residentCCCD) {
        const existed = await tx.resident.findUnique({
          where: { residentCCCD: extra.residentCCCD }
        })
        if (existed) {
          throw new Error("CCCD đã tồn tại trong hệ thống")
        }
      }

      // ct 0/3 bắt buộc có householdId
      if ((ct === 0 || ct === 3) && !extra.householdId) {
        return res.status(400).json({ success: false, message: "householdId is required" })
      }

      const hid = extra.householdId != null ? Number(extra.householdId) : null
      if ((ct === 0 || ct === 3) && (hid == null || Number.isNaN(hid))) {
        return res.status(400).json({ success: false, message: "householdId is invalid" })
      }

      const resident = await prisma.resident.create({
        data: {
          residentCCCD: extra.residentCCCD ?? null,
          fullname: extra.fullname,
          dob: new Date(extra.dob),
          gender: extra.gender ?? null,
          ethnicity: extra.ethnicity ?? null,
          religion: extra.religion ?? null,
          nationality: extra.nationality ?? "Việt Nam",
          hometown: extra.hometown ?? null,
          occupation: extra.occupation ?? null,
          relationToOwner: extra.relationToOwner ?? "Thành viên",
          householdId: ct === 1 ? null : hid,
          status: ct === 1 ? 1 : 0
        }
      })

      finalResidentId = resident.id
      extraDataToSave = null
    } else {
      // ===== NHÓM DÙNG CƯ DÂN CŨ (2/4/7) =====
      if (![5, 6].includes(ct)) {
        if (finalResidentId == null) {
          return res.status(400).json({ success: false, message: "residentId is required" })
        }
      }

      // ===== NHÓM HỘ KHẨU (5/6) =====
      if (ct === 5) {
        const ex = extraData || {}
        const oldHouseholdId = ex.oldHouseholdId != null ? Number(ex.oldHouseholdId) : NaN
        const newOwnerId = ex.newOwnerId != null ? Number(ex.newOwnerId) : NaN
        const memberIds = Array.isArray(ex.memberIds) ? ex.memberIds.map(Number) : []

        if (Number.isNaN(oldHouseholdId)) {
          return res.status(400).json({ success: false, message: "oldHouseholdId is required/invalid" })
        }
        if (!Array.isArray(ex.memberIds) || memberIds.length < 1 || memberIds.some(n => Number.isNaN(n))) {
          return res.status(400).json({ success: false, message: "memberIds is required/invalid" })
        }
        if (Number.isNaN(newOwnerId)) {
          return res.status(400).json({ success: false, message: "newOwnerId is required/invalid" })
        }

        extraDataToSave = { oldHouseholdId, memberIds, newOwnerId }
        finalResidentId = null
      }

      if (ct === 6) {
        const ex = extraData || {}
        const householdId = ex.householdId != null ? Number(ex.householdId) : NaN
        const oldOwnerId = ex.oldOwnerId != null ? Number(ex.oldOwnerId) : NaN
        const newOwnerId = ex.newOwnerId != null ? Number(ex.newOwnerId) : NaN

        if (Number.isNaN(householdId)) {
          return res.status(400).json({ success: false, message: "householdId is required/invalid" })
        }
        if (Number.isNaN(oldOwnerId)) {
          return res.status(400).json({ success: false, message: "oldOwnerId is required/invalid" })
        }
        if (Number.isNaN(newOwnerId)) {
          return res.status(400).json({ success: false, message: "newOwnerId is required/invalid" })
        }

        extraDataToSave = { householdId, oldOwnerId, newOwnerId }
        finalResidentId = null
      }
    }

    const change = await prisma.residentChange.create({
      data: {
        residentId: finalResidentId,
        changeType: ct,
        fromAddress: fromAddress ?? null,
        toAddress: toAddress ?? null,
        fromDate: fromDate ? new Date(fromDate) : new Date(),
        toDate: toDate ? new Date(toDate) : null,
        reason: reason ?? null,
        extraData: extraDataToSave,
        approvalStatus: 0,
        managerId: null
      }
    })

    return res.status(201).json({ success: true, data: change })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

//////////////////////////////////////////////////////
// APPROVE
//////////////////////////////////////////////////////
export const approveResidentChange = async (req, res) => {
  const changeId = Number(req.params.id)
  if (!req.params.id || Number.isNaN(changeId)) {
    return res.status(400).json({ success: false, message: "ResidentChange id is invalid" })
  }

  const managerId = req.user?.id
  if (!managerId) {
    return res.status(401).json({ success: false, message: "Unauthorized (missing req.user). Check auth middleware." })
  }

  try {
    const change = await prisma.residentChange.findUnique({ where: { id: changeId } })
    if (!change || Number(change.approvalStatus) !== 0) {
      return res.status(400).json({ success: false, message: "Invalid change (not found or not pending)" })
    }

    const approved = await prisma.$transaction(async tx => {
      const updated = await tx.residentChange.update({
        where: { id: changeId },
        data: { approvalStatus: 1, managerId }
      })

      await handleApprovedChange(tx, updated)
      return updated
    })

    return res.json({ success: true, message: "Approved successfully", data: approved })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

//////////////////////////////////////////////////////
// REJECT
//////////////////////////////////////////////////////
export const rejectResidentChange = async (req, res) => {
  const changeId = Number(req.params.id)
  if (!req.params.id || Number.isNaN(changeId)) {
    return res.status(400).json({ success: false, message: "ResidentChange id is invalid" })
  }

  const managerId = req.user?.id
  if (!managerId) {
    return res.status(401).json({ success: false, message: "Unauthorized (missing req.user). Check auth middleware." })
  }

  try {
    const change = await prisma.residentChange.findUnique({ where: { id: changeId } })
    if (!change || Number(change.approvalStatus) !== 0) {
      return res.status(400).json({ success: false, message: "Invalid change (not found or not pending)" })
    }

    const updated = await prisma.residentChange.update({
      where: { id: changeId },
      data: { approvalStatus: 2, managerId }
    })

    return res.json({ success: true, message: "Rejected successfully", data: updated })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

//////////////////////////////////////////////////////
// HANDLE APPROVED CHANGE
//////////////////////////////////////////////////////
async function handleApprovedChange(tx, change) {
  switch (change.changeType) {
    case 5: {
      const { oldHouseholdId, memberIds, newOwnerId } = change.extraData || {}

      const oldHid = oldHouseholdId != null ? Number(oldHouseholdId) : NaN
      const newOid = newOwnerId != null ? Number(newOwnerId) : NaN
      const memIds = Array.isArray(memberIds) ? memberIds.map(Number) : []

      if (
        Number.isNaN(oldHid) ||
        !Array.isArray(memberIds) ||
        memIds.length < 1 ||
        memIds.some(Number.isNaN) ||
        Number.isNaN(newOid)
      ) {
        throw new Error("Invalid split household data (oldHouseholdId/memberIds/newOwnerId)")
      }

      const oldHousehold = await tx.household.findUnique({
        where: { id: oldHid },
        include: { residents: true }
      })
      if (!oldHousehold) throw new Error("Old household not found")

      const validMemberIds = oldHousehold.residents.map(r => r.id)
      if (!memIds.every(id => validMemberIds.includes(id))) {
        throw new Error("Member does not belong to old household")
      }

      if (!memIds.includes(newOid)) {
        throw new Error("New owner must be in split members")
      }

      const newHousehold = await tx.household.create({
        data: {
          ownerId: newOid,
          householdCode: await generateHouseholdCode(tx),
          address: "Chưa cập nhật",
          status: 1
        }
      })

      await tx.resident.updateMany({
        where: { id: { in: memIds } },
        data: {
          householdId: newHousehold.id,
          relationToOwner: "Thành viên"
        }
      })

      await tx.resident.update({
        where: { id: newOid },
        data: { relationToOwner: "Chủ hộ" }
      })
      break
    }

    case 6: {
      const { householdId, oldOwnerId, newOwnerId } = change.extraData || {}

      const hid = householdId != null ? Number(householdId) : NaN
      const oldOid = oldOwnerId != null ? Number(oldOwnerId) : NaN
      const newOid = newOwnerId != null ? Number(newOwnerId) : NaN

      if (Number.isNaN(hid) || Number.isNaN(oldOid) || Number.isNaN(newOid)) {
        throw new Error("Invalid change owner data (householdId/oldOwnerId/newOwnerId)")
      }

      if (oldOid === newOid) {
        throw new Error("New owner must be different from old owner")
      }

      const household = await tx.household.findUnique({
        where: { id: hid },
        include: { residents: true }
      })
      if (!household) throw new Error("Household not found")

      const currentOwner = household.residents.find(r => r.relationToOwner === "Chủ hộ")
      if (!currentOwner || currentOwner.id !== oldOid) {
        throw new Error("Old owner is not current household owner")
      }

      const memberIds = household.residents.map(r => r.id)
      if (!memberIds.includes(newOid)) {
        throw new Error("New owner must be household member")
      }

      await tx.household.update({
        where: { id: hid },
        data: { ownerId: newOid }
      })

      await tx.resident.update({
        where: { id: oldOid },
        data: { relationToOwner: "Thành viên" }
      })

      await tx.resident.update({
        where: { id: newOid },
        data: { relationToOwner: "Chủ hộ" }
      })
      break
    }

    case 0:
    case 3:
      if (!change.residentId) break
      await tx.resident.update({
        where: { id: change.residentId },
        data: { status: 0 }
      })
      break

    case 1:
      if (!change.residentId) break
      await tx.resident.update({
        where: { id: change.residentId },
        data: { status: 1 }
      })
      break

    case 2:
      if (!change.residentId) break
      await tx.resident.update({
        where: { id: change.residentId },
        data: { status: 2 }
      })
      break

    case 4:
      if (!change.residentId) break
      await tx.resident.update({
        where: { id: change.residentId },
        data: { status: 3, householdId: null }
      })
      break

    case 7:
      if (!change.residentId) break
      await tx.resident.update({
        where: { id: change.residentId },
        data: { status: 4 }
      })
      break
  }
}

//////////////////////////////////////////////////////
// UTILS
//////////////////////////////////////////////////////
async function generateHouseholdCode(tx) {
  while (true) {
    const code = Math.floor(100000000 + Math.random() * 900000000).toString()
    const existed = await tx.household.findUnique({
      where: { householdCode: code }
    })
    if (!existed) return code
  }
}