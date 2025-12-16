import prisma from "../../prisma/prismaClient.js"

// GET /api/dashboard
export const getDashboard = async (req, res) => {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
    const startOfNextMonth = new Date(currentYear, currentMonth, 1)

    // 1. tổng hộ gia đình
    const totalHouseholds = await prisma.household.count({
      where: { status: 0 }
    })

    // 2. tổng nhân khẩu (chưa qua đời)
    const deceasedIds = await prisma.residentChange.findMany({
      where: { changeType: 8 },
      select: { residentId: true }
    })

    const totalResidents = await prisma.resident.count({
      where: {
        id: { notIn: deceasedIds.map(r => r.residentId) }
      }
    })

    // 3. hồ sơ cần xử lý
    const pendingProfiles = await prisma.residentChange.count({
      where: { approvalStatus: 0 }
    })

    // 4. thống kê thu phí theo tháng
    const feeRows = await prisma.$queryRaw`
      SELECT
        EXTRACT(MONTH FROM fr."updatedAt")::int AS month,
        SUM(CASE WHEN ft."isMandatory" = true THEN fr."fundAmount" ELSE 0 END)::float AS mandatory,
        SUM(CASE WHEN ft."isMandatory" = false THEN fr."fundAmount" ELSE 0 END)::float AS contribution
      FROM "FeeRecord" fr
      JOIN "FeeType" ft ON ft."id" = fr."feeTypeId"
      WHERE fr."isActive" = true
        AND fr."fundAmount" > 0
        AND EXTRACT(YEAR FROM fr."updatedAt")::int = ${currentYear}
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

    // 5. tỷ lệ đóng phí tháng hiện tại
    const paidHouseholds = await prisma.feeRecord.findMany({
      where: {
        isActive: true,
        status: 2,
        updatedAt: { gte: startOfMonth, lt: startOfNextMonth },
        feeType: { isMandatory: true },
        household: { status: 0 }
      },
      distinct: ["householdId"],
      select: { householdId: true }
    })

    const paidCount = paidHouseholds.length
    const paymentRate =
      totalHouseholds === 0 ? 0 : Math.round((paidCount / totalHouseholds) * 100)

    const unpaidHouseholds = Math.max(totalHouseholds - paidCount, 0)

    // 6. thống kê độ tuổi (chưa qua đời)
    const residents = await prisma.resident.findMany({
      where: {
        id: { notIn: deceasedIds.map(r => r.residentId) }
      },
      select: { dob: true }
    })

    const ageGroup = {
      children: 0,
      youth: 0,
      middle: 0,
      elderly: 0
    }

    residents.forEach(r => {
      let age = currentYear - r.dob.getFullYear()
      const m = now.getMonth() - r.dob.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < r.dob.getDate())) age--

      if (age < 15) ageGroup.children++
      else if (age <= 35) ageGroup.youth++
      else if (age <= 60) ageGroup.middle++
      else ageGroup.elderly++
    })

    const totalAge = residents.length || 1
    const agePercent = {
      children: Math.round((ageGroup.children / totalAge) * 100),
      youth: Math.round((ageGroup.youth / totalAge) * 100),
      middle: Math.round((ageGroup.middle / totalAge) * 100),
      elderly: Math.round((ageGroup.elderly / totalAge) * 100)
    }

    // 7. tình trạng cư trú
    const permanent = await prisma.resident.count({
      where: { householdId: { not: null } }
    })

    const temporary = await prisma.temporaryResidence.count({
      where: { status: 0 }
    })

    const absent = await prisma.residentChange.count({
      where: { changeType: 2 }
    })

    const movedOut = await prisma.residentChange.count({
      where: { changeType: 4 }
    })

    const totalResidence =
      permanent + temporary + absent + movedOut || 1

    const residencePercent = {
      permanent: Math.round((permanent / totalResidence) * 100),
      temporary: Math.round((temporary / totalResidence) * 100),
      absent: Math.round((absent / totalResidence) * 100),
      moved_out: Math.round((movedOut / totalResidence) * 100)
    }

    // 8. hồ sơ cần xử lý gần đây
    const recentRequests = await prisma.residentChange.findMany({
      where: { approvalStatus: 0 },
      orderBy: [{ fromDate: "desc" }, { id: "desc" }],
      take: 8,
      include: {
        resident: { select: { fullname: true, residentCCCD: true } }
      }
    })

    return res.json({
      cards: {
        totalHouseholds,
        totalResidents,
        pendingProfiles
      },
      feeByMonth,
      currentMonthPayment: {
        paymentRate,
        unpaidHouseholds
      },
      agePercent,
      residencePercent,
      recentRequests
    })
  } catch (error) {
    return res.status(500).json({
      message: "Dashboard error",
      error: error.message
    })
  }
}
