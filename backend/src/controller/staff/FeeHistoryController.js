import prisma from "../../../prisma/prismaClient.js"
import ExcelJS from "exceljs"
import PDFDocument from "pdfkit"
import path from "path"
import { fileURLToPath } from "url"
 
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
 
const FONT_REG = path.join(__dirname, "../../../assets/font/TIMES.TTF")
const FONT_BOLD = path.join(__dirname, "../../../assets/font/TIMESBD.TTF")
const FONT_ITALIC = path.join(__dirname, "../../../assets/font/TIMESI.TTF")
const FONT_BOLD_ITALIC = path.join(__dirname, "../../../assets/font/TIMESBI.TTF")
 
function toInt(v, def = undefined) {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

function isValidMonthStr(month) {
  const s = String(month ?? "").trim()
  return /^\d{4}-\d{2}$/.test(s)
}

function monthRange(month) {
  if (!isValidMonthStr(month)) return null
  const [y, m] = String(month).split("-").map(Number)
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0)
  const end = new Date(y, m, 1, 0, 0, 0, 0)
  return { gte: start, lt: end }
}

function buildWhere(query, { ignoreStatus = false } = {}) {
  const { q, householdId, feeTypeId, method, status, fromDate, toDate, month } = query
  const where = {}
 
  if (householdId) where.householdId = toInt(householdId)
  if (feeTypeId) where.feeTypeId = toInt(feeTypeId)
 
  if (method && ["ONLINE", "OFFLINE"].includes(String(method).toUpperCase())) {
    where.method = String(method).toUpperCase()
  }
 
  if (!ignoreStatus) {
    if (status !== undefined && status !== "" && ["0", "1", "2", 0, 1, 2].includes(status)) {
      where.status = toInt(status)
    }
  }

  const mr = monthRange(month)

  if (mr) {
    where.createdAt = mr
  } else if (fromDate || toDate) {
    const createdAt = {}
    if (fromDate) createdAt.gte = new Date(fromDate)
    if (toDate) {
      const d = new Date(toDate)
      d.setHours(23, 59, 59, 999)
      createdAt.lte = d
    }
    if (Object.keys(createdAt).length) where.createdAt = createdAt
  }

  const kw = String(q || "").trim()
  if (kw) {
    where.OR = [
      { household: { householdCode: { startsWith: kw, mode: "insensitive" } } },
      { household: { address: { contains: kw, mode: "insensitive" } } },
      { feeType: { name: { contains: kw, mode: "insensitive" } } },
      { manager: { fullname: { contains: kw, mode: "insensitive" } } }
    ]
  }
 
  return where
}

function parseSort(raw) {
  const s = String(raw || "").toLowerCase()
  return s === "asc" ? "asc" : "desc"
}

export const getFeeHistory = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1))
    const pageSize = Math.min(100, Math.max(5, toInt(req.query.pageSize, 10)))
    const skip = (page - 1) * pageSize

    const sortDir = parseSort(req.query.sort)

    const where = buildWhere(req.query)
    const whereForStats = buildWhere(req.query, { ignoreStatus: true })

    const [total, rows, grouped] = await Promise.all([
      prisma.feeRecord.count({ where }),
      prisma.feeRecord.findMany({
        where,
        orderBy: { createdAt: sortDir },
        skip,
        take: pageSize,
        include: {
          household: { select: { id: true, householdCode: true, address: true } },
          feeType: { select: { id: true, name: true, isMandatory: true, unitPrice: true } },
          manager: { select: { id: true, fullname: true, username: true, role: true } }
        }
      }),
      prisma.feeRecord.groupBy({
        by: ["status"],
        where: whereForStats,
        _count: { _all: true }
      })
    ])

    const stats = { total: 0, paid: 0, pending: 0, partial: 0 }
    for (const g of grouped || []) {
      const c = Number(g?._count?._all || 0)
      stats.total += c
      if (g.status === 2) stats.paid += c
      else if (g.status === 0) stats.pending += c
      else if (g.status === 1) stats.partial += c
    }
 
    res.json({
      data: rows,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        stats
      }
    })
  } catch (e) {
    console.error("getFeeHistory error:", e)
    res.status(500).json({ message: "Không tải được lịch sử thu phí" })
  }
}
 
