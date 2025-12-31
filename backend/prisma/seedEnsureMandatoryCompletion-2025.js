import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

const START = new Date("2025-01-01")
const END   = new Date("2025-12-31")

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function main() {
  console.log("🚀 ENSURE Mandatory Completion 2025")

  const mandatoryFees = await prisma.feeType.findMany({
    where: {
      isMandatory: true,
      fromDate: { lte: END },
      toDate: { gte: START }
    }
  })

  const staff = await prisma.user.findMany({
    where: { role: { in: ["HEAD", "DEPUTY", "ACCOUNTANT"] } }
  })

  const households = await prisma.household.findMany({
    where: { status: 1 },
    include: {
      residents: true,
      feeRecords: {
        where: {
          status: 2,
          feeTypeId: { in: mandatoryFees.map(f => f.id) }
        }
      }
    }
  })

  // chọn 70% hộ để hoàn thành
  const target = Math.floor(households.length * 0.7)
  const selected = households.sort(() => Math.random() - 0.5).slice(0, target)

  let created = 0

  for (const h of selected) {
    const memberCount = h.residents.filter(r => [0, 1].includes(r.status)).length
    if (memberCount === 0) continue

    const paid = new Set(h.feeRecords.map(r => r.feeTypeId))

    for (const fee of mandatoryFees) {
      if (paid.has(fee.id)) continue

      await prisma.feeRecord.create({
        data: {
          householdId: h.id,
          feeTypeId: fee.id,
          amount: fee.unitPrice * memberCount,
          status: 2,
          method: "OFFLINE",
          managerId: pick(staff).id,
          createdAt: randomDate(fee.fromDate, fee.toDate)
        }
      })

      created++
    }
  }

  console.log("✅ ENSURE done")
  console.log("📄 Record bổ sung:", created)
}

main().finally(() => prisma.$disconnect())
