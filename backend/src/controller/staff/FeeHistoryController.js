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

function buildMonthRange(month) {
  if (!month) return null
  const start = new Date(`${month}-01`)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  return { gte: start, lt: end }
}

function buildYearRange(year) {
  if (!year) return null
  const y = toInt(year)
  if (!y) return null
  const start = new Date(`${y}-01-01`)
  const end = new Date(`${y + 1}-01-01`)
  return { gte: start, lt: end }
}

function buildWhere(query, opts = {}) {
  const { ignoreStatus = false } = opts

  const { q, householdId, feeTypeId, method, status, month, year } = query
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

  const mRange = buildMonthRange(month)
  const yRange = !mRange ? buildYearRange(year) : null

  if (mRange) where.createdAt = mRange
  else if (yRange) where.createdAt = yRange

  const kw = String(q || "").trim()
  if (kw) {
    where.OR = [
      { household: { householdCode: { contains: kw, mode: "insensitive" } } },
      { household: { address: { contains: kw, mode: "insensitive" } } },
      { feeType: { name: { contains: kw, mode: "insensitive" } } },
      { manager: { fullname: { contains: kw, mode: "insensitive" } } }
    ]
  }

  return where
}

export const getFeeHistory = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1))
    const pageSize = Math.min(100, Math.max(5, toInt(req.query.pageSize, 10)))
    const skip = (page - 1) * pageSize

    const where = buildWhere(req.query) // where cho bảng (có status nếu đang filter)
    const statsWhere = buildWhere(req.query, { ignoreStatus: true }) // where cho card (bỏ status)

    const sort = String(req.query.sort || "desc").toLowerCase()
    const order = sort === "asc" ? "asc" : "desc"

    const [tableTotal, rows, grouped, statsTotal] = await Promise.all([
      prisma.feeRecord.count({ where }),
      prisma.feeRecord.findMany({
        where,
        orderBy: { createdAt: order },
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
        where: statsWhere,
        _count: { _all: true }
      }),
      prisma.feeRecord.count({ where: statsWhere })
    ])

    const map = new Map(grouped.map(g => [g.status, g._count._all]))
    const stats = {
      total: statsTotal,
      pending: map.get(0) || 0,
      partial: map.get(1) || 0,
      paid: map.get(2) || 0
    }

    res.json({
      data: rows,
      meta: {
        page,
        pageSize,
        total: tableTotal,
        totalPages: Math.max(1, Math.ceil(tableTotal / pageSize)),
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

    const sort = String(req.query.sort || "desc").toLowerCase()
    const order = sort === "asc" ? "asc" : "desc"

    const rows = await prisma.feeRecord.findMany({
      where,
      orderBy: { createdAt: order },
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
      const collector = String(r.method || "").toUpperCase() === "ONLINE" ? "Hệ thống" : r.manager?.fullname || ""
      ws.addRow({
        createdAt: r.createdAt ? new Date(r.createdAt) : "",
        householdCode: r.household?.householdCode || "",
        address: r.household?.address || "",
        feeName: r.feeType?.name || "",
        feeKind: kindLabel(!!r.feeType?.isMandatory),
        amount: r.amount ?? 0,
        method: r.method,
        status: statusLabel(r.status),
        manager: collector,
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

    if (!record) return res.status(404).json({ message: "Không tìm thấy giao dịch" })

    const doc = new PDFDocument({ size: "A4", margin: 50 })
    const filename = `hoa_don_thu_phi_${record.id}.pdf`

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`)

    doc.pipe(res)

    doc.registerFont("TNR", FONT_REG)
    doc.registerFont("TNRB", FONT_BOLD)
    doc.registerFont("TNRI", FONT_ITALIC)
    doc.registerFont("TNRBI", FONT_BOLD_ITALIC)

    const statusLabel = record.status === 0 ? "Chưa nộp" : record.status === 1 ? "Nộp 1 phần" : "Đã nộp"
    const collector =
      String(record.method || "").toUpperCase() === "ONLINE" ? "Hệ thống" : record.manager?.fullname || "—"

    doc.font("TNRB").fontSize(14).text("BAN QUẢN LÝ KHU DÂN CƯ", { align: "center" }).moveDown(0.5)
    doc.font("TNRB").fontSize(18).text("HÓA ĐƠN THU PHÍ", { align: "center" }).moveDown(1.5)

    doc.font("TNR").fontSize(11)
    doc.text(`Mã hóa đơn: ${record.id}`)
    doc.text(`Ngày thu: ${record.createdAt.toLocaleString("vi-VN")}`)
    doc.text(`Hình thức: ${record.method}`)
    doc.moveDown(1)

    doc.font("TNRB").fontSize(12).text("Thông tin hộ dân", { underline: true }).moveDown(0.5)
    doc.font("TNR").fontSize(11)
    doc.text(`Mã hộ: ${record.household.householdCode}`)
    doc.text(`Địa chỉ: ${record.household.address}`)
    doc.moveDown(1)

    doc.font("TNRB").fontSize(12).text("Chi tiết khoản thu", { underline: true }).moveDown(0.5)
    doc.font("TNR").fontSize(11)
    doc.text(`Khoản thu: ${record.feeType.name}`)
    doc.text(`Loại: ${record.feeType.isMandatory ? "Bắt buộc" : "Tự nguyện"}`)
    if (record.feeType.unitPrice != null) doc.text(`Đơn giá: ${Number(record.feeType.unitPrice).toLocaleString("vi-VN")} đ`)
    doc.moveDown(0.5)

    doc.font("TNRB").fontSize(13).text(`Số tiền đã thu: ${Number(record.amount).toLocaleString("vi-VN")} đ`)
    doc.moveDown(1)

    doc.font("TNR").fontSize(11)
    doc.text(`Trạng thái: ${statusLabel}`)
    if (record.description) doc.text(`Ghi chú: ${record.description}`)

    doc.moveDown(2)
    doc.text(`Người thu: ${collector}`)
    doc.text("Chữ ký người thu: ________________________")

    doc.moveDown(2)
    doc.font("TNR").fontSize(10).fillColor("gray").text("Hóa đơn được tạo tự động từ hệ thống quản lý thu phí", { align: "center" })

    doc.end()
  } catch (e) {
    console.error("printFeeInvoicePdf error:", e)
    res.status(500).json({ message: "Không tạo được hóa đơn PDF" })
  }
}