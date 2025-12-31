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
    const v = Math.floor(remain * rand(15, 35) / 100)
    res.push(v)
    remain -= v
  }

  res.push(remain)
  return res
}

/**
 * Phân bổ thời gian theo thực tế năm 2024:
 * - đầu kỳ: 40%
 * - giữa kỳ: 40%
 * - cuối kỳ: 20%
 */
function randomDateByPhase2024(start, end) {
  const total = end.getTime() - start.getTime()
  const p = Math.random()

  let s, e
  if (p < 0.4) {
    s = start.getTime()
    e = start.getTime() + total * 0.4
  } else if (p < 0.8) {
    s = start.getTime() + total * 0.4
    e = start.getTime() + total * 0.8
  } else {
    s = start.getTime() + total * 0.8
    e = end.getTime()
  }

  return new Date(s + Math.random() * (e - s))
}

const START_2024 = new Date("2024-01-01T00:00:00")
const END_2024   = new Date("2024-12-31T23:59:59")

/* =====================================================
 * MAIN
 * ===================================================== */
async function main() {
  console.log("🚀 Seed FeeRecord 2024 – APPEND ONLY")

  /**
   * =====================================================
   * IMPORTANT POLICY
   * -----------------------------------------------------
   * - 2023 là năm gốc → ĐƯỢC reset
   * - TỪ 2024 TRỞ ĐI → TUYỆT ĐỐI KHÔNG RESET
   * - File này CHỈ append dữ liệu FeeRecord cho 2024
   * =====================================================
   */

  /* ================= LOAD DATA ================= */
  const feeTypes = await prisma.feeType.findMany({
    where: {
      fromDate: { lte: END_2024 },
      toDate: { gte: START_2024 }
    }
  })

  const households = await prisma.household.findMany({
    where: { status: 1 },
    include: { residents: true }
  })

  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ["HEAD", "DEPUTY", "ACCOUNTANT"] } }
  })

  const householdUsers = await prisma.user.findMany({
    where: {
      role: "HOUSEHOLD",
      isActive: true,
      householdId: { not: null } // FIX: đảm bảo match household
    }
  })

  if (!feeTypes.length) {
    throw new Error("❌ No FeeType found for year 2024")
  }
  if (!households.length) {
    throw new Error("❌ No active households found")
  }
  if (!staffUsers.length) {
    throw new Error("❌ Missing staff users (HEAD / DEPUTY / ACCOUNTANT)")
  }

  let totalRecords = 0

  /* =====================================================
   * LOOP FEE TYPES
   * ===================================================== */
  for (const fee of feeTypes) {

    /* ======================= BẮT BUỘC ======================= */
    if (fee.isMandatory) {
      for (const h of households) {

        // FIX LOGIC: tạm vắng vẫn phải đóng, chỉ loại chuyển đi & qua đời
        const memberCount = h.residents.filter(
          r => ![3, 4].includes(r.status)
        ).length

        if (memberCount === 0) continue

        const expected = fee.unitPrice * memberCount
        const r = rand(1, 100)

        // ~18% chưa đóng
        if (r <= 18) continue

        /* ===== ONLINE – đóng đủ (~35%) ===== */
        if (r <= 53) {
          const user = householdUsers.find(u => u.householdId === h.id)
          if (!user) continue

          await prisma.feeRecord.create({
            data: {
              householdId: h.id,
              feeTypeId: fee.id,
              amount: expected,
              status: 2,
              method: "ONLINE",
              managerId: user.id, // hệ thống ghi nhận
              createdAt: randomDateByPhase2024(fee.fromDate, fee.toDate)
            }
          })

          totalRecords++
          continue
        }

        /* ===== OFFLINE ===== */
        if (r <= 83) {
          // Đóng đủ – 1 đến 3 lần
          const parts = rand(1, 3)
          const chunks = splitAmount(expected, parts)

          let lastDate = randomDateByPhase2024(
            new Date(fee.fromDate.getTime() + rand(10, 18) * 86400000),
            fee.toDate
          )

          for (const amt of chunks) {
            lastDate = randomDateByPhase2024(lastDate, fee.toDate)

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
          const amt = Math.floor(expected * rand(25, 65) / 100)

          await prisma.feeRecord.create({
            data: {
              householdId: h.id,
              feeTypeId: fee.id,
              amount: amt,
              status: 1,
              method: "OFFLINE",
              managerId: pick(staffUsers).id,
              createdAt: randomDateByPhase2024(fee.fromDate, fee.toDate)
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

      // ~50% không tham gia
      if (r <= 50) continue

      const isOnline = rand(1, 100) <= 75
      const amount = rand(30000, 300000)

      let managerId, method

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
          createdAt: randomDateByPhase2024(fee.fromDate, fee.toDate)
        }
      })

      totalRecords++
    }
  }

  console.log("✅ Seed FeeRecord 2024 hoàn tất")
  console.log("📄 Tổng số bản ghi tạo thêm:", totalRecords)
}

main()
  .catch(err => console.error("❌ Seed error:", err))
  .finally(async () => prisma.$disconnect())
