import prisma from "../../../prisma/prismaClient.js"

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

export const getResidentChangeById = async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id || Number.isNaN(id)) {
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

export const createResidentChange = async (req, res) => {
  try {
    const { residentId, changeType, fromAddress, toAddress, fromDate, toDate, reason, extraData } = req.body

    const ct = Number(changeType)
    if (Number.isNaN(ct)) {
      return res.status(400).json({ success: false, message: "changeType is invalid" })
    }

    let finalResidentId = residentId != null && residentId !== "" ? Number(residentId) : null
    if (finalResidentId != null && Number.isNaN(finalResidentId)) {
      return res.status(400).json({ success: false, message: "residentId is invalid" })
    }

    let extraDataToSave = null
    let finalFromAddress = fromAddress ?? null

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
        if (existed) {
          return res.status(400).json({ success: false, message: "CCCD đã tồn tại trong hệ thống" })
        }
      }

      let hid = null
      let hhCode = null

      if (ct === 0 || ct === 3) {
        if (extra.householdId == null || extra.householdId === "") {
          return res.status(400).json({ success: false, message: "householdId is required" })
        }
        hid = Number(extra.householdId)
        if (Number.isNaN(hid)) {
          return res.status(400).json({ success: false, message: "householdId is invalid" })
        }

        const hh = await assertHouseholdActive(prisma, hid)
        hhCode = hh.householdCode || null
      }

      if (ct === 1 && extra.householdId) {
        const tmpHid = Number(extra.householdId)
        if (!Number.isNaN(tmpHid)) {
          const hh = await assertHouseholdActive(prisma, tmpHid)
          hhCode = hh.householdCode || null
        }
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
        householdCode: hhCode,
        status: ct === 1 ? 1 : 0
      }
    } else {
      if (![5, 6].includes(ct)) {
        if (finalResidentId == null) {
          return res.status(400).json({ success: false, message: "residentId is required" })
        }

        const existedR = await prisma.resident.findUnique({
          where: { id: finalResidentId },
          select: {
            id: true,
            status: true,
            householdId: true,
            relationToOwner: true,
            household: { select: { id: true, address: true, status: true, householdCode: true } }
          }
        })

        if (!existedR) {
          return res.status(400).json({ success: false, message: "residentId không tồn tại" })
        }

        if (Number(existedR.status) === 3 || Number(existedR.status) === 4) {
          return res.status(400).json({
            success: false,
            message: "Nhân khẩu đã chuyển đi hoặc đã khai tử, không thể tạo biến động"
          })
        }

        if (ct === 2 || ct === 4 || ct === 7) {
          finalFromAddress = existedR?.household?.address || null
        }

        if ((ct === 4 || ct === 7) && String(existedR.relationToOwner || "").trim() === "Chủ hộ") {
          const hid = Number(existedR.householdId || existedR.household?.id || 0)
          if (!hid || Number.isNaN(hid)) {
            return res.status(400).json({ success: false, message: "Chủ hộ không có hộ khẩu hợp lệ" })
          }

          const ex = extraData || {}
          const newOwnerId = Number(ex.newOwnerId)
          if (!newOwnerId || Number.isNaN(newOwnerId) || newOwnerId === finalResidentId) {
            return res.status(400).json({ success: false, message: "Chủ hộ chuyển đi/khai tử: phải chọn chủ hộ mới hợp lệ" })
          }

          const hh = await assertHouseholdActive(prisma, hid)
          await assertResidentInHousehold(prisma, newOwnerId, hid)

          extraDataToSave = {
            householdId: hid,
            householdCode: hh.householdCode || null,
            oldOwnerId: finalResidentId,
            newOwnerId
          }
        }
      }

      if (ct === 5) {
        const ex = extraData || {}
        const oldHouseholdId = Number(ex.oldHouseholdId)
        const newOwnerId = Number(ex.newOwnerId)
        const memberIds = Array.isArray(ex.memberIds) ? ex.memberIds.map(Number) : []

        if (Number.isNaN(oldHouseholdId) || Number.isNaN(newOwnerId) || memberIds.length < 1) {
          return res.status(400).json({ success: false, message: "Invalid split household data" })
        }

        const oldHh = await assertHouseholdActive(prisma, oldHouseholdId)

        for (const mid of memberIds) {
          await assertResidentInHousehold(prisma, mid, oldHouseholdId)
        }
        await assertResidentInHousehold(prisma, newOwnerId, oldHouseholdId)

        extraDataToSave = {
          oldHouseholdId,
          oldHouseholdCode: oldHh.householdCode || null,
          memberIds,
          newOwnerId
        }
        finalResidentId = null
      }

      if (ct === 6) {
        const ex = extraData || {}
        const householdId = Number(ex.householdId)
        const oldOwnerId = Number(ex.oldOwnerId)
        const newOwnerId = Number(ex.newOwnerId)

        if (
          Number.isNaN(householdId) ||
          Number.isNaN(oldOwnerId) ||
          Number.isNaN(newOwnerId) ||
          oldOwnerId === newOwnerId
        ) {
          return res.status(400).json({ success: false, message: "Invalid change owner data" })
        }

        const hh = await assertHouseholdActive(prisma, householdId)

        await assertResidentInHousehold(prisma, oldOwnerId, householdId)
        await assertResidentInHousehold(prisma, newOwnerId, householdId)

        extraDataToSave = {
          householdId,
          householdCode: hh.householdCode || null,
          oldOwnerId,
          newOwnerId
        }
        finalResidentId = null
      }
    }

    const change = await prisma.residentChange.create({
      data: {
        residentId: finalResidentId,
        changeType: ct,
        fromAddress: finalFromAddress,
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

export const approveResidentChange = async (req, res) => {
  const changeId = Number(req.params.id)
  if (!changeId || Number.isNaN(changeId)) {
    return res.status(400).json({ success: false, message: "ResidentChange id is invalid" })
  }

  const managerId = req.user?.id
  if (!managerId) {
    return res.status(401).json({ success: false, message: "Unauthorized" })
  }

  try {
    await prisma.$transaction(async tx => {
      const change = await tx.residentChange.findUnique({ where: { id: changeId } })
      if (!change || Number(change.approvalStatus) !== 0) {
        throw new Error("Invalid change")
      }

      await tx.residentChange.update({
        where: { id: changeId },
        data: { approvalStatus: 1, managerId }
      })

      await handleApprovedChange(tx, change)
    })

    const final = await prisma.residentChange.findUnique({
      where: { id: changeId },
      include: {
        resident: {
          include: { household: { select: { id: true, householdCode: true, address: true, status: true } } }
        },
        manager: { select: { id: true, username: true, fullname: true, role: true } }
      }
    })

    return res.json({ success: true, data: final })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const rejectResidentChange = async (req, res) => {
  const changeId = Number(req.params.id)
  if (!changeId || Number.isNaN(changeId)) {
    return res.status(400).json({ success: false, message: "ResidentChange id is invalid" })
  }

  const managerId = req.user?.id
  if (!managerId) {
    return res.status(401).json({ success: false, message: "Unauthorized" })
  }

  try {
    const change = await prisma.residentChange.findUnique({ where: { id: changeId } })
    if (!change || Number(change.approvalStatus) !== 0) {
      return res.status(400).json({ success: false, message: "Invalid change" })
    }

    const updated = await prisma.residentChange.update({
      where: { id: changeId },
      data: { approvalStatus: 2, managerId }
    })

    return res.json({ success: true, data: updated })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

async function handleApprovedChange(tx, change) {
  switch (change.changeType) {
    case 0:
    case 1:
    case 3: {
      const ex = change.extraData || {}

      const resident = await tx.resident.create({
        data: {
          residentCCCD: ex.residentCCCD ?? null,
          fullname: ex.fullname,
          dob: new Date(ex.dob),
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

      const newHousehold = await tx.household.create({
        data: {
          ownerId: Number(newOwnerId),
          householdCode: await generateHouseholdCode(tx),
          address: "Chưa cập nhật",
          status: 1
        }
      })

      await tx.resident.updateMany({
        where: { id: { in: memberIds.map(Number) } },
        data: { householdId: newHousehold.id, relationToOwner: "Thành viên" }
      })

      await tx.resident.update({
        where: { id: Number(newOwnerId) },
        data: { relationToOwner: "Chủ hộ" }
      })

      await tx.residentChange.update({
        where: { id: change.id },
        data: { extraData: { ...change.extraData, newHouseholdCode: newHousehold.householdCode } }
      })
      break
    }

    case 6: {
      const { householdId, oldOwnerId, newOwnerId } = change.extraData || {}

      await tx.household.update({
        where: { id: Number(householdId) },
        data: { ownerId: Number(newOwnerId) }
      })

      await tx.resident.update({
        where: { id: Number(oldOwnerId) },
        data: { relationToOwner: "Thành viên" }
      })

      await tx.resident.update({
        where: { id: Number(newOwnerId) },
        data: { relationToOwner: "Chủ hộ" }
      })
      break
    }

    case 2:
      await tx.resident.update({ where: { id: change.residentId }, data: { status: 2 } })
      break

    case 4: {
      const ex = change.extraData || {}
      if (ex?.householdId && ex?.newOwnerId) {
        await tx.household.update({
          where: { id: Number(ex.householdId) },
          data: { ownerId: Number(ex.newOwnerId) }
        })

        if (ex?.oldOwnerId) {
          await tx.resident.update({
            where: { id: Number(ex.oldOwnerId) },
            data: { relationToOwner: "Thành viên" }
          })
        }

        await tx.resident.update({
          where: { id: Number(ex.newOwnerId) },
          data: { relationToOwner: "Chủ hộ" }
        })
      }

      await tx.resident.update({ where: { id: change.residentId }, data: { status: 3, householdId: null } })
      break
    }

    case 7: {
      const ex = change.extraData || {}
      if (ex?.householdId && ex?.newOwnerId) {
        await tx.household.update({
          where: { id: Number(ex.householdId) },
          data: { ownerId: Number(ex.newOwnerId) }
        })

        if (ex?.oldOwnerId) {
          await tx.resident.update({
            where: { id: Number(ex.oldOwnerId) },
            data: { relationToOwner: "Thành viên" }
          })
        }

        await tx.resident.update({
          where: { id: Number(ex.newOwnerId) },
          data: { relationToOwner: "Chủ hộ" }
        })
      }

      await tx.resident.update({ where: { id: change.residentId }, data: { status: 4 } })
      break
    }
  }
}

async function generateHouseholdCode(tx) {
  while (true) {
    const code = Math.floor(100000000 + Math.random() * 900000000).toString()
    const existed = await tx.household.findUnique({ where: { householdCode: code } })
    if (!existed) return code
  }
}
