import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/* =====================================================
 * Helper
 * ===================================================== */
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}

function splitAmount(total, parts) {
  let remain = total
  const res = []

  for (let i = 0; i < parts - 1; i++) {
    const v = Math.floor(remain * rand(20, 40) / 100)
    res.push(v)
    remain -= v
  }

  res.push(remain)
  return res
}

/**
 * Phân bổ thời gian theo thực tế:
 * - đầu kỳ: 45%
 * - giữa kỳ: 35%
 * - cuối kỳ: 20%
 */
function randomDateByPhase(start, end) {
  const total = end.getTime() - start.getTime()
  const p = Math.random()

  let s, e
  if (p < 0.45) {
    s = start.getTime()
    e = start.getTime() + total * 0.4
  } else if (p < 0.8) {
    s = start.getTime() + total * 0.4
    e = start.getTime() + total * 0.75
  } else {
    s = start.getTime() + total * 0.75
    e = end.getTime()
  }

  return new Date(s + Math.random() * (e - s))
}

const START_2023 = new Date("2023-01-01T00:00:00")
const END_2023   = new Date("2023-12-31T23:59:59")

/* =====================================================
 * MAIN
 * ===================================================== */
async function main() {
  console.log("🚀 Seed FeeRecord 2023 – FINAL FULL")

  /* ===== RESET ===== */
  await prisma.feeRecord.deleteMany().catch(() => {})

  /* ===== LOAD DATA ===== */
  const feeTypes = await prisma.feeType.findMany({
    where: {
      fromDate: { lte: END_2023 },
      toDate: { gte: START_2023 }
    }
  })

  const households = await prisma.household.findMany({
    where: { status: 1 },
    include: {
      residents: true
    }
  })

  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ["HEAD", "DEPUTY", "ACCOUNTANT"] } }
  })

  const householdUsers = await prisma.user.findMany({
    where: { role: "HOUSEHOLD", isActive: true }
  })

  if (!feeTypes.length || !households.length) {
    throw new Error("❌ Missing FeeType or Household")
  }

  let totalRecords = 0

  /* =====================================================
   * LOOP FEE TYPES
   * ===================================================== */
  for (const fee of feeTypes) {

    /* ======================= BẮT BUỘC ======================= */
    if (fee.isMandatory) {
      for (const h of households) {

        const memberCount = h.residents.filter(r => [0, 1].includes(r.status)).length
        if (memberCount === 0) continue

        const expected = fee.unitPrice * memberCount
        const r = rand(1, 100)

        // ~15% chưa đóng
        if (r <= 15) continue

        /* ===== ONLINE – đóng đủ sớm (~40%) ===== */
        if (r <= 55) {
          const user = householdUsers.find(u => u.householdId === h.id)
          if (!user) continue

          await prisma.feeRecord.create({
            data: {
              householdId: h.id,
              feeTypeId: fee.id,
              amount: expected,
              status: 2,
              method: "ONLINE",
              managerId: user.id,
              createdAt: randomDateByPhase(fee.fromDate, fee.toDate)
            }
          })

          totalRecords++
          continue
        }

        /* ===== OFFLINE ===== */
        // ~25% đóng đủ, ~20% đóng 1 phần
        if (r <= 80) {
          // Đóng đủ – 1 đến 2 lần
          const parts = rand(1, 2)
          const chunks = splitAmount(expected, parts)

          let lastDate = randomDateByPhase(
            new Date(fee.fromDate.getTime() + 7 * 86400000),
            fee.toDate
          )

          for (const amt of chunks) {
            lastDate = randomDateByPhase(lastDate, fee.toDate)

            await prisma.feeRecord.create({
              data: {
                householdId: h.id,
                feeTypeId: fee.id,
                amount: amt,
                status: 2,
                method: "OFFLINE",
                managerId: pick(staffUsers).id,
                createdAt: lastDate
              }
            })

            totalRecords++
          }
        } else {
          // Đóng một phần
          const amt = Math.floor(expected * rand(30, 70) / 100)

          await prisma.feeRecord.create({
            data: {
              householdId: h.id,
              feeTypeId: fee.id,
              amount: amt,
              status: 1,
              method: "OFFLINE",
              managerId: pick(staffUsers).id,
              createdAt: randomDateByPhase(
                new Date(fee.fromDate.getTime() + 10 * 86400000),
                fee.toDate
              )
            }
          })

          totalRecords++
        }
      }
      continue
    }

    /* ======================= ĐÓNG GÓP ======================= */
    for (const h of households) {
      const r = rand(1, 100)

      // ~55% không đóng
      if (r <= 55) continue

      const isOnline = rand(1, 100) <= 70
      const amount = rand(20000, 200000)

      let managerId
      let method

      if (isOnline) {
        const user = householdUsers.find(u => u.householdId === h.id)
        if (!user) continue
        managerId = user.id
        method = "ONLINE"
      } else {
        managerId = pick(staffUsers).id
        method = "OFFLINE"
      }

      await prisma.feeRecord.create({
        data: {
          householdId: h.id,
          feeTypeId: fee.id,
          amount,
          status: 2,
          method,
          managerId,
          createdAt: randomDateByPhase(fee.fromDate, fee.toDate)
        }
      })

      totalRecords++
    }
  }

  console.log("✅ Seed FeeRecord 2023 hoàn tất")
  console.log("📄 Tổng số bản ghi:", totalRecords)
}

main()
  .catch(err => console.error("❌ Seed error:", err))
  .finally(async () => prisma.$disconnect())
