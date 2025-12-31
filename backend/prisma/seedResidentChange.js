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
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomDateAfter(start, minDays, end) {
  const min = new Date(start.getTime() + minDays * 86400000)
  return randomDate(min, end)
}

function approvalStatus() {
  const r = rand(1, 100)
  if (r <= 75) return 1   // approved
  if (r <= 90) return 0   // pending
  return 2                // rejected
}

const START_DATE = new Date("2023-01-01T00:00:00")
const END_DATE   = new Date("2025-12-31T23:59:59")

/* =====================================================
 * MAIN
 * ===================================================== */
async function main() {
  console.log("🚀 Start FINAL seed ResidentChange")

  await prisma.residentChange.deleteMany().catch(() => {})

  const residents = await prisma.resident.findMany({
    include: { household: true }
  })

  const households = await prisma.household.findMany({
    include: { residents: true }
  })

  const managers = await prisma.user.findMany({
    where: { role: { in: ["HEAD", "DEPUTY", "ACCOUNTANT"] } }
  })

  if (!managers.length) {
    throw new Error("❌ No manager user found")
  }

  const changedResidentIds = new Set()
  let changeCount = 0

  /* =====================================================
   * 0️⃣ BIRTH (khai sinh)
   * ===================================================== */
  const birthTargets = residents.filter(r => {
    const age = new Date().getFullYear() - new Date(r.dob).getFullYear()
    return age <= 3 && rand(1, 100) <= 40
  })

  for (const r of birthTargets) {
    if (changedResidentIds.has(r.id)) continue

    await prisma.residentChange.create({
      data: {
        residentId: r.id,
        changeType: 0,
        fromDate: r.createdAt,
        reason: "Khai sinh",
        approvalStatus: 1,
        managerId: pick(managers).id
      }
    })

    changedResidentIds.add(r.id)
    changeCount++
  }

  /* =====================================================
   * 1️⃣ TEMP RESIDENCE (tạm trú)
   * ===================================================== */
  for (const r of residents) {
    if (changedResidentIds.has(r.id)) continue
    if (r.status !== 0 || rand(1, 100) > 15) continue

    const fromDate = randomDate(r.createdAt, END_DATE)

    await prisma.residentChange.create({
      data: {
        residentId: r.id,
        changeType: 1,
        fromAddress: r.household?.address,
        toAddress: r.household?.address,
        fromDate,
        toDate: randomDateAfter(fromDate, 30, END_DATE),
        reason: "Đăng ký tạm trú",
        approvalStatus: approvalStatus(),
        managerId: pick(managers).id
      }
    })

    await prisma.resident.update({
      where: { id: r.id },
      data: { status: 1 }
    })

    changedResidentIds.add(r.id)
    changeCount++
  }

  /* =====================================================
   * 2️⃣ TEMP ABSENCE (tạm vắng)
   * ===================================================== */
  for (const r of residents) {
    if (changedResidentIds.has(r.id)) continue
    if (r.status !== 0 || rand(1, 100) > 12) continue

    const fromDate = randomDate(r.createdAt, END_DATE)

    await prisma.residentChange.create({
      data: {
        residentId: r.id,
        changeType: 2,
        fromAddress: r.household?.address,
        toAddress: "Địa phương khác",
        fromDate,
        toDate: randomDateAfter(fromDate, 30, END_DATE),
        reason: "Đi làm ăn xa",
        approvalStatus: approvalStatus(),
        managerId: pick(managers).id
      }
    })

    await prisma.resident.update({
      where: { id: r.id },
      data: { status: 2 }
    })

    changedResidentIds.add(r.id)
    changeCount++
  }

  /* =====================================================
   * 3️⃣ MOVE IN (chuyển đến)
   * ===================================================== */
  for (const r of residents) {
    if (changedResidentIds.has(r.id)) continue
    if (rand(1, 100) > 10) continue

    const fromDate = randomDate(START_DATE, r.createdAt)

    await prisma.residentChange.create({
      data: {
        residentId: r.id,
        changeType: 3,
        fromAddress: "Địa phương khác",
        toAddress: r.household?.address,
        fromDate,
        reason: "Chuyển đến sinh sống",
        approvalStatus: 1,
        managerId: pick(managers).id
      }
    })

    changedResidentIds.add(r.id)
    changeCount++
  }

  /* =====================================================
   * 4️⃣ MOVE OUT (chuyển đi)
   * ===================================================== */
  for (const r of residents) {
    if (changedResidentIds.has(r.id)) continue
    if (rand(1, 100) > 5) continue

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

    changedResidentIds.add(r.id)
    changeCount++
  }

  /* =====================================================
   * 5️⃣ SPLIT HOUSEHOLD (tách hộ)
   * ===================================================== */
  for (const h of households) {
    if (rand(1, 100) > 10) continue

    const candidates = h.residents.filter(
      r => r.status === 0 && r.relationToOwner === "Con"
    )

    if (!candidates.length) continue

    const r = pick(candidates)
    if (changedResidentIds.has(r.id)) continue

    await prisma.residentChange.create({
      data: {
        residentId: r.id,
        changeType: 5,
        fromAddress: h.address,
        toAddress: "Hộ mới",
        fromDate: randomDate(r.createdAt, END_DATE),
        reason: "Tách hộ khẩu",
        approvalStatus: 1,
        managerId: pick(managers).id
      }
    })

    changedResidentIds.add(r.id)
    changeCount++
  }

  /* =====================================================
   * 6️⃣ CHANGE HOUSEHOLD HEAD (đổi chủ hộ)
   * ===================================================== */
  for (const h of households) {
    if (rand(1, 100) > 10) continue

    const candidates = h.residents.filter(r => r.status === 0)
    if (candidates.length < 2) continue

    const newOwner = pick(candidates)
    if (changedResidentIds.has(newOwner.id)) continue

    await prisma.residentChange.create({
      data: {
        residentId: newOwner.id,
        changeType: 6,
        fromAddress: h.address,
        toAddress: h.address,
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

    changedResidentIds.add(newOwner.id)
    changeCount++
  }

  /* =====================================================
   * 7️⃣ DEATH (qua đời)
   * ===================================================== */
  for (const r of residents) {
    if (changedResidentIds.has(r.id)) continue

    const age = new Date().getFullYear() - new Date(r.dob).getFullYear()
    if (age < 65 || rand(1, 100) > 5) continue

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

    changedResidentIds.add(r.id)
    changeCount++
  }

  console.log("✅ Seed ResidentChange FINAL hoàn tất")
  console.log("📄 Tổng số thủ tục:", changeCount)
}

main()
  .catch(err => console.error("❌ Seed error:", err))
  .finally(async () => prisma.$disconnect())
