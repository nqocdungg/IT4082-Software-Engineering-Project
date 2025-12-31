// checkMandatoryCompletion-2025.js
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

const START = new Date("2025-01-01")
const END   = new Date("2025-12-31")

async function main() {
  const mandatoryFees = await prisma.feeType.findMany({
    where: {
      isMandatory: true,
      fromDate: { lte: END },
      toDate: { gte: START }
    },
    select: { id: true, name: true }
  })

  const households = await prisma.household.findMany({
    where: { status: 1 },
    include: {
      feeRecords: {
        where: {
          status: 2,
          feeTypeId: { in: mandatoryFees.map(f => f.id) }
        },
        select: { feeTypeId: true }
      }
    }
  })

  let completed = 0

  for (const h of households) {
    const paid = new Set(h.feeRecords.map(r => r.feeTypeId))
    const missing = mandatoryFees.filter(f => !paid.has(f.id))

    if (missing.length === 0) completed++
    else {
      console.log(
        `Hộ ${h.id} thiếu ${missing.length} khoản bắt buộc`,
        missing.map(m => m.name)
      )
    }
  }

  console.log("Tổng hộ:", households.length)
  console.log("Hoàn thành:", completed)
}

main().finally(() => prisma.$disconnect())
