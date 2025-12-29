import prisma from "../../../prisma/prismaClient.js"
import ExcelJS from "exceljs"

function parseDateOnly(s) {
  if (!s) return null
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function endOfDay(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function dateRangeWhere(from, to) {
  const where = {}
  const f = parseDateOnly(from)
  const t = parseDateOnly(to)

  if (f && t) where.createdAt = { gte: f, lte: endOfDay(t) }
  else if (f) where.createdAt = { gte: f }
  else if (t) where.createdAt = { lte: endOfDay(t) }

  return where
}

function mandatoryWhere(mandatory) {
  if (!mandatory || mandatory === "ALL") return {}
  if (mandatory === "MANDATORY") return { feeType: { isMandatory: true } }
  if (mandatory === "OPTIONAL") return { feeType: { isMandatory: false } }
  return {}
}

function statusWhere(status) {
  if (status === undefined || status === null || status === "" || status === "ALL") return {}
  return { status: Number(status) }
}

function fmtDate(d) {
  if (!d) return ""
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return ""
  const dd = String(x.getDate()).padStart(2, "0")
  const mm = String(x.getMonth() + 1).padStart(2, "0")
  const yyyy = x.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function money(v) {
  const n = Number(v || 0)
  return Math.round(n * 100) / 100
}

function setHeaderRow(ws, rowIndex = 1) {
  const r = ws.getRow(rowIndex)
  r.font = { bold: true }
  r.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
  r.height = 22
}

function setMoneyFmt(cell) {
  cell.numFmt = "#,##0.00"
}

export const reportSummary = async (req, res) => {
  try {
    const { from, to, mandatory = "ALL", status = "ALL" } = req.query

    const where = {
      ...dateRangeWhere(from, to),
      ...mandatoryWhere(mandatory),
      ...statusWhere(status)
    }

    const [count, agg, onlineAgg, offlineAgg] = await Promise.all([
      prisma.feeRecord.count({ where }),
      prisma.feeRecord.aggregate({ where, _sum: { amount: true } }),
      prisma.feeRecord.aggregate({
        where: { ...where, method: "ONLINE" },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.feeRecord.aggregate({
        where: { ...where, method: "OFFLINE" },
        _sum: { amount: true },
        _count: { _all: true }
      })
    ])


    return res.json({
      data: {
        totalTransactions: count,
        totalCollected: agg._sum.amount || 0,
        online: {
          transactions: onlineAgg._count._all || 0,
          collected: onlineAgg._sum.amount || 0
        },
        offline: {
          transactions: offlineAgg._count._all || 0,
          collected: offlineAgg._sum.amount || 0
        }
      }
    })
  } catch (e) {
    console.error("reportSummary error:", e)
    return res.status(500).json({ message: "Lỗi báo cáo tổng quan" })
  }
}

export const reportByFee = async (req, res) => {
  try {
    const { from, to, mandatory = "ALL" } = req.query

    const where = {
      ...dateRangeWhere(from, to),
      ...mandatoryWhere(mandatory)
    }

    const rows = await prisma.feeRecord.groupBy({
      by: ["feeTypeId"],
      where,
      _sum: { amount: true },
      _count: { _all: true }
    })

    const feeTypeIds = rows.map(r => r.feeTypeId)
    if (feeTypeIds.length === 0) return res.json({ data: [] })

    const feeTypes = await prisma.feeType.findMany({
      where: { id: { in: feeTypeIds } },
      select: { id: true, name: true, isMandatory: true, unitPrice: true, fromDate: true, toDate: true, isActive: true }
    })
    const feeMap = new Map(feeTypes.map(f => [f.id, f]))

    const [onlineRows, offlineRows] = await Promise.all([
      prisma.feeRecord.groupBy({
        by: ["feeTypeId"],
        where: { ...where, method: "ONLINE" },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.feeRecord.groupBy({
        by: ["feeTypeId"],
        where: { ...where, method: "OFFLINE" },
        _sum: { amount: true },
        _count: { _all: true }
      })
    ])

    const onlineMap = new Map(onlineRows.map(r => [r.feeTypeId, r]))
    const offlineMap = new Map(offlineRows.map(r => [r.feeTypeId, r]))

    const data = rows
      .map(r => {
        const fee = feeMap.get(r.feeTypeId)
        const on = onlineMap.get(r.feeTypeId)
        const off = offlineMap.get(r.feeTypeId)

        return {
          feeTypeId: r.feeTypeId,
          feeName: fee?.name || "Unknown",
          isMandatory: !!fee?.isMandatory,
          isActive: !!fee?.isActive,
          unitPrice: fee?.unitPrice ?? null,
          fromDate: fee?.fromDate ?? null,
          toDate: fee?.toDate ?? null,
          totalCollected: r._sum.amount || 0,
          transactions: r._count._all || 0,
          onlineCollected: on?._sum?.amount || 0,
          onlineTransactions: on?._count?._all || 0,
          offlineCollected: off?._sum?.amount || 0,
          offlineTransactions: off?._count?._all || 0
        }
      })
      .sort((a, b) => b.totalCollected - a.totalCollected)

    return res.json({ data })
  } catch (e) {
    console.error("reportByFee error:", e)
    return res.status(500).json({ message: "Lỗi báo cáo theo khoản thu" })
  }
}

export const reportOutstandingByFee = async (req, res) => {
  try {
    const feeTypeId = Number(req.query.feeTypeId)
    if (!feeTypeId) return res.status(400).json({ message: "feeTypeId không hợp lệ" })

    const fee = await prisma.feeType.findUnique({
      where: { id: feeTypeId },
      select: { id: true, name: true, isMandatory: true, unitPrice: true }
    })
    if (!fee) return res.status(404).json({ message: "Không tìm thấy khoản thu" })
    if (!fee.isMandatory) return res.status(400).json({ message: "Khoản thu này không phải bắt buộc" })
    if (fee.unitPrice == null) return res.status(400).json({ message: "Khoản thu bắt buộc cần unitPrice" })

    const households = await prisma.household.findMany({
      where: { status: 1 },
      select: {
        id: true,
        householdCode: true,
        address: true,
        residents: { where: { status: 0 }, select: { id: true } }
      }
    })

    const paidRows = await prisma.feeRecord.groupBy({
      by: ["householdId"],
      where: { feeTypeId },
      _sum: { amount: true }
    })
    const paidMap = new Map(paidRows.map(r => [r.householdId, r._sum.amount || 0]))

    const data = households
      .map(h => {
        const persons = h.residents.length
        const expected = persons * fee.unitPrice
        const paid = paidMap.get(h.id) || 0
        const remaining = Math.max(0, expected - paid)

        return {
          householdId: h.id,
          householdCode: h.householdCode,
          address: h.address,
          persons,
          expected,
          paid,
          remaining,
          status: remaining <= 0 ? 2 : paid > 0 ? 1 : 0
        }
      })
      .filter(x => x.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining)

    return res.json({
      data: {
        feeType: fee,
        households: data
      }
    })
  } catch (e) {
    console.error("reportOutstandingByFee error:", e)
    return res.status(500).json({ message: "Lỗi truy soát hộ còn thiếu" })
  }
}

export const exportFeeReportExcel = async (req, res) => {
  try {
    const { from, to, mandatory = "ALL", status = "ALL", search = "" } = req.query

    const baseWhere = {
      ...dateRangeWhere(from, to),
      ...mandatoryWhere(mandatory)
    }

    if (String(search || "").trim()) {
      const q = String(search).trim()
      baseWhere.feeType = {
        ...(baseWhere.feeType || {}),
        name: { contains: q, mode: "insensitive" }
      }
    }

    const summaryWhere = {
      ...baseWhere,
      ...statusWhere(status)
    }

    const [summaryCount, summaryAgg, onlineAgg, offlineAgg] = await Promise.all([
      prisma.feeRecord.count({ where: summaryWhere }),
      prisma.feeRecord.aggregate({ where: summaryWhere, _sum: { amount: true } }),
      prisma.feeRecord.aggregate({
        where: { ...summaryWhere, method: "ONLINE" },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.feeRecord.aggregate({
        where: { ...summaryWhere, method: "OFFLINE" },
        _sum: { amount: true },
        _count: { _all: true }
      })
    ])

    const byFeeRows = await prisma.feeRecord.groupBy({
      by: ["feeTypeId"],
      where: baseWhere,
      _sum: { amount: true },
      _count: { _all: true }
    })

    const feeTypeIds = byFeeRows.map(r => r.feeTypeId)
    const feeTypes = feeTypeIds.length
      ? await prisma.feeType.findMany({
          where: { id: { in: feeTypeIds } },
          select: { id: true, name: true, isMandatory: true, unitPrice: true, fromDate: true, toDate: true, isActive: true, shortDescription: true, longDescription: true }
        })
      : []

    const feeMap = new Map(feeTypes.map(f => [f.id, f]))

    const [onlineRows, offlineRows] = await Promise.all([
      prisma.feeRecord.groupBy({
        by: ["feeTypeId"],
        where: { ...baseWhere, method: "ONLINE" },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.feeRecord.groupBy({
        by: ["feeTypeId"],
        where: { ...baseWhere, method: "OFFLINE" },
        _sum: { amount: true },
        _count: { _all: true }
      })
    ])

    const onlineMap = new Map(onlineRows.map(r => [r.feeTypeId, r]))
    const offlineMap = new Map(offlineRows.map(r => [r.feeTypeId, r]))

    const byFeeData = byFeeRows
      .map(r => {
        const fee = feeMap.get(r.feeTypeId)
        const on = onlineMap.get(r.feeTypeId)
        const off = offlineMap.get(r.feeTypeId)

        return {
          feeTypeId: r.feeTypeId,
          feeName: fee?.name || "Unknown",
          type: fee?.isMandatory ? "Bắt buộc" : "Tự nguyện",
          active: fee?.isActive ? "Đang áp dụng" : "Đã khóa",
          unitPrice: fee?.unitPrice ?? null,
          fromDate: fee?.fromDate ?? null,
          toDate: fee?.toDate ?? null,
          totalCollected: r._sum.amount || 0,
          transactions: r._count._all || 0,
          onlineCollected: on?._sum?.amount || 0,
          onlineTransactions: on?._count?._all || 0,
          offlineCollected: off?._sum?.amount || 0,
          offlineTransactions: off?._count?._all || 0
        }
      })
      .sort((a, b) => b.totalCollected - a.totalCollected)

    const wb = new ExcelJS.Workbook()
    wb.creator = "RMS Fee Report"
    wb.created = new Date()

    const ws1 = wb.addWorksheet("Summary", { views: [{ state: "frozen", ySplit: 1 }] })
    ws1.columns = [
      { header: "Chỉ số", key: "k", width: 28 },
      { header: "Giá trị", key: "v", width: 30 }
    ]
    setHeaderRow(ws1, 1)

    const totalCollected = summaryAgg._sum.amount || 0
    ws1.addRow({ k: "Từ ngày", v: from ? fmtDate(from) : "" })
    ws1.addRow({ k: "Đến ngày", v: to ? fmtDate(to) : "" })
    ws1.addRow({ k: "Loại khoản thu", v: mandatory })
    ws1.addRow({ k: "Trạng thái giao dịch", v: status })
    ws1.addRow({ k: "Tổng giao dịch", v: summaryCount })
    ws1.addRow({ k: "Tổng đã thu", v: money(totalCollected) })
    ws1.addRow({ k: "Online - giao dịch", v: onlineAgg._count._all || 0 })
    ws1.addRow({ k: "Online - đã thu", v: money(onlineAgg._sum.amount || 0) })
    ws1.addRow({ k: "Offline - giao dịch", v: offlineAgg._count._all || 0 })
    ws1.addRow({ k: "Offline - đã thu", v: money(offlineAgg._sum.amount || 0) })

    ;[6, 8, 10].forEach(r => setMoneyFmt(ws1.getCell(`B${r}`)))

    const ws2 = wb.addWorksheet("By Fee", { views: [{ state: "frozen", ySplit: 1 }] })
    ws2.columns = [
      { header: "FeeTypeId", key: "feeTypeId", width: 10 },
      { header: "Khoản thu", key: "feeName", width: 28 },
      { header: "Loại", key: "type", width: 12 },
      { header: "Mô tả", key: "shortDescription", width: 40 },
      { header: "Trạng thái", key: "active", width: 14 },
      { header: "Đơn giá", key: "unitPrice", width: 14 },
      { header: "Từ ngày", key: "fromDate", width: 12 },
      { header: "Đến ngày", key: "toDate", width: 12 },
      { header: "Tổng thu", key: "totalCollected", width: 16 },
      { header: "Giao dịch", key: "transactions", width: 10 },
      { header: "Online thu", key: "onlineCollected", width: 14 },
      { header: "Online gd", key: "onlineTransactions", width: 10 },
      { header: "Offline thu", key: "offlineCollected", width: 14 },
      { header: "Offline gd", key: "offlineTransactions", width: 10 }
    ]
    setHeaderRow(ws2, 1)

    byFeeData.forEach(r => {
      const row = ws2.addRow({
        feeTypeId: r.feeTypeId,
        feeName: r.feeName,
        type: r.type,
        active: r.active,
        unitPrice: r.unitPrice == null ? "" : money(r.unitPrice),
        fromDate: r.fromDate ? fmtDate(r.fromDate) : "",
        toDate: r.toDate ? fmtDate(r.toDate) : "",
        totalCollected: money(r.totalCollected),
        transactions: r.transactions,
        onlineCollected: money(r.onlineCollected),
        onlineTransactions: r.onlineTransactions,
        offlineCollected: money(r.offlineCollected),
        offlineTransactions: r.offlineTransactions
      })

      setMoneyFmt(ws2.getCell(`E${row.number}`))
      setMoneyFmt(ws2.getCell(`H${row.number}`))
      setMoneyFmt(ws2.getCell(`J${row.number}`))
      setMoneyFmt(ws2.getCell(`L${row.number}`))
    })

    const filename = `fee_report_${Date.now()}.xlsx`
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)

    const buffer = await wb.xlsx.writeBuffer()
    return res.send(Buffer.from(buffer))
  } catch (e) {
    console.error("exportFeeReportExcel error:", e)
    return res.status(500).json({ message: "Không thể xuất file Excel" })
  }
}
