import prisma from "../../../prisma/prismaClient.js"

// GET /api/dashboard
export const getDashboard = async (req, res) => {
  try {
    const YEAR_CAP = 2025
    let now = new Date()
    if (now.getFullYear() > YEAR_CAP) now = new Date(YEAR_CAP, 11, 31, 23, 59, 59)

    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1


    const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
    const startOfNextMonth = new Date(currentYear, currentMonth, 1)

    const startOfPrevMonth = new Date(currentYear, currentMonth - 2, 1)
    const startOfCurrentMonth = startOfMonth

    // =========================
    // 1. Tổng hộ gia đình (đang hoạt động)
    // =========================
    const totalHouseholds = await prisma.household.count({
      where: { status: 1 }
    })

    // =========================
    // 2. Tổng nhân khẩu
    // (trừ đã chuyển đi + đã qua đời)
    // =========================
    const totalResidents = await prisma.resident.count({
      where: {
        status: { notIn: [3, 4] }
      }
    })

    // =========================
    // 3. Hồ sơ chờ duyệt
    // =========================
    const pendingProfiles = await prisma.residentChange.count({
      where: { approvalStatus: 0 }
    })

    // =========================
    // 4. Thống kê thu phí theo năm
    // =========================
    const feeRows = await prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM fr."createdAt")::int AS month,
        SUM(CASE WHEN ft."isMandatory" = true THEN fr."amount" ELSE 0 END)::float AS mandatory,
        SUM(CASE WHEN ft."isMandatory" = false THEN fr."amount" ELSE 0 END)::float AS contribution
      FROM "FeeRecord" fr
      JOIN "FeeType" ft ON ft."id" = fr."feeTypeId"
      WHERE fr."status" IN (1, 2)
        AND EXTRACT(YEAR FROM fr."createdAt")::int = ${currentYear}
      GROUP BY month
      ORDER BY month
    `

    const feeByMonth = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const row = feeRows.find(r => Number(r.month) === m)
      return {
        month: m,
        mandatoryTotal: row ? Number(row.mandatory) : 0,
        contributionTotal: row ? Number(row.contribution) : 0
      }
    })

    // =========================
    // 5. Tỷ lệ đóng phí (HOÀN THÀNH THEO NĂM – CỘNG DỒN TIỀN)
    // =========================

    const startOfYear = new Date(currentYear, 0, 1)
    const startOfNextYear = new Date(currentYear + 1, 0, 1)

    // lấy toàn bộ phí bắt buộc trong năm
    const mandatoryFees = await prisma.feeType.findMany({
      where: {
        isMandatory: true,
        fromDate: { lte: startOfNextYear },
        toDate: { gte: startOfYear }
      }
    })

    const mandatoryFeeIds = mandatoryFees.map(f => f.id)

    // lấy toàn bộ record phí bắt buộc trong năm (kể cả đóng 1 phần)
    const records = await prisma.feeRecord.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: startOfNextYear
        },
        feeTypeId: { in: mandatoryFeeIds },
        household: { status: 1 }
      },
      include: {
        feeType: true,
        household: {
          include: {
            residents: {
              where: { status: { in: [0, 1] } }
            }
          }
        }
      }
    })

    // map householdId -> feeTypeId -> { paid, expected }
    const map = new Map()

    for (const r of records) {
      const memberCount = r.household.residents.length
      const expected = r.feeType.unitPrice * memberCount
      const key = `${r.householdId}-${r.feeTypeId}`

      if (!map.has(key)) {
        map.set(key, {
          householdId: r.householdId,
          feeTypeId: r.feeTypeId,
          expected,
          paid: 0
        })
      }

      map.get(key).paid += Number(r.amount || 0)
    }

    // householdId -> Set<feeTypeId đã hoàn thành>
    const completedByHousehold = new Map()

    for (const v of map.values()) {
      if (v.paid >= v.expected) {
        if (!completedByHousehold.has(v.householdId)) {
          completedByHousehold.set(v.householdId, new Set())
        }
        completedByHousehold.get(v.householdId).add(v.feeTypeId)
      }
    }

    // hộ hoàn thành = đủ TẤT CẢ feeType bắt buộc
    const paidHouseholds = [...completedByHousehold.entries()]
      .filter(([_, set]) => set.size === mandatoryFees.length)
      .map(([householdId]) => householdId)

    const paidCount = paidHouseholds.length

    const paymentRate =
      totalHouseholds === 0
        ? 0
        : Math.round((paidCount / totalHouseholds) * 100)

    const unpaidHouseholds = Math.max(totalHouseholds - paidCount, 0)

    // tạm thời giữ 0 cho so sánh tháng
    const paymentRateChange = 0
    const unpaidHouseholdsChange = 0



    // =========================
    // 6. Thống kê độ tuổi
    // (trừ moved_out + deceased)
    // =========================
    const residentsForAge = await prisma.resident.findMany({
      where: {
        status: { notIn: [3, 4] }
      },
      select: { dob: true }
    })

    const ageGroup = {
      children: 0,
      youth: 0,
      middle: 0,
      elderly: 0
    }

    residentsForAge.forEach(r => {
      if (!r.dob || !(r.dob instanceof Date) || Number.isNaN(r.dob.getTime())) return

      let age = currentYear - r.dob.getFullYear()
      const m = now.getMonth() - r.dob.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < r.dob.getDate())) age--

      if (age < 15) ageGroup.children++
      else if (age <= 35) ageGroup.youth++
      else if (age <= 60) ageGroup.middle++
      else ageGroup.elderly++
    })

    const totalAge = residentsForAge.length || 1
    const ageStats = {
      count: ageGroup,
      percent: {
        children: Math.round((ageGroup.children / totalAge) * 100),
        youth: Math.round((ageGroup.youth / totalAge) * 100),
        middle: Math.round((ageGroup.middle / totalAge) * 100),
        elderly: Math.round((ageGroup.elderly / totalAge) * 100)
      }
    }


    // =========================
    // 7. Tình trạng cư trú
    // (CHỈ tính người đang còn trong địa bàn)
    // =========================
    const permanent = await prisma.resident.count({
      where: { status: 0 }
    })

    const temporary = await prisma.resident.count({
      where: { status: 1 }
    })

    const absent = await prisma.resident.count({
      where: { status: 2 }
    })

    // moved_out & deceased KHÔNG đưa vào mẫu số
    const totalResidence =
      permanent + temporary + absent || 1

    const residenceStats = {
      count: {
        permanent,
        temporary,
        absent
      },
      percent: {
        permanent: Math.round((permanent / totalResidence) * 100),
        temporary: Math.round((temporary / totalResidence) * 100),
        absent: Math.round((absent / totalResidence) * 100)
      }
    }



    // =========================
    // 8. Hồ sơ gần đây (chờ duyệt)
    // =========================
    const recentRequests = await prisma.residentChange.findMany({
      where: {
        approvalStatus: 0
      },
      orderBy: [{ fromDate: "desc" }, { id: "desc" }],
      take: 8,
      select: {
        id: true,
        changeType: true,
        extraData: true,
        resident: {
          select: {
            fullname: true,
            residentCCCD: true
          }
        }
      }
    })

    return res.json({
      cards: {
        totalHouseholds,
        totalResidents,
        pendingProfiles
      },
      feeByMonth,
      ageStats,
      residenceStats,
      recentRequests,
      currentMonthPayment: {
        paymentRate,
        paymentRateChange,
        unpaidHouseholds,
        unpaidHouseholdsChange
      }

    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return res.status(500).json({
      message: "Dashboard error",
      error: error.message
    })
  }
}