export const getFeeHistoryDetail = async (req, res) => {
  try {
    const id = toInt(req.params.id)
    const row = await prisma.feeRecord.findUnique({
      where: { id },
      include: {
        household: true,
        feeType: true,
        manager: { select: { id: true, fullname: true, username: true, role: true } }
      }
    })
 
    if (!row) return res.status(404).json({ message: "Không tìm thấy bản ghi thu phí" })
    res.json({ data: row })
  } catch (e) {
    console.error("getFeeHistoryDetail error:", e)
    res.status(500).json({ message: "Không tải được chi tiết thu phí" })
  }
}
 
export const createOfflineFeeRecord = async (req, res) => {
  try {
    const { householdId, feeTypeId, amount, status, description } = req.body
 
    if (!householdId || !feeTypeId || amount === undefined || amount === null) {
      return res.status(400).json({ message: "Thiếu householdId, feeTypeId hoặc amount" })
    }
 
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt < 0) {
      return res.status(400).json({ message: "amount không hợp lệ" })
    }
 
    const st = status === undefined || status === null ? 2 : Number(status)
    if (![0, 1, 2].includes(st)) {
      return res.status(400).json({ message: "status phải là 0, 1 hoặc 2" })
    }
 
    const managerId = req.user?.id
    if (!managerId) return res.status(401).json({ message: "Chưa đăng nhập" })
 
    const created = await prisma.feeRecord.create({
      data: {
        householdId: Number(householdId),
        feeTypeId: Number(feeTypeId),
        amount: amt,
        status: st,
        method: "OFFLINE",
        description: description ? String(description) : null,
        managerId
      },
      include: {
        household: { select: { householdCode: true, address: true } },
        feeType: { select: { name: true, isMandatory: true } },
        manager: { select: { fullname: true } }
      }
    })
 
    res.json({ data: created })
  } catch (e) {
    console.error("createOfflineFeeRecord error:", e)
    res.status(500).json({ message: "Không tạo được bản ghi thu phí" })
  }
}
 
export const exportFeeHistoryExcel = async (req, res) => {
  try {
    const where = buildWhere(req.query)
    const sortDir = parseSort(req.query.sort)

    const rows = await prisma.feeRecord.findMany({
      where,
      orderBy: { createdAt: sortDir },
      include: {
        household: { select: { householdCode: true, address: true } },
        feeType: { select: { name: true, isMandatory: true } },
        manager: { select: { fullname: true } }
      }
    })
 
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("Fee History")
 
    ws.columns = [
      { header: "Thời gian", key: "createdAt", width: 20 },
      { header: "Mã hộ", key: "householdCode", width: 12 },
      { header: "Địa chỉ", key: "address", width: 30 },
      { header: "Khoản thu", key: "feeName", width: 25 },
      { header: "Loại", key: "feeKind", width: 12 },
      { header: "Số tiền", key: "amount", width: 14 },
      { header: "Hình thức", key: "method", width: 10 },
      { header: "Trạng thái", key: "status", width: 14 },
      { header: "Người thu", key: "manager", width: 18 },
      { header: "Ghi chú", key: "description", width: 25 }
    ]
 
    const statusLabel = s => (s === 0 ? "Chưa nộp" : s === 1 ? "Nộp 1 phần" : "Đã nộp")
    const kindLabel = m => (m ? "Bắt buộc" : "Tự nguyện")
 
    rows.forEach(r => {
      ws.addRow({
        createdAt: r.createdAt ? new Date(r.createdAt) : "",
        householdCode: r.household?.householdCode || "",
        address: r.household?.address || "",
        feeName: r.feeType?.name || "",
        feeKind: kindLabel(!!r.feeType?.isMandatory),
        amount: r.amount ?? 0,
        method: r.method,
        status: statusLabel(r.status),
        manager: r.manager?.fullname || "",
        description: r.description || ""
      })
    })
 
    ws.getColumn("createdAt").numFmt = "dd/mm/yyyy hh:mm"
    ws.getColumn("amount").numFmt = "#,##0"
 
    const buf = await wb.xlsx.writeBuffer()
    const filename = `fee_history_${Date.now()}.xlsx`
 
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    res.send(Buffer.from(buf))
  } catch (e) {
    console.error("exportFeeHistoryExcel error:", e)
    res.status(500).json({ message: "Không xuất được Excel lịch sử thu phí" })
  }
}
 
