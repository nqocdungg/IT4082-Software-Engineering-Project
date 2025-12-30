import prisma from "../../../prisma/prismaClient.js"
import ExcelJS from "exceljs"

function buildDateRange({ year, fromDate, toDate }) {
  if (fromDate && toDate) {
    return {
      gte: new Date(fromDate),
      lte: new Date(toDate),
    }
  }

  if (year) {
    return {
      gte: new Date(`${year}-01-01`),
      lte: new Date(`${year}-12-31`),
    }
  }

  return undefined
}

function buildMonthRange(month) {
  if (!month) return undefined

  const start = new Date(`${month}-01`)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)

  return {
    gte: start,
    lt: end,
  }
}


/**
 * =========================
 * 1. OVERVIEW
 * =========================
 * GET /api/staff/fee-report/overview
 */
export const getFeeReportOverview = async (req, res) => {
  try {
    const { month, year, fromDate, toDate } = req.query

    // 1. Xây dựng khoảng thời gian (ưu tiên month)
    let dateRange
    if (month) {
      dateRange = buildMonthRange(month)
    } else {
      dateRange = buildDateRange({ year, fromDate, toDate })
    }
    if (!dateRange) {
      return res.status(400).json({
        message: "month or year is required",
      })
    }


    const where = {}
    if (dateRange) where.createdAt = dateRange

    // 2. Lấy fee records
    const records = await prisma.feeRecord.findMany({
      where,
      select: {
        amount: true,
        status: true,
        feeType: { select: { isMandatory: true } },
      },
    })

    let totalRequired = 0                 // chỉ bắt buộc
    let totalCollected = 0                // tất cả đã thu
    let collectedMandatory = 0            // đã thu của bắt buộc (để tính completion/debt)

    records.forEach((r) => {
      // Tổng đã thu: tính cả bắt buộc + đóng góp
      if (r.status === 2) totalCollected += r.amount

      // Phải thu / nợ / completion: chỉ bắt buộc
      if (r.feeType.isMandatory) {
        totalRequired += r.amount
        if (r.status === 2) collectedMandatory += r.amount
      }
    })

    const totalDebt = totalRequired - collectedMandatory
    const completionRate =
      totalRequired > 0
        ? Number(((collectedMandatory / totalRequired) * 100).toFixed(2))
        : 0

    res.json({
      totalRequired,
      totalCollected,     // ✅ tất cả đã thu
      totalDebt,
      completionRate,     // ✅ tỷ lệ hoàn thành phí bắt buộc
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get fee report overview" })
  }
}


/**
 * =========================
 * 2. MONTHLY STATISTICS
 * =========================
 * GET /api/staff/fee-report/monthly
 */
export const getMonthlyFeeReport = async (req, res) => {
  try {
    const { year } = req.query
    if (!year) {
      return res.status(400).json({ message: "year is required" })
    }

    const start = new Date(`${year}-01-01`)
    const end = new Date(`${year}-12-31`)

    const records = await prisma.feeRecord.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: 2,
      },
      include: {
        feeType: {
          select: { isMandatory: true },
        },
      },
    })

    const result = Array.from({ length: 12 }, (_, i) => ({
      month: `T${i + 1}`,
      fixedFee: 0,
      voluntaryFee: 0,
    }))

    records.forEach((r) => {
      const m = new Date(r.createdAt).getMonth()
      if (r.feeType.isMandatory) {
        result[m].fixedFee += r.amount
      } else {
        result[m].voluntaryFee += r.amount
      }
    })

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get monthly fee report" })
  }
}

/**
 * =========================
 * 3. BY FEE TYPE
 * =========================
 * GET /api/staff/fee-report/by-fee-type
 */
export const getFeeReportByFeeType = async (req, res) => {
  try {
    const { month } = req.query
    if (!month) {
      return res.status(400).json({ message: "month is required (YYYY-MM)" })
    }

    const dateRange = buildMonthRange(month)

    const feeTypes = await prisma.feeType.findMany({
      where: { isActive: true },
    })

    const rows = []

    for (const ft of feeTypes) {
      const records = await prisma.feeRecord.findMany({
        where: {
          feeTypeId: ft.id,
          createdAt: dateRange,
        },
        select: {
          amount: true,
          status: true,
          householdId: true,
        },
      })

      if (records.length === 0) continue

      const householdsWithFee = new Set(
        records.map((r) => r.householdId)
      ).size

      let totalCollected = 0
      const paidHouseholdSet = new Set()

      records.forEach((r) => {
        if (r.status === 2) {
          totalCollected += r.amount
          paidHouseholdSet.add(r.householdId)
        }
      })

      rows.push({
        name: ft.name,
        totalHouseholds: householdsWithFee,
        paidHouseholds: paidHouseholdSet.size,
        totalCollected,
        completionRate:
          householdsWithFee > 0
            ? Math.round(
                (paidHouseholdSet.size / householdsWithFee) * 100
              )
            : 0,
      })
    }

    // ===== SORT & MERGE =====
    rows.sort((a, b) => b.totalCollected - a.totalCollected)

    const top6 = rows.slice(0, 6)
    const others = rows.slice(6)

    if (others.length > 0) {
      const other = others.reduce(
        (acc, cur) => {
          acc.totalCollected += cur.totalCollected
          acc.totalHouseholds += cur.totalHouseholds
          acc.paidHouseholds += cur.paidHouseholds
          return acc
        },
        {
          name: "Các loại phí khác",
          totalCollected: 0,
          totalHouseholds: 0,
          paidHouseholds: 0,
        }
      )

      other.completionRate =
        other.totalHouseholds > 0
          ? Math.round(
              (other.paidHouseholds / other.totalHouseholds) * 100
            )
          : 0

      top6.push(other)
    }

    res.json(top6 || [])

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get fee report by fee type" })
  }
}

