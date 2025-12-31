import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const START_2025 = new Date("2025-01-01T00:00:00")
const END_2025   = new Date("2025-12-31T23:59:59")

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function main() {
  console.log("🚀 Seed Household Mandatory Completion – 2025 (70/20/10)")

  /* ================= LOAD DATA ================= */

  const mandatoryFees = await prisma.feeType.findMany({
    where: {
      isMandatory: true,
      fromDate: { lte: END_2025 },
      toDate: { gte: START_2025 }
    }
  })

  const households = await prisma.household.findMany({
    where: { status: 1 },
    include: {
      residents: true,
      feeRecords: {
        where: {
          feeType: { isMandatory: true },
          status: 2
        }
      }
    }
  })

  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ["HEAD", "DEPUTY", "ACCOUNTANT"] } }
  })

  if (!mandatoryFees.length || !households.length) {
    throw new Error("❌ Missing mandatory fees or households")
  }

  /* ================= SPLIT HOUSEHOLDS ================= */

  const shuffled = households.sort(() => Math.random() - 0.5)

  const total = households.length
  const fullCount = Math.floor(total * 0.7)
  const partialCount = Math.floor(total * 0.2)

  const fullHouseholds = shuffled.slice(0, fullCount)
  const partialHouseholds = shuffled.slice(fullCount, fullCount + partialCount)
  // remaining ~10% => untouched (chưa đóng)

  let created = 0

  /* ================= 1️⃣ HOÀN THÀNH 100% ================= */

  for (const h of fullHouseholds) {
    const memberCount = h.residents.filter(r => [0, 1].includes(r.status)).length
    if (memberCount === 0) continue

    const paidFeeIds = new Set(h.feeRecords.map(r => r.feeTypeId))

    for (const fee of mandatoryFees) {
      if (paidFeeIds.has(fee.id)) continue

      await prisma.feeRecord.create({
        data: {
          householdId: h.id,
          feeTypeId: fee.id,
          amount: fee.unitPrice * memberCount,
          status: 2,
          method: "OFFLINE",
          managerId: pick(staffUsers).id,
          createdAt: randomDate(
            new Date(fee.fromDate.getTime() + 7 * 86400000),
            fee.toDate
          )
        }
      })

      created++
    }
  }

  /* ================= 2️⃣ CHƯA ĐỦ (THIẾU 1–2 KHOẢN) ================= */

  for (const h of partialHouseholds) {
    const memberCount = h.residents.filter(r => [0, 1].includes(r.status)).length
    if (memberCount === 0) continue

    const paidFeeIds = new Set(h.feeRecords.map(r => r.feeTypeId))
    const unpaidFees = mandatoryFees.filter(f => !paidFeeIds.has(f.id))

    if (unpaidFees.length <= 1) continue

    // Chỉ đóng 1 phần (không đủ hết)
    const willPay = unpaidFees.slice(0, rand(1, Math.min(2, unpaidFees.length - 1)))

    for (const fee of willPay) {
      await prisma.feeRecord.create({
        data: {
          householdId: h.id,
          feeTypeId: fee.id,
          amount: fee.unitPrice * memberCount,
          status: 2,
          method: "OFFLINE",
          managerId: pick(staffUsers).id,
          createdAt: randomDate(
            new Date(fee.fromDate.getTime() + 12 * 86400000),
            fee.toDate
          )
        }
      })

      created++
    }
  }

  console.log("✅ Hoàn tất seed completion 2025")
  console.log("🏠 Hoàn thành:", fullHouseholds.length)
  console.log("🟡 Chưa đủ:", partialHouseholds.length)
  console.log("📄 FeeRecord bổ sung:", created)
}

main()
  .catch(err => console.error("❌ Seed error:", err))
  .finally(async () => prisma.$disconnect())
