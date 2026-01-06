// backend/src/controller/staff/FeeReportController.js
import prisma from "../../../prisma/prismaClient.js"
import ExcelJS from "exceljs"

// ✅ Cố định mốc "hiện tại" và cận trên dữ liệu là hết 2025
const NOW = new Date(2025, 11, 31, 0, 0, 0, 0) // 31/12/2025 (local)
const END_2025 = new Date(2026, 0, 1, 0, 0, 0, 0) // cận trên: < 01/01/2026

// Parse an toàn cho chuỗi ngày "YYYY-MM-DD" (tránh lệch timezone)
function parseDateOnly(dateStr) {
  if (!dateStr) return null
  const s = String(dateStr).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number)
    return new Date(y, m - 1, d)
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

function buildDateRange({ year, fromDate, toDate }) {
  if (fromDate && toDate) {
    const start = parseDateOnly(fromDate) || new Date(fromDate)
    const end = parseDateOnly(toDate) || new Date(toDate)
    return { gte: start, lte: end }
  }

  if (year) {
    const y = Number(year)
    const start = new Date(y, 0, 1)
    const end = new Date(y + 1, 0, 1)
    return { gte: start, lt: end }
  }

  return undefined
}

function buildMonthRange(month) {
  if (!month) return undefined
  const s = String(month).trim()
  if (!/^\d{4}-\d{2}$/.test(s)) return undefined

  const [y, m] = s.split("-").map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 1)
  return { gte: start, lt: end }
}

function getCurrentMonthRange() {
  const start = new Date(NOW.getFullYear(), NOW.getMonth(), 1)
  const end = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 1)
  return { gte: start, lt: end }
}

function pickNewer(a, b) {
  if (!a) return b
  if (!b) return a
  const at = a.updatedAt || a.createdAt
  const bt = b.updatedAt || b.createdAt
  return bt > at ? b : a
}

async function getActiveResidentCount() {
  return prisma.resident.count({
    where: {
      status: { in: [0, 1] },
      household: { is: { status: 1 } }
    }
  })
}

async function getEffectiveMandatoryFeeTypes(range) {
  const start = range?.gte ?? new Date(1970, 0, 1)
  const end = range?.lt ?? range?.lte ?? new Date(2999, 11, 31)

  return prisma.feeType.findMany({
    where: {
      isActive: true,
      isMandatory: true,
      OR: [{ fromDate: null }, { fromDate: { lte: end } }],
      AND: [{ OR: [{ toDate: null }, { toDate: { gte: start } }] }]
    },
    select: { id: true, unitPrice: true }
  })
}

async function sumCollectedAll(range) {
  const where = { status: { in: [1, 2] } }
  if (range) where.createdAt = range
  const agg = await prisma.feeRecord.aggregate({ where, _sum: { amount: true } })
  return Number(agg._sum.amount || 0)
}

async function sumCollectedMandatory(range, mandatoryIds) {
  if (!mandatoryIds.length) return 0
  const where = { status: { in: [1, 2] }, feeTypeId: { in: mandatoryIds } }
  if (range) where.createdAt = range
  const agg = await prisma.feeRecord.aggregate({ where, _sum: { amount: true } })
  return Number(agg._sum.amount || 0)
}

async function getActiveHouseholdIds() {
  const households = await prisma.household.findMany({
    where: { status: 1 },
    select: { id: true }
  })
  return households.map((h) => h.id)
}

async function getAllActiveFeeTypeIds() {
  const feeTypes = await prisma.feeType.findMany({
    where: { isActive: true },
    select: { id: true }
  })
  return feeTypes.map((f) => f.id)
}

async function getTop6FeeTypeIdsAllTime(activeHouseholdIds) {
  if (!activeHouseholdIds.length) return []

  const groups = await prisma.feeRecord.groupBy({
    by: ["feeTypeId"],
    where: {
      householdId: { in: activeHouseholdIds },
      status: { in: [1, 2] },
      createdAt: { lt: END_2025 } // ✅ cận trên 2025
    },
    _sum: { amount: true }
  })

  groups.sort((a, b) => Number(b._sum.amount || 0) - Number(a._sum.amount || 0))
  return groups.slice(0, 6).map((g) => g.feeTypeId)
}