/**
 * =========================
 * 4. HOUSEHOLD PAYMENT STATUS
 * =========================
 * GET /api/fee-report/household-status
 *
 * Nghiệp vụ:
 * - Một hộ được coi là HOÀN THÀNH khi:
 *   + Đã đóng ĐỦ TẤT CẢ các khoản PHÍ BẮT BUỘC đang active trong tháng
 */
export const getHouseholdPaymentStatus = async (req, res) => {
  try {
    const { month } = req.query
    if (!month) {
      return res.status(400).json({ message: "month is required (YYYY-MM)" })
    }

    const start = new Date(`${month}-01`)
    const end = new Date(start)
    end.setMonth(end.getMonth() + 1)

    // 1. Lấy danh sách phí bắt buộc
    const mandatoryFees = await prisma.feeType.findMany({
      where: {
        isMandatory: true,
        isActive: true,
      },
      select: { id: true },
    })

    const mandatoryFeeIds = mandatoryFees.map((f) => f.id)

    // 2. Lấy danh sách hộ đang hoạt động
    const households = await prisma.household.findMany({
      where: { status: 1 },
      select: { id: true },
    })

    let completed = 0
    let incomplete = 0
    let notPaid = 0

    // 3. Kiểm tra từng hộ
    for (const h of households) {
      const records = await prisma.feeRecord.findMany({
        where: {
          householdId: h.id,
          feeTypeId: { in: mandatoryFeeIds },
          createdAt: { gte: start, lt: end },
        },
        select: {
          feeTypeId: true,
          status: true,
        },
      })

      // Chưa đóng khoản bắt buộc nào
      if (records.length === 0) {
        notPaid++
        continue
      }

      const paidMandatoryFeeIds = new Set(
        records.filter((r) => r.status === 2).map((r) => r.feeTypeId)
      )

      // Đóng đủ tất cả phí bắt buộc
      if (paidMandatoryFeeIds.size === mandatoryFeeIds.length) {
        completed++
      } else {
        incomplete++
      }
    }

    res.json({
      totalHouseholds: households.length,
      completed,
      incomplete,
      notPaid,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get household payment status" })
  }
}


/* =========================
    5. COMPARISON
   ========================= */
// GET /api/staff/fee-report/comparison
export const getFeeReportComparison = async (req, res) => {
  try {
    const { type, current } = req.query
    if (!type || !current) {
      return res.status(400).json({ message: "type and current are required" })
    }

    let currentRange, previousRange

    if (type === "month") {
      const cur = new Date(`${current}-01`)
      const prev = new Date(cur)
      prev.setMonth(prev.getMonth() - 1)

      currentRange = {
        gte: cur,
        lt: new Date(cur.getFullYear(), cur.getMonth() + 1, 1),
      }
      previousRange = {
        gte: prev,
        lt: new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
      }
    } else {
      currentRange = buildDateRange({ year: current })
      previousRange = buildDateRange({ year: Number(current) - 1 })
    }

    const calc = async (range) => {
      const records = await prisma.feeRecord.findMany({
        where: { createdAt: range },
        include: { feeType: { select: { isMandatory: true } } },
      })

      let totalCollectedAll = 0
      let requiredMandatory = 0
      let collectedMandatory = 0

      records.forEach((r) => {
        if (r.status === 2) totalCollectedAll += r.amount

        if (r.feeType.isMandatory) {
          requiredMandatory += r.amount
          if (r.status === 2) collectedMandatory += r.amount
        }
      })

      return {
        collectedAll: totalCollectedAll,
        completionMandatory:
          requiredMandatory > 0
            ? Math.round((collectedMandatory / requiredMandatory) * 100)
            : 0,
      }
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
            : Number(
                (
                  ((currentData.collectedAll - previousData.collectedAll) /
                    previousData.collectedAll) *
                  100
                ).toFixed(1)
              ),
      },
      completionRate: {
        current: currentData.completionMandatory,
        previous: previousData.completionMandatory,
        change: currentData.completionMandatory - previousData.completionMandatory,
      },
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to get fee report comparison" })
  }
}

export const exportFeeReportExcel = async (req, res) => {
  try {
    const { month, year } = req.query

    // 1. Build date range
    let dateRange
    if (month) {
      const start = new Date(`${month}-01`)
      const end = new Date(start)
      end.setMonth(end.getMonth() + 1)
      dateRange = { gte: start, lt: end }
    } else if (year) {
      dateRange = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      }
    }
    if (!dateRange) {
      return res.status(400).json({
        message: "month or year is required",
      })
    }


    /* ======================
       2. OVERVIEW
       ====================== */
    const overviewRecords = await prisma.feeRecord.findMany({
      where: { createdAt: dateRange },
      select: {
        amount: true,
        status: true,
        feeType: { select: { isMandatory: true } },
      },
    })

    let totalRequired = 0
    let totalCollected = 0
    let collectedMandatory = 0

    overviewRecords.forEach((r) => {
      if (r.status === 2) totalCollected += r.amount

      if (r.feeType.isMandatory) {
        totalRequired += r.amount
        if (r.status === 2) collectedMandatory += r.amount
      }
    })

    const totalDebt = totalRequired - collectedMandatory
    const completionRate =
      totalRequired > 0 ? Math.round((collectedMandatory / totalRequired) * 100) : 0


    /* ======================
       3. HOUSEHOLD STATUS
       ====================== */
    const mandatoryFees = await prisma.feeType.findMany({
      where: { isMandatory: true, isActive: true },
      select: { id: true },
    })

    const mandatoryIds = mandatoryFees.map((f) => f.id)

    const households = await prisma.household.findMany({
      where: { status: 1 },
      select: { id: true },
    })

    let completed = 0
    let incomplete = 0
    let notPaid = 0

    for (const h of households) {
      const records = await prisma.feeRecord.findMany({
        where: {
          householdId: h.id,
          feeTypeId: { in: mandatoryIds },
          createdAt: dateRange,
        },
        select: { feeTypeId: true, status: true },
      })

      if (records.length === 0) {
        notPaid++
        continue
      }

      const paidSet = new Set(
        records.filter((r) => r.status === 2).map((r) => r.feeTypeId)
      )

      if (paidSet.size === mandatoryIds.length) completed++
      else incomplete++
    }

    /* ======================
       4. FEE TYPE (TOP 6 + OTHER)
       ====================== */
    const feeTypes = await prisma.feeType.findMany({
      where: { isActive: true },
    })

    const feeStats = []

    for (const ft of feeTypes) {
      const records = await prisma.feeRecord.findMany({
        where: { feeTypeId: ft.id, createdAt: dateRange },
        select: { amount: true, status: true, householdId: true },
      })

      if (records.length === 0) continue

      let totalCollected = 0
      const householdSet = new Set()

      records.forEach((r) => {
        if (r.status === 2) {
          totalCollected += r.amount
          householdSet.add(r.householdId)
        }
      })

      feeStats.push({
        name: ft.name,
        households: householdSet.size,
        totalCollected,
      })
    }

    feeStats.sort((a, b) => b.totalCollected - a.totalCollected)

    const top6 = feeStats.slice(0, 6)
    const others = feeStats.slice(6)

    if (others.length > 0) {
      top6.push({
        name: "Khác",
        households: others.reduce((s, i) => s + i.households, 0),
        totalCollected: others.reduce((s, i) => s + i.totalCollected, 0),
      })
    }

    /* ======================
       5. EXCEL
       ====================== */
    const wb = new ExcelJS.Workbook()

    /* Sheet 1: Tổng quan */
    const ws1 = wb.addWorksheet("Tổng quan")

    ws1.addRows([
      ["Thời gian", month || year],
      ["Tổng phải thu", totalRequired],
      ["Tổng đã thu", totalCollected],
      ["Tổng còn nợ", totalDebt],
      ["Tỷ lệ hoàn thành (%)", completionRate],
      [],
      ["Tổng số hộ", households.length],
      ["Hộ hoàn thành", completed],
      ["Hộ chưa hoàn thành", incomplete],
      ["Hộ chưa đóng", notPaid],
    ])

    /* Sheet 2: Chi tiết */
    const ws2 = wb.addWorksheet("Chi tiết theo loại phí")
    ws2.addRow([
      "Khoản thu",
      "Số hộ đã đóng",
      "Tổng tiền thu được",
    ])

    top6.forEach((f) => {
      ws2.addRow([f.name, f.households, f.totalCollected])
    })

    /* Response */
const timeLabel = month || year || "all"

res.setHeader(
  "Content-Disposition",
  `attachment; filename=bao-cao-tai-chinh-${timeLabel}.xlsx`
)

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    await wb.xlsx.write(res)
    res.end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Export failed" })
  }
}