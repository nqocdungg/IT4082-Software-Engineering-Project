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

function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  )
}

const START_DATE = new Date("2023-01-01T00:00:00")
const END_DATE   = new Date("2025-12-31T23:59:59")

/* =====================================================
 * MAIN
 * ===================================================== */
async function main() {
  console.log("🚀 Start seed ResidentChange")

  /* ===== CLEAR OLD CHANGES ===== */
  await prisma.residentChange.deleteMany().catch(() => {})

  /* ===== LOAD DATA ===== */
  const residents = await prisma.resident.findMany({
    include: { household: true }
  })

  const managers = await prisma.user.findMany({
    where: { role: { in: ["HEAD", "DEPUTY"] } }
  })

  if (managers.length === 0) {
    throw new Error("❌ No manager user (HEAD / DEPUTY) found")
  }

  let changeCount = 0

  /* =====================================================
   * 1️⃣ TEMP RESIDENCE (tạm trú)
   * changeType = 1
   * ===================================================== */
  const tempResidenceTargets = residents
    .filter(r => r.status === 0 && rand(1, 100) <= 15)

  for (const r of tempResidenceTargets) {
    const fromDate = randomDate(r.createdAt, END_DATE)

    await prisma.residentChange.create({
      data: {
        residentId: r.id,
        changeType: 1,
        fromAddress: r.household?.address,
        toAddress: r.household?.address,
        fromDate,
        toDate: randomDate(fromDate, END_DATE),
        reason: "Đăng ký tạm trú",
        approvalStatus: 1,
        managerId: pick(managers).id
      }
    })

    await prisma.resident.update({
      where: { id: r.id },
      data: { status: 1 }
    })

    changeCount++
  }

  /* =====================================================
   * 2️⃣ TEMP ABSENCE (tạm vắng)
   * changeType = 2
   * ===================================================== */
  const tempAbsenceTargets = residents
    .filter(r => r.status === 0 && rand(1, 100) <= 12)

  for (const r of tempAbsenceTargets) {
    const fromDate = randomDate(r.createdAt, END_DATE)

    await prisma.residentChange.create({
      data: {
        residentId: r.id,
        changeType: 2,
        fromAddress: r.household?.address,
        toAddress: "Địa phương khác",
        fromDate,
        toDate: randomDate(fromDate, END_DATE),
        reason: "Đi làm ăn xa",
        approvalStatus: 1,
        managerId: pick(managers).id
      }
    })

    await prisma.resident.update({
      where: { id: r.id },
      data: { status: 2 }
    })

    changeCount++
  }

  /* =====================================================
   * 3️⃣ MOVE OUT (chuyển đi)
   * changeType = 4
   * ===================================================== */
  const moveOutTargets = residents
    .filter(r => rand(1, 100) <= 5)

  for (const r of moveOutTargets) {
    const fromDate = randomDate(r.createdAt, END_DATE)

    await prisma.residentChange.create({
      data: {
        residentId: r.id,
        changeType: 4,
        fromAddress: r.household?.address,
        toAddress: pick(["Quận khác", "Tỉnh khác"]),
        fromDate,
        reason: "Chuyển nơi sinh sống",
        approvalStatus: 1,
        managerId: pick(managers).id
      }
    })

    await prisma.resident.update({
      where: { id: r.id },
      data: { status: 3 }
    })

    changeCount++
  }

  /* =====================================================
   * 4️⃣ DEATH (qua đời)
   * changeType = 7
   * ===================================================== */
  const deceasedTargets = residents
    .filter(r => {
      const age = new Date().getFullYear() - new Date(r.dob).getFullYear()
      return age >= 65 && rand(1, 100) <= 5
    })

  for (const r of deceasedTargets) {
    const fromDate = randomDate(r.createdAt, END_DATE)

    await prisma.residentChange.create({
      data: {
        residentId: r.id,
        changeType: 7,
        fromDate,
        reason: "Qua đời",
        approvalStatus: 1,
        managerId: pick(managers).id
      }
    })

    await prisma.resident.update({
      where: { id: r.id },
      data: { status: 4 }
    })

    changeCount++
  }

  /* =====================================================
   * 5️⃣ CHANGE HOUSEHOLD HEAD (đổi chủ hộ)
   * changeType = 6
   * ===================================================== */
  const households = await prisma.household.findMany({
    include: { residents: true }
  })

  for (const h of households) {
    if (rand(1, 100) > 10) continue

    const candidates = h.residents.filter(r => r.status === 0)
    if (candidates.length < 2) continue

    const newOwner = pick(candidates)

    await prisma.residentChange.create({
      data: {
        residentId: newOwner.id,
        changeType: 6,
        fromDate: randomDate(newOwner.createdAt, END_DATE),
        reason: "Đổi chủ hộ",
        approvalStatus: 1,
        managerId: pick(managers).id
      }
    })

    await prisma.household.update({
      where: { id: h.id },
      data: { ownerId: newOwner.id }
    })

    changeCount++
  }

  console.log("✅ Seed ResidentChange hoàn tất")
  console.log("📄 Tổng số thủ tục:", changeCount)
}

main()
  .catch(err => {
    console.error("❌ Seed error:", err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
