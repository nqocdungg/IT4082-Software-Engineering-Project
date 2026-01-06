import prisma from "../../../prisma/prismaClient.js"
import ExcelJS from "exceljs"

function toInt(v, def = undefined) {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

function buildMonthRange(ym) {
  if (!ym) return null
  const start = new Date(`${ym}-01`)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  return { gte: start, lt: end }
}

function changeTypeLabel(code) {
  const c = Number(code)
  if (c === 0) return "Khai sinh"
  if (c === 1) return "Tạm trú"
  if (c === 2) return "Tạm vắng"
  if (c === 3) return "Nhập hộ / Chuyển đến"
  if (c === 4) return "Chuyển đi"
  if (c === 5) return "Tách hộ"
  if (c === 6) return "Đổi chủ hộ"
  if (c === 7) return "Khai tử"
  return "Không rõ"
}

function approvalLabel(code) {
  const c = Number(code)
  if (c === 0) return "Chờ duyệt"
  if (c === 1) return "Đã duyệt"
  if (c === 2) return "Từ chối"
  return "Không rõ"
}

function dmy(d) {
  if (!d) return ""
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return ""
  return x.toLocaleDateString("vi-VN")
}

function makeWhere({ search, changeType, approvalStatus, month }) {
  const where = {}

  const ct = toInt(changeType)
  if (ct !== undefined) where.changeType = ct

  const ap = toInt(approvalStatus)
  if (ap !== undefined) where.approvalStatus = ap

  const mr = buildMonthRange(month)
  if (mr) where.createdAt = mr

  const q = String(search || "").trim()
  if (q) {
    where.OR = [
      { reason: { contains: q, mode: "insensitive" } },
      { fromAddress: { contains: q, mode: "insensitive" } },
      { toAddress: { contains: q, mode: "insensitive" } },
      {
        resident: {
          OR: [
            { fullname: { contains: q, mode: "insensitive" } },
            { residentCCCD: { contains: q, mode: "insensitive" } },
            {
              household: {
                OR: [
                  { householdCode: { contains: q, mode: "insensitive" } },
                  { address: { contains: q, mode: "insensitive" } }
                ]
              }
            }
          ]
        }
      },
      {
        manager: {
          OR: [
            { fullname: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } }
          ]
        }
      }
    ]
  }

  return where
}

function makeOrderBy(sort) {
  const s = String(sort || "NEWEST").toUpperCase()
  if (s === "OLDEST") return [{ createdAt: "asc" }]
  return [{ createdAt: "desc" }]
}

const includeFull = {
  resident: {
    include: {
      household: true
    }
  },
  manager: {
    select: { id: true, username: true, fullname: true, role: true }
  }
}

export async function listResidentChangeHistory(req, res) {
  try {
    const { search, changeType, approvalStatus, month, sort } = req.query

    const where = makeWhere({ search, changeType, approvalStatus, month })
    const orderBy = makeOrderBy(sort)

    const data = await prisma.residentChange.findMany({
      where,
      orderBy,
      include: includeFull
    })

    return res.json({ data })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: "Không thể tải lịch sử biến động." })
  }
}

export async function getResidentChangeHistoryDetail(req, res) {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ message: "ID không hợp lệ." })

    const data = await prisma.residentChange.findUnique({
      where: { id },
      include: includeFull
    })

    if (!data) return res.status(404).json({ message: "Không tìm thấy bản ghi." })

    return res.json({ data })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: "Không thể tải chi tiết biến động." })
  }
}

export async function exportResidentChangeHistoryExcel(req, res) {
  try {
    const { search, changeType, approvalStatus, month, sort } = req.query

    const where = makeWhere({ search, changeType, approvalStatus, month })
    const orderBy = makeOrderBy(sort)

    const rows = await prisma.residentChange.findMany({
      where,
      orderBy,
      include: includeFull
    })

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("ResidentChangeHistory")

    ws.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Loại biến động", key: "changeType", width: 22 },
      { header: "Trạng thái", key: "approval", width: 14 },
      { header: "Từ ngày", key: "fromDate", width: 14 },
      { header: "Đến ngày", key: "toDate", width: 14 },
      { header: "Nhân khẩu", key: "residentName", width: 26 },
      { header: "CCCD", key: "cccd", width: 18 },
      { header: "Hộ khẩu", key: "household", width: 14 },
      { header: "Địa chỉ hộ", key: "hhAddress", width: 30 },
      { header: "Địa chỉ đi", key: "fromAddress", width: 30 },
      { header: "Địa chỉ đến", key: "toAddress", width: 30 },
      { header: "Lý do", key: "reason", width: 30 },
      { header: "Người xử lý", key: "manager", width: 22 },
      { header: "Ngày tạo", key: "createdAt", width: 14 }
    ]

    ws.getRow(1).font = { bold: true }

    for (const it of rows) {
      const residentName = it?.resident?.fullname || (it.residentId ? `NK #${it.residentId}` : "")
      const cccd = it?.resident?.residentCCCD || ""
      const household = it?.resident?.household?.householdCode || (it?.resident?.householdId != null ? `HK #${it.resident.householdId}` : "")
      const hhAddress = it?.resident?.household?.address || ""
      const manager = it?.manager?.fullname || it?.manager?.username || (it.managerId ? `CB #${it.managerId}` : "")

      ws.addRow({
        id: it.id,
        changeType: changeTypeLabel(it.changeType),
        approval: approvalLabel(it.approvalStatus),
        fromDate: dmy(it.fromDate),
        toDate: dmy(it.toDate),
        residentName,
        cccd,
        household,
        hhAddress,
        fromAddress: it.fromAddress || "",
        toAddress: it.toAddress || "",
        reason: it.reason || "",
        manager,
        createdAt: dmy(it.createdAt)
      })
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="resident_change_history_${new Date().toISOString().slice(0, 10)}.xlsx"`
    )

    await wb.xlsx.write(res)
    res.end()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: "Xuất Excel thất bại." })
  }
}
