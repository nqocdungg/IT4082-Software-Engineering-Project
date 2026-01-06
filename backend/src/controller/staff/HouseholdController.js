import prisma from "../../../prisma/prismaClient.js"
import ExcelJS from "exceljs"

function toPositiveInt(raw) {
  const n = Number.parseInt(String(raw ?? ""), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

function random9Digits() {
  return Math.floor(100000000 + Math.random() * 900000000).toString()
}

async function generateUniqueHouseholdCode(tx) {
  while (true) {
    const code = random9Digits()
    const existed = await tx.household.findUnique({ where: { householdCode: code } })
    if (!existed) return code
  }
}

function parseBool(raw) {
  const v = String(raw ?? "").trim().toLowerCase()
  return v === "1" || v === "true" || v === "yes" || v === "on"
}

function nonEmptyHouseholdWhere() {
  return { residents: { some: { status: { in: [0, 1, 2] } } } }
}

export const getAllHouseholds = async (req, res) => {
  try {
    const search = String(req.query.search ?? "").trim()
    const statusRaw = String(req.query.status ?? req.query.statusFilter ?? "ALL").trim()

    const page = toPositiveInt(req.query.page) || 1
    const limit = toPositiveInt(req.query.limit ?? req.query.rowsPerPage) || 10

    const includeEmpty = parseBool(req.query.includeEmpty)

    const where = {}

    if (statusRaw !== "ALL" && statusRaw !== "") {
      const s = Number(statusRaw)
      if ([0, 1].includes(s)) where.status = s
    }

    if (!includeEmpty) {
      where.AND = [...(where.AND || []), nonEmptyHouseholdWhere()]
    }

    if (search) {
      where.OR = [
        { householdCode: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { owner: { fullname: { contains: search, mode: "insensitive" } } },
        { owner: { residentCCCD: { contains: search } } }
      ]
    }

    const [total, rows, grouped] = await prisma.$transaction([
      prisma.household.count({ where }),
      prisma.household.findMany({
        where,
        include: { owner: true, residents: true },
        orderBy: { id: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.household.groupBy({
        by: ["status"],
        _count: { _all: true }
      })
    ])

    const data = rows.map(h => ({
      ...h,
      membersCount: (h.residents || []).filter(r => [0, 1, 2].includes(Number(r.status))).length
    }))

    const totalPages = Math.max(1, Math.ceil(total / limit))

    const groupedMap = Object.fromEntries(grouped.map(g => [Number(g.status), g._count._all]))
    const active = groupedMap[1] || 0
    const inactive = groupedMap[0] || 0

    return res.status(200).json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        stats: { active, inactive, totalActive: active },
        range: {
          start: total === 0 ? 0 : (page - 1) * limit + 1,
          end: total === 0 ? 0 : Math.min(page * limit, total)
        }
      }
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const searchHouseholds = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim()
    if (!q) return res.json({ success: true, data: [] })

    const includeEmpty = parseBool(req.query.includeEmpty)

    const where = {
      OR: [
        { householdCode: { startsWith: q, mode: "insensitive" } },
        { address: { startsWith: q, mode: "insensitive" } }
      ]
    }

    if (!includeEmpty) {
      where.AND = [...(where.AND || []), nonEmptyHouseholdWhere()]
    }

    const list = await prisma.household.findMany({
      where,
      orderBy: { id: "desc" },
      take: 20,
      select: { id: true, householdCode: true, address: true, status: true, ownerId: true }
    })

    return res.json({ success: true, data: list })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const getHouseholdMembers = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id)
    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid household id" })
    }

    const members = await prisma.resident.findMany({
      where: { householdId: id },
      orderBy: [{ relationToOwner: "asc" }, { id: "asc" }],
      select: {
        id: true,
        residentCCCD: true,
        fullname: true,
        dob: true,
        gender: true,
        relationToOwner: true
      }
    })

    return res.json({ success: true, data: members })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const getHouseholdById = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id)

    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid household id" })
    }

    const household = await prisma.household.findUnique({
      where: { id },
      include: {
        owner: true,
        residents: {
          where: { status: { notIn: [3, 4] } },
          orderBy: [{ relationToOwner: "asc" }, { id: "asc" }]
        },
        feeRecords: true
      }
    })

    if (!household) {
      return res.status(404).json({ success: false, message: "Household not found" })
    }

    return res.status(200).json({ success: true, data: household })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const generateHouseholdCode = async (req, res) => {
  try {
    const code = await prisma.$transaction(tx => generateUniqueHouseholdCode(tx))
    return res.status(200).json({ success: true, code })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const createHousehold = async (req, res) => {
  const { address, owner, members = [] } = req.body

  if (!address || !owner) {
    return res.status(400).json({ success: false, message: "Missing required fields" })
  }

  try {
    const cccdSet = new Set()
    if (owner.residentCCCD) cccdSet.add(owner.residentCCCD)

    for (const m of members) {
      if (!m.residentCCCD) continue
      if (cccdSet.has(m.residentCCCD)) {
        return res.status(400).json({ success: false, message: "CCCD bị trùng trong danh sách nhân khẩu" })
      }
      cccdSet.add(m.residentCCCD)
    }

    const result = await prisma.$transaction(async tx => {
      const householdCode = await generateUniqueHouseholdCode(tx)

      if (owner.residentCCCD) {
        const existedOwner = await tx.resident.findUnique({ where: { residentCCCD: owner.residentCCCD } })
        if (existedOwner) throw new Error("Chủ hộ đã tồn tại trong hệ thống")
      }

      for (const m of members) {
        if (!m.residentCCCD) continue
        const existed = await tx.resident.findUnique({ where: { residentCCCD: m.residentCCCD } })
        if (existed) throw new Error(`Nhân khẩu ${m.fullname} đã tồn tại trong hệ thống`)
      }

      const household = await tx.household.create({
        data: { householdCode, address, status: 1 }
      })

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

      await tx.household.update({
        where: { id: household.id },
        data: { ownerId: ownerResident.id }
      })

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

    return res.status(201).json({ success: true, data: result })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export const updateHouseholdAddress = async (req, res) => {
  const householdId = toPositiveInt(req.params.id)
  const address = String(req.body?.address ?? "").trim()

  if (!householdId) {
    return res.status(400).json({ success: false, message: "Invalid household id" })
  }
  if (!address) {
    return res.status(400).json({ success: false, message: "Address is required" })
  }

  try {
    const updated = await prisma.household.update({
      where: { id: householdId },
      data: { address }
    })
    return res.status(200).json({ success: true, data: updated })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const changeHouseholdStatus = async (req, res) => {
  const householdId = toPositiveInt(req.params.id)
  const nextStatus = Number(req.body?.status)

  if (!householdId) {
    return res.status(400).json({ success: false, message: "Invalid household id" })
  }
  if (![0, 1].includes(nextStatus)) {
    return res.status(400).json({ success: false, message: "Invalid status (only 0 or 1)" })
  }

  try {
    const updated = await prisma.$transaction(async tx => {
      const household = await tx.household.update({
        where: { id: householdId },
        data: { status: nextStatus }
      })

      if (nextStatus === 1) {
        await tx.resident.updateMany({
          where: { householdId, status: 3 },
          data: { status: 0 }
        })
      } else {
        await tx.resident.updateMany({
          where: { householdId, status: { in: [0, 1, 2] } },
          data: { status: 3 }
        })
      }

      return household
    })

    return res.status(200).json({ success: true, data: updated })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const exportHouseholdsExcel = async (req, res) => {
  try {
    const search = String(req.query.search ?? "").trim()
    const statusRaw = String(req.query.status ?? "ALL").trim()
    const includeEmpty = parseBool(req.query.includeEmpty)

    const where = {}

    if (statusRaw !== "ALL" && statusRaw !== "") {
      const s = Number(statusRaw)
      if ([0, 1].includes(s)) where.status = s
    }

    if (!includeEmpty) {
      where.AND = [...(where.AND || []), nonEmptyHouseholdWhere()]
    }

    if (search) {
      where.OR = [
        { householdCode: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { owner: { fullname: { contains: search, mode: "insensitive" } } },
        { owner: { residentCCCD: { contains: search } } }
      ]
    }

    const households = await prisma.household.findMany({
      where,
      include: {
        owner: true,
        residents: true
      },
      orderBy: { id: "desc" }
    })

    const STATUS_LABEL = {
      1: "Đang hoạt động",
      0: "Ngừng hoạt động"
    }

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("Hộ khẩu")

    ws.columns = [
      { header: "Mã hộ khẩu", key: "householdCode", width: 20 },
      { header: "Địa chỉ", key: "address", width: 35 },
      { header: "Chủ hộ", key: "ownerName", width: 25 },
      { header: "CCCD chủ hộ", key: "ownerCCCD", width: 20 },
      { header: "Số nhân khẩu", key: "membersCount", width: 15 },
      { header: "Trạng thái", key: "status", width: 18 }
    ]

    households.forEach(h => {
      const membersCount = (h.residents || []).filter(r => [0, 1, 2].includes(Number(r.status))).length

      ws.addRow({
        householdCode: h.householdCode,
        address: h.address || "",
        ownerName: h.owner?.fullname || "",
        ownerCCCD: h.owner?.residentCCCD || "",
        membersCount,
        status: STATUS_LABEL[h.status] ?? "Không rõ"
      })
    })

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", "attachment; filename=households.xlsx")

    await wb.xlsx.write(res)
    res.end()
  } catch (err) {
    console.error("exportHouseholdsExcel error:", err)
    return res.status(500).json({ success: false, message: err.message })
  }
}