export const printFeeInvoicePdf = async (req, res) => {
  try {
    const id = toInt(req.params.id)
 
    const record = await prisma.feeRecord.findUnique({
      where: { id },
      include: {
        household: true,
        feeType: true,
        manager: { select: { fullname: true } }
      }
    })

    if (!record) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" })
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 50
    })

    const filename = `hoa_don_thu_phi_${record.id}.pdf`
 
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`)
 
    doc.pipe(res)
 
    doc.registerFont("TNR", FONT_REG)
    doc.registerFont("TNRB", FONT_BOLD)
    doc.registerFont("TNRI", FONT_ITALIC)
    doc.registerFont("TNRBI", FONT_BOLD_ITALIC)
 
    const statusLabel = record.status === 0 ? "Chưa nộp" : record.status === 1 ? "Nộp 1 phần" : "Đã nộp"

    doc.font("TNRB").fontSize(14).text("BAN QUẢN LÝ KHU DÂN CƯ", { align: "center" }).moveDown(0.5)
    doc.font("TNRB").fontSize(18).text("HÓA ĐƠN THU PHÍ", { align: "center" }).moveDown(1.5)
 
    doc.font("TNR").fontSize(11)
    doc.text(`Mã hóa đơn: ${record.id}`)
    doc.text(`Ngày thu: ${record.createdAt.toLocaleString("vi-VN")}`)
    doc.text(`Hình thức: ${record.method}`)
    doc.moveDown(1)

    doc.font("TNRB").fontSize(12).text("Thông tin hộ dân", { underline: true })
    doc.moveDown(0.5)
    doc.font("TNR").fontSize(11)
    doc.text(`Mã hộ: ${record.household.householdCode}`)
    doc.text(`Địa chỉ: ${record.household.address}`)
    doc.moveDown(1)

    doc.font("TNRB").fontSize(12).text("Chi tiết khoản thu", { underline: true })
    doc.moveDown(0.5)
    doc.font("TNR").fontSize(11)
    doc.text(`Khoản thu: ${record.feeType.name}`)
    doc.text(`Loại: ${record.feeType.isMandatory ? "Bắt buộc" : "Tự nguyện"}`)
    if (record.feeType.unitPrice != null) {
      doc.text(`Đơn giá: ${Number(record.feeType.unitPrice).toLocaleString("vi-VN")} đ`)
    }
    doc.moveDown(0.5)
 
    doc.font("TNRB").fontSize(13).text(`Số tiền đã thu: ${Number(record.amount).toLocaleString("vi-VN")} đ`)
    doc.moveDown(1)
 
    doc.font("TNR").fontSize(11)
    doc.text(`Trạng thái: ${statusLabel}`)
    if (record.description) doc.text(`Ghi chú: ${record.description}`)
 
    doc.moveDown(2)
    doc.text(`Người thu: ${record.manager?.fullname || "—"}`)
    doc.text("Chữ ký người thu: ________________________")
 
    doc.moveDown(2)
    doc.font("TNR")
      .fontSize(10)
      .fillColor("gray")
      .text("Hóa đơn được tạo tự động từ hệ thống quản lý thu phí", { align: "center" })

    doc.end()
  } catch (e) {
    console.error("printFeeInvoicePdf error:", e)
    res.status(500).json({ message: "Không tạo được hóa đơn PDF" })
  }
}