export const getFeeReportOverview = async (req, res) => {
  try {
    // ✅ "All time" nhưng chỉ tính tới hết 2025
    const range = { lt: END_2025 }

    const totalCollected = await sumCollectedAll(range)

    const residentCount = await getActiveResidentCount()
    const mandatoryFeeTypes = await getEffectiveMandatoryFeeTypes(range)
    const mandatoryIds = mandatoryFeeTypes.map((f) => f.id)
    const unitSum = mandatoryFeeTypes.reduce((s, f) => s + Number(f.unitPrice || 0), 0)

    const mandatoryExpected = residentCount * unitSum
    const collectedMandatory = await sumCollectedMandatory(range, mandatoryIds)

    const mandatoryRemaining = Math.max(0, mandatoryExpected - collectedMandatory)
    const completionRate =
      mandatoryExpected > 0 ? Number(((collectedMandatory / mandatoryExpected) * 100).toFixed(2)) : 0

    const collectedVoluntary = Math.max(0, totalCollected - collectedMandatory)

    res.json({
      totalCollected,
      collectedMandatory,
      collectedVoluntary,
      mandatoryExpected,
      mandatoryRemaining,
      completionRate
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get fee report overview" })
  }
}

export const getMonthlyFeeReport = async (req, res) => {
  try {
    const { year } = req.query
    if (!year) return res.status(400).json({ message: "year is required" })

    const y = Number(year)
    const start = new Date(y, 0, 1)
    const end = new Date(y + 1, 0, 1)

    const records = await prisma.feeRecord.findMany({
      where: { createdAt: { gte: start, lt: end }, status: { in: [1, 2] } },
      include: { feeType: { select: { isMandatory: true } } }
    })

    const result = Array.from({ length: 12 }, (_, i) => ({
      month: `T${i + 1}`,
      fixedFee: 0,
      voluntaryFee: 0
    }))

    records.forEach((r) => {
      const m = new Date(r.createdAt).getMonth()
      if (r.feeType?.isMandatory) result[m].fixedFee += Number(r.amount || 0)
      else result[m].voluntaryFee += Number(r.amount || 0)
    })

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get monthly fee report" })
  }
}

export const getFeeReportByFeeType = async (req, res) => {
  try {
    // ✅ "All time" nhưng chỉ tính tới hết 2025
    const range = { lt: END_2025 }

    const activeIds = await getActiveHouseholdIds()
    const totalActiveHouseholds = activeIds.length

    const feeTypes = await prisma.feeType.findMany({
      where: { isActive: true },
      select: { id: true, name: true, isMandatory: true, unitPrice: true, fromDate: true, toDate: true }
    })

    const residentCount = await getActiveResidentCount()
    const rows = []

    for (const ft of feeTypes) {
      const where = {
        feeTypeId: ft.id,
        householdId: { in: activeIds },
        status: { in: [1, 2] }
      }
      if (range) where.createdAt = range

      const records = await prisma.feeRecord.findMany({
        where,
        select: { amount: true, householdId: true }
      })

      const paidHouseholdIds = new Set()
      let totalCollected = 0

      records.forEach((r) => {
        totalCollected += Number(r.amount || 0)
        paidHouseholdIds.add(r.householdId)
      })

      const paidHouseholds = paidHouseholdIds.size

      let completionRate = 0
      if (ft.isMandatory && Number(ft.unitPrice || 0) > 0) {
        const expected = residentCount * Number(ft.unitPrice || 0)
        completionRate = expected > 0 ? Math.round((totalCollected / expected) * 100) : 0
        completionRate = Math.min(100, Math.max(0, completionRate))
      } else {
        completionRate = totalActiveHouseholds > 0 ? Math.round((paidHouseholds / totalActiveHouseholds) * 100) : 0
      }

      rows.push({
        feeTypeId: ft.id,
        name: ft.name,
        totalHouseholds: totalActiveHouseholds,
        paidHouseholds,
        totalCollected,
        completionRate,
        _paidHouseholdIds: paidHouseholdIds
      })
    }

    rows.sort((a, b) => {
      if (b.totalCollected !== a.totalCollected) return b.totalCollected - a.totalCollected
      return b.paidHouseholds - a.paidHouseholds
    })

    const top6 = rows.slice(0, 6)
    const others = rows.slice(6)

    if (others.length > 0) {
      const otherPaid = new Set()
      let otherTotalCollected = 0

      others.forEach((item) => {
        otherTotalCollected += Number(item.totalCollected || 0)
        item._paidHouseholdIds.forEach((id) => otherPaid.add(id))
      })

      const otherPaidCount = otherPaid.size
      top6.push({
        feeTypeId: null,
        name: "Các loại phí khác",
        totalHouseholds: totalActiveHouseholds,
        paidHouseholds: otherPaidCount,
        totalCollected: otherTotalCollected,
        completionRate: totalActiveHouseholds > 0 ? Math.round((otherPaidCount / totalActiveHouseholds) * 100) : 0
      })
    }

    top6.forEach((item) => delete item._paidHouseholdIds)

    top6.sort((a, b) => {
      const aOther = a.name === "Các loại phí khác"
      const bOther = b.name === "Các loại phí khác"
      if (aOther !== bOther) return aOther ? 1 : -1

      if (Number(b.totalCollected) !== Number(a.totalCollected)) return Number(b.totalCollected) - Number(a.totalCollected)
      return Number(b.paidHouseholds) - Number(a.paidHouseholds)
    })

    res.json(top6)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get fee report by fee type" })
  }
}

export const getHouseholdPaymentStatus = async (req, res) => {
  try {
    const { month, feeTypeId } = req.query

    // ✅ Nếu không truyền month thì lấy tháng của NOW (31/12/2025)
    const range = month ? buildMonthRange(month) : getCurrentMonthRange()

    const householdIds = await getActiveHouseholdIds()
    const totalHouseholds = householdIds.length
    const pct = (n) => (totalHouseholds ? Number(((n / totalHouseholds) * 100).toFixed(1)) : 0)

    if (feeTypeId && feeTypeId !== "ALL" && feeTypeId !== "OTHER") {
      const ftid = Number(feeTypeId)

      const records = await prisma.feeRecord.findMany({
        where: { householdId: { in: householdIds }, feeTypeId: ftid, createdAt: range },
        select: { householdId: true, status: true, createdAt: true, updatedAt: true }
      })

      const latestByHousehold = new Map()
      records.forEach((r) => {
        const cur = latestByHousehold.get(r.householdId)
        latestByHousehold.set(r.householdId, pickNewer(cur, r))
      })

      let completed = 0
      let incomplete = 0
      let notPaid = 0

      householdIds.forEach((hid) => {
        const latest = latestByHousehold.get(hid)
        if (!latest) notPaid++
        else if (Number(latest.status) === 2) completed++
        else incomplete++
      })

      return res.json({
        totalHouseholds,
        completed,
        incomplete,
        notPaid,
        rates: { completed: pct(completed), incomplete: pct(incomplete), notPaid: pct(notPaid) }
      })
    }

    if (feeTypeId === "OTHER") {
      const activeHouseholdIds = householdIds
      const top6Ids = await getTop6FeeTypeIdsAllTime(activeHouseholdIds)
      const allFeeTypeIds = await getAllActiveFeeTypeIds()
      const otherIds = allFeeTypeIds.filter((id) => !top6Ids.includes(id))

      if (otherIds.length === 0) {
        return res.json({
          totalHouseholds,
          completed: 0,
          incomplete: 0,
          notPaid: totalHouseholds,
          rates: { completed: 0, incomplete: 0, notPaid: 100 }
        })
      }

      const records = await prisma.feeRecord.findMany({
        where: { householdId: { in: householdIds }, feeTypeId: { in: otherIds }, createdAt: range },
        select: { householdId: true, feeTypeId: true, status: true, createdAt: true, updatedAt: true }
      })

      const latestByHouseholdFee = new Map()
      records.forEach((r) => {
        const key = `${r.householdId}-${r.feeTypeId}`
        const cur = latestByHouseholdFee.get(key)
        latestByHouseholdFee.set(key, pickNewer(cur, r))
      })

      let completed = 0
      let incomplete = 0
      let notPaid = 0

      householdIds.forEach((hid) => {
        let haveAny = 0
        let completeCount = 0

        for (const ftid of otherIds) {
          const latest = latestByHouseholdFee.get(`${hid}-${ftid}`)
          if (!latest) continue
          haveAny++
          if (Number(latest.status) === 2) completeCount++
        }

        if (haveAny === 0) notPaid++
        else if (haveAny === otherIds.length && completeCount === otherIds.length) completed++
        else incomplete++
      })

      return res.json({
        totalHouseholds,
        completed,
        incomplete,
        notPaid,
        rates: { completed: pct(completed), incomplete: pct(incomplete), notPaid: pct(notPaid) }
      })
    }

    const mandatoryFees = await prisma.feeType.findMany({
      where: { isMandatory: true, isActive: true },
      select: { id: true }
    })
    const mandatoryIds = mandatoryFees.map((f) => f.id)

    if (mandatoryIds.length === 0) {
      return res.json({
        totalHouseholds,
        completed: 0,
        incomplete: 0,
        notPaid: totalHouseholds,
        rates: { completed: 0, incomplete: 0, notPaid: 100 }
      })
    }

    const records = await prisma.feeRecord.findMany({
      where: { householdId: { in: householdIds }, feeTypeId: { in: mandatoryIds }, createdAt: range },
      select: { householdId: true, feeTypeId: true, status: true, createdAt: true, updatedAt: true }
    })

    const latestByHouseholdFee = new Map()
    records.forEach((r) => {
      const key = `${r.householdId}-${r.feeTypeId}`
      const cur = latestByHouseholdFee.get(key)
      latestByHouseholdFee.set(key, pickNewer(cur, r))
    })

    let completed = 0
    let incomplete = 0
    let notPaid = 0

    householdIds.forEach((hid) => {
      let haveAny = 0
      let completeCount = 0

      for (const ftid of mandatoryIds) {
        const latest = latestByHouseholdFee.get(`${hid}-${ftid}`)
        if (!latest) continue
        haveAny++
        if (Number(latest.status) === 2) completeCount++
      }

      if (haveAny === 0) notPaid++
      else if (haveAny === mandatoryIds.length && completeCount === mandatoryIds.length) completed++
      else incomplete++
    })

    res.json({
      totalHouseholds,
      completed,
      incomplete,
      notPaid,
      rates: { completed: pct(completed), incomplete: pct(incomplete), notPaid: pct(notPaid) }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get household payment status" })
  }
}

export const getFeeReportComparison = async (req, res) => {
  try {
    const { type, current } = req.query
    if (!type || !current) return res.status(400).json({ message: "type and current are required" })

    let currentRange, previousRange

    if (type === "month") {
      // ✅ parse "YYYY-MM" an toàn
      if (!/^\d{4}-\d{2}$/.test(String(current))) {
        return res.status(400).json({ message: "current must be YYYY-MM for month comparison" })
      }
      const [y, m] = String(current).split("-").map(Number)

      const cur = new Date(y, m - 1, 1)
      const prev = new Date(y, m - 2, 1)

      currentRange = { gte: cur, lt: new Date(cur.getFullYear(), cur.getMonth() + 1, 1) }
      previousRange = { gte: prev, lt: new Date(prev.getFullYear(), prev.getMonth() + 1, 1) }
    } else {
      currentRange = buildDateRange({ year: current })
      previousRange = buildDateRange({ year: Number(current) - 1 })
    }

    const calc = async (range) => {
      const totalCollectedAll = await sumCollectedAll(range)

      const residentCount = await getActiveResidentCount()
      const mandatoryFeeTypes = await getEffectiveMandatoryFeeTypes(range)
      const mandatoryIds = mandatoryFeeTypes.map((f) => f.id)
      const unitSum = mandatoryFeeTypes.reduce((s, f) => s + Number(f.unitPrice || 0), 0)

      const mandatoryExpected = residentCount * unitSum
      const collectedMandatory = await sumCollectedMandatory(range, mandatoryIds)
      const completionMandatory =
        mandatoryExpected > 0 ? Number(((collectedMandatory / mandatoryExpected) * 100).toFixed(2)) : 0

      return { collectedAll: totalCollectedAll, completionMandatory }
    }

    const currentData = await calc(currentRange)
    const previousData = await calc(previousRange)

    res.json({
      totalCollected: {
        current: currentData.collectedAll,
        previous: previousData.collectedAll,
        change:
          previousData.collectedAll === 0
            ? null
            : Number((((currentData.collectedAll - previousData.collectedAll) / previousData.collectedAll) * 100).toFixed(1))
      },
      completionRate: {
        current: currentData.completionMandatory,
        previous: previousData.completionMandatory,
        change: Number((currentData.completionMandatory - previousData.completionMandatory).toFixed(2))
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get fee report comparison" })
  }
}

export const exportFeeReportExcel = async (req, res) => {
  try {
    const { month, year } = req.query

    let range
    if (month) range = buildMonthRange(month)
    else if (year) range = buildDateRange({ year })
    if (!range) return res.status(400).json({ message: "month or year is required" })

    const totalCollected = await sumCollectedAll(range)

    const residentCount = await getActiveResidentCount()
    const mandatoryFeeTypes = await getEffectiveMandatoryFeeTypes(range)
    const mandatoryIds = mandatoryFeeTypes.map((f) => f.id)
    const unitSum = mandatoryFeeTypes.reduce((s, f) => s + Number(f.unitPrice || 0), 0)

    const mandatoryExpected = residentCount * unitSum
    const collectedMandatory = await sumCollectedMandatory(range, mandatoryIds)

    const remainingMandatory = Math.max(0, mandatoryExpected - collectedMandatory)
    const completionRate = mandatoryExpected > 0 ? Math.round((collectedMandatory / mandatoryExpected) * 100) : 0

    const wb = new ExcelJS.Workbook()
    const ws1 = wb.addWorksheet("Tổng quan")

    ws1.addRows([
      ["Thời gian", month || year],
      ["Tổng số tiền đã thu", totalCollected],
      ["Tổng số tiền còn phải thu (bắt buộc)", remainingMandatory],
      ["Còn nợ", remainingMandatory],
      ["Tỷ lệ hoàn thành (bắt buộc) (%)", completionRate],
      [],
      ["Số nhân khẩu active", residentCount],
      ["Tổng đơn giá bắt buộc (1 người)", unitSum],
      ["Tổng bắt buộc phải thu", mandatoryExpected],
      ["Tổng bắt buộc đã thu (có tính partial)", collectedMandatory]
    ])

    const ws2 = wb.addWorksheet("Chi tiết theo loại phí")
    ws2.addRow(["Khoản thu", "Số hộ đã đóng", "Tổng số hộ", "Tỷ lệ (%)", "Tổng tiền thu"])

    const activeIds = await getActiveHouseholdIds()
    const totalActiveHouseholds = activeIds.length

    const feeTypes = await prisma.feeType.findMany({
      where: { isActive: true },
      select: { id: true, name: true, isMandatory: true, unitPrice: true }
    })

    const rows = []
    for (const ft of feeTypes) {
      const records = await prisma.feeRecord.findMany({
        where: { feeTypeId: ft.id, householdId: { in: activeIds }, createdAt: range, status: { in: [1, 2] } },
        select: { amount: true, householdId: true }
      })

      const paidHouseholdIds = new Set()
      let totalCollectedFT = 0

      records.forEach((r) => {
        totalCollectedFT += Number(r.amount || 0)
        paidHouseholdIds.add(r.householdId)
      })

      const paidCount = paidHouseholdIds.size

      let completionRateFT = 0
      if (ft.isMandatory && Number(ft.unitPrice || 0) > 0) {
        const expected = residentCount * Number(ft.unitPrice || 0)
        completionRateFT = expected > 0 ? Math.round((totalCollectedFT / expected) * 100) : 0
        completionRateFT = Math.min(100, Math.max(0, completionRateFT))
      } else {
        completionRateFT = totalActiveHouseholds > 0 ? Math.round((paidCount / totalActiveHouseholds) * 100) : 0
      }

      rows.push({
        name: ft.name,
        paidHouseholds: paidCount,
        totalHouseholds: totalActiveHouseholds,
        completionRate: completionRateFT,
        totalCollected: totalCollectedFT
      })
    }

    rows.sort((a, b) => b.totalCollected - a.totalCollected)

    const top6 = rows.slice(0, 6)
    const others = rows.slice(6)

    if (others.length > 0) {
      let otherTotalCollected = 0
      let otherPaid = 0

      others.forEach((i) => {
        otherTotalCollected += Number(i.totalCollected || 0)
        otherPaid += Number(i.paidHouseholds || 0)
      })

      top6.push({
        name: "Các loại phí khác",
        paidHouseholds: otherPaid,
        totalHouseholds: totalActiveHouseholds,
        completionRate: totalActiveHouseholds > 0 ? Math.round((otherPaid / totalActiveHouseholds) * 100) : 0,
        totalCollected: otherTotalCollected
      })
    }

    top6.sort((a, b) => {
      const aOther = a.name === "Các loại phí khác"
      const bOther = b.name === "Các loại phí khác"
      if (aOther !== bOther) return aOther ? 1 : -1
      return b.totalCollected - a.totalCollected
    })

    top6.forEach((f) => {
      ws2.addRow([f.name, f.paidHouseholds, f.totalHouseholds, f.completionRate, f.totalCollected])
    })

    const timeLabel = month || year || "all"
    res.setHeader("Content-Disposition", `attachment; filename=bao-cao-tai-chinh-${timeLabel}.xlsx`)
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    await wb.xlsx.write(res)
    res.end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Export failed" })
  }
}
