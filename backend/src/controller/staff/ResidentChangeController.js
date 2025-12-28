import prisma from "../../../prisma/prismaClient.js"

//////////////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////////////
async function assertHouseholdActive(txOrPrisma, householdId) {
  const hid = Number(householdId)
  if (!hid || Number.isNaN(hid)) throw new Error("householdId is invalid")

  const hh = await txOrPrisma.household.findUnique({
    where: { id: hid },
    select: { id: true, status: true, householdCode: true }
  })

  if (!hh) throw new Error("Hộ khẩu không tồn tại")
  if (Number(hh.status) !== 1) throw new Error("Hộ khẩu không còn hoạt động")
  return hh
}

async function assertResidentInHousehold(txOrPrisma, residentId, householdId) {
  const rid = Number(residentId)
  const hid = Number(householdId)
  if (Number.isNaN(rid) || Number.isNaN(hid)) throw new Error("Invalid member/household id")

  const r = await txOrPrisma.resident.findUnique({
    where: { id: rid },
    select: { id: true, householdId: true }
  })
  if (!r) throw new Error("Nhân khẩu không tồn tại")
  if (Number(r.householdId) !== hid) throw new Error("Thành viên không thuộc hộ khẩu này")
  return r
}

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

    // NOTE: pending ct 0/1/3 chưa có resident => search theo resident sẽ không match.
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
            household: { select: { id: true, householdCode: true, address: true, status: true } }
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
            household: { select: { id: true, householdCode: true, address: true, status: true } }
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
// CREATE  ✅ CHỈ TẠO CHANGE, KHÔNG TẠO RESIDENT
//////////////////////////////////////////////////////
export const createResidentChange = async (req, res) => {
  try {
    const { residentId, changeType, fromAddress, toAddress, fromDate, toDate, reason, extraData } = req.body

    const ct = Number(changeType)
    if (Number.isNaN(ct)) return res.status(400).json({ success: false, message: "changeType is invalid" })

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

      const dobDate = new Date(extra.dob)
      if (Number.isNaN(dobDate.getTime())) {
        return res.status(400).json({ success: false, message: "dob is invalid" })
      }

      if (extra.residentCCCD) {
        const existed = await prisma.resident.findUnique({
          where: { residentCCCD: String(extra.residentCCCD) }
        })
        if (existed) return res.status(400).json({ success: false, message: "CCCD đã tồn tại trong hệ thống" })
      }

      // ct 0/3 bắt buộc có householdId + household phải active
      let hid = null
      if (ct === 0 || ct === 3) {
        if (extra.householdId == null || extra.householdId === "") {
          return res.status(400).json({ success: false, message: "householdId is required" })
        }
        hid = Number(extra.householdId)
        if (Number.isNaN(hid)) return res.status(400).json({ success: false, message: "householdId is invalid" })

        // ✅ check household active
        await assertHouseholdActive(prisma, hid)
      }

      // ct 1: tạm trú cho phép không có hộ (householdId null)
      if (ct === 1 && extra.householdId) {
        const tmpHid = Number(extra.householdId)
        if (!Number.isNaN(tmpHid)) await assertHouseholdActive(prisma, tmpHid)
      }

      finalResidentId = null
      extraDataToSave = {
        fullname: extra.fullname,
        residentCCCD: extra.residentCCCD ?? null,
        dob: extra.dob,
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
    } else {
      // ===== NHÓM DÙNG CƯ DÂN CŨ (2/4/7) =====
      if (![5, 6].includes(ct)) {
        if (finalResidentId == null) {
          return res.status(400).json({ success: false, message: "residentId is required" })
        }

        // ✅ check resident tồn tại (tránh tạo change rác)
        const existedR = await prisma.resident.findUnique({ where: { id: finalResidentId }, select: { id: true } })
        if (!existedR) return res.status(400).json({ success: false, message: "residentId không tồn tại" })
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

        // ✅ check household active ngay lúc create
        await assertHouseholdActive(prisma, oldHouseholdId)

        // ✅ check member thuộc hộ (nhanh, trước khi approve)
        for (const mid of memberIds) {
          await assertResidentInHousehold(prisma, mid, oldHouseholdId)
        }
        await assertResidentInHousehold(prisma, newOwnerId, oldHouseholdId)

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
        if (oldOwnerId === newOwnerId) {
          return res.status(400).json({ success: false, message: "New owner must be different from old owner" })
        }

        // ✅ check household active
        await assertHouseholdActive(prisma, householdId)

        // ✅ check 2 người đều thuộc household
        await assertResidentInHousehold(prisma, oldOwnerId, householdId)
        await assertResidentInHousehold(prisma, newOwnerId, householdId)

        extraDataToSave = { householdId, oldOwnerId, newOwnerId }
        finalResidentId = null
      }
    }

    const change = await prisma.residentChange.create({
      data: {
        residentId: finalResidentId, // schema đã Int?
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
    console.error("createResidentChange ERROR:", err)
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
    const approved = await prisma.$transaction(async tx => {
      const change = await tx.residentChange.findUnique({ where: { id: changeId } })
      if (!change || Number(change.approvalStatus) !== 0) {
        throw new Error("Invalid change (not found or not pending)")
      }

      await tx.residentChange.update({
        where: { id: changeId },
        data: { approvalStatus: 1, managerId }
      })

      await handleApprovedChange(tx, change)
      return changeId
    })

    const final = await prisma.residentChange.findUnique({
      where: { id: approved },
      include: {
        resident: { include: { household: { select: { id: true, householdCode: true, address: true, status: true } } } },
        manager: { select: { id: true, username: true, fullname: true, role: true } }
      }
    })

    return res.json({ success: true, message: "Approved successfully", data: final })
  } catch (err) {
    console.error("approveResidentChange ERROR:", err)
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
    console.error("rejectResidentChange ERROR:", err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

//////////////////////////////////////////////////////
// HANDLE APPROVED CHANGE
//////////////////////////////////////////////////////
async function handleApprovedChange(tx, change) {
  switch (change.changeType) {
    case 0:
    case 1:
    case 3: {
      const ex = change.extraData || {}
      if (!ex.fullname || !ex.dob) throw new Error("Missing extraData to create resident")

      const dobDate = new Date(ex.dob)
      if (Number.isNaN(dobDate.getTime())) throw new Error("dob is invalid")

      // ✅ nếu có householdId thì check active lần nữa cho chắc
      if (ex.householdId != null) {
        await assertHouseholdActive(tx, ex.householdId)
      }

      if (ex.residentCCCD) {
        const existed = await tx.resident.findUnique({
          where: { residentCCCD: String(ex.residentCCCD) }
        })
        if (existed) throw new Error("CCCD đã tồn tại trong hệ thống")
      }

      const resident = await tx.resident.create({
        data: {
          residentCCCD: ex.residentCCCD ?? null,
          fullname: ex.fullname,
          dob: dobDate,
          gender: ex.gender ?? null,
          ethnicity: ex.ethnicity ?? null,
          religion: ex.religion ?? null,
          nationality: ex.nationality ?? "Việt Nam",
          hometown: ex.hometown ?? null,
          occupation: ex.occupation ?? null,
          relationToOwner: ex.relationToOwner ?? "Thành viên",
          householdId: ex.householdId ?? null,
          status: Number(ex.status ?? 0)
        }
      })

      await tx.residentChange.update({
        where: { id: change.id },
        data: { residentId: resident.id }
      })
      break
    }

    case 5: {
      const { oldHouseholdId, memberIds, newOwnerId } = change.extraData || {}
      const oldHid = Number(oldHouseholdId)
      const newOid = Number(newOwnerId)
      const memIds = Array.isArray(memberIds) ? memberIds.map(Number) : []

      if (Number.isNaN(oldHid) || Number.isNaN(newOid) || memIds.length < 1 || memIds.some(Number.isNaN)) {
        throw new Error("Invalid split household data")
      }

      // ✅ household phải active tại thời điểm duyệt
      await assertHouseholdActive(tx, oldHid)

      const oldHousehold = await tx.household.findUnique({
        where: { id: oldHid },
        include: { residents: true }
      })
      if (!oldHousehold) throw new Error("Old household not found")

      const validMemberIds = oldHousehold.residents.map(r => r.id)
      if (!memIds.every(id => validMemberIds.includes(id))) throw new Error("Member does not belong to old household")
      if (!memIds.includes(newOid)) throw new Error("New owner must be in split members")

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
        data: { householdId: newHousehold.id, relationToOwner: "Thành viên" }
      })

      await tx.resident.update({
        where: { id: newOid },
        data: { relationToOwner: "Chủ hộ" }
      })
      break
    }

    case 6: {
      const { householdId, oldOwnerId, newOwnerId } = change.extraData || {}
      const hid = Number(householdId)
      const oldOid = Number(oldOwnerId)
      const newOid = Number(newOwnerId)

      if (Number.isNaN(hid) || Number.isNaN(oldOid) || Number.isNaN(newOid)) {
        throw new Error("Invalid change owner data")
      }
      if (oldOid === newOid) throw new Error("New owner must be different from old owner")

      // ✅ household phải active
      await assertHouseholdActive(tx, hid)

      const household = await tx.household.findUnique({
        where: { id: hid },
        include: { residents: true }
      })
      if (!household) throw new Error("Household not found")

      const currentOwner = household.residents.find(r => r.relationToOwner === "Chủ hộ")
      if (!currentOwner || currentOwner.id !== oldOid) throw new Error("Old owner is not current household owner")

      const memberIds = household.residents.map(r => r.id)
      if (!memberIds.includes(newOid)) throw new Error("New owner must be household member")

      await tx.household.update({ where: { id: hid }, data: { ownerId: newOid } })
      await tx.resident.update({ where: { id: oldOid }, data: { relationToOwner: "Thành viên" } })
      await tx.resident.update({ where: { id: newOid }, data: { relationToOwner: "Chủ hộ" } })
      break
    }

    case 2:
    case 4:
    case 7: {
      if (!change.residentId) throw new Error("residentId missing for changeType 2/4/7")

      if (change.changeType === 2) {
        await tx.resident.update({ where: { id: change.residentId }, data: { status: 2 } })
      } else if (change.changeType === 4) {
        await tx.resident.update({ where: { id: change.residentId }, data: { status: 3, householdId: null } })
      } else if (change.changeType === 7) {
        await tx.resident.update({ where: { id: change.residentId }, data: { status: 4 } })
      }
      break
    }

    default:
      break
  }
}

//////////////////////////////////////////////////////
// UTILS
//////////////////////////////////////////////////////
async function generateHouseholdCode(tx) {
  while (true) {
    const code = Math.floor(100000000 + Math.random() * 900000000).toString()
    const existed = await tx.household.findUnique({ where: { householdCode: code } })
    if (!existed) return code
  }
}
