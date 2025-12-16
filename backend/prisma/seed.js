import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // =========================
  // CLEAR DATA
  // =========================
  await prisma.temporaryResidence.deleteMany().catch(() => {})
  await prisma.residentChange.deleteMany().catch(() => {})
  await prisma.feeRecord.deleteMany().catch(() => {})
  await prisma.feeType.deleteMany().catch(() => {})

  await prisma.household.updateMany({
    data: { ownerId: null }
  }).catch(() => {})

  await prisma.resident.deleteMany()
  await prisma.household.deleteMany()
  await prisma.user.deleteMany()

  // =========================
  // USERS (GIỮ NGUYÊN)
  // =========================
  const head = await prisma.user.create({
    data: {
      username: "to_truong",
      password: await bcrypt.hash("totruong@123", 8),
      fullname: "Nguyễn Văn A",
      phone: "0912345678",
      role: "HEAD"
    }
  })

  const deputy = await prisma.user.create({
    data: {
      username: "to_pho",
      password: await bcrypt.hash("topho@123", 8),
      fullname: "Nguyễn Thị B",
      phone: "0987654321",
      role: "DEPUTY"
    }
  })

  // =========================
  // HOUSEHOLDS (TDP 7 LA KHÊ)
  // =========================
  const householdAddresses = [
    "Số 12 ngõ 34 TDP 7 phường La Khê quận Hà Đông Hà Nội",
    "Số 18 ngõ 90 TDP 7 phường La Khê quận Hà Đông Hà Nội",
    "Số 25 ngõ 16 TDP 7 phường La Khê quận Hà Đông Hà Nội",
    "Số 41 ngõ 102 TDP 7 phường La Khê quận Hà Đông Hà Nội",
    "Số 56 ngõ 12 TDP 7 phường La Khê quận Hà Đông Hà Nội",
    "Số 73 ngõ 45 TDP 7 phường La Khê quận Hà Đông Hà Nội",
    "Số 88 ngõ 8 TDP 7 phường La Khê quận Hà Đông Hà Nội",
    "Số 101 ngõ 67 TDP 7 phường La Khê quận Hà Đông Hà Nội"
  ]

  const households = []
  for (let addr of householdAddresses) {
    households.push(
      await prisma.household.create({
        data: {
          address: addr,
          registrationDate: new Date(2010 + Math.floor(Math.random() * 10), 1, 1),
          status: 0
        }
      })
    )
  }

  // =========================
  // CREATE RESIDENTS (THƯỜNG TRÚ)
  // =========================
  const relations = ["HEAD", "WIFE", "HUSBAND", "SON", "DAUGHTER", "MOTHER", "FATHER"]

  const residents = []

  for (let i = 0; i < 50; i++) {
    const hh = households[i % households.length]
    const relation = i % 5 === 0 ? "HEAD" : relations[Math.floor(Math.random() * relations.length)]

    const resident = await prisma.resident.create({
      data: {
        residentCCCD: `00120300${1000 + i}`,
        fullname: `Nguyễn Văn ${String.fromCharCode(65 + (i % 26))}`,
        dob: new Date(1960 + Math.floor(Math.random() * 45), Math.floor(Math.random() * 12), 1),
        gender: Math.random() > 0.5 ? "M" : "F",
        relationToOwner: relation,
        householdId: hh.id
      }
    })

    residents.push(resident)

    if (relation === "HEAD") {
      await prisma.household.update({
        where: { id: hh.id },
        data: { ownerId: resident.id }
      })
    }
  }

  // =========================
  // TẠM TRÚ (~15%)
  // =========================
  for (let i = 0; i < 9; i++) {
    const r = await prisma.resident.create({
      data: {
        residentCCCD: `00220300${2000 + i}`,
        fullname: `Trần Thị ${String.fromCharCode(65 + i)}`,
        dob: new Date(1998 + i, 3, 1),
        gender: "F",
        relationToOwner: "TEMP"
      }
    })

    await prisma.temporaryResidence.create({
      data: {
        residentId: r.id,
        address: "Nhà trọ ngõ 34 TDP 7 La Khê Hà Đông",
        fromDate: new Date(2024, 6, 1),
        status: 0
      }
    })
  }

  // =========================
  // BIẾN ĐỘNG: TẠM VẮNG
  // =========================
  for (let i = 0; i < 4; i++) {
    await prisma.residentChange.create({
      data: {
        residentId: residents[i].id,
        changeType: 2,
        fromDate: new Date(2025, 1, 1),
        toDate: new Date(2025, 3, 1),
        reason: "Đi công tác xa",
        approvalStatus: 1,
        managerId: deputy.id
      }
    })
  }

  // =========================
  // BIẾN ĐỘNG: CHUYỂN ĐI
  // =========================
  for (let i = 4; i < 7; i++) {
    await prisma.residentChange.create({
      data: {
        residentId: residents[i].id,
        changeType: 4,
        fromDate: new Date(2024, 10, 1),
        reason: "Chuyển nơi ở khác",
        approvalStatus: 1,
        managerId: head.id
      }
    })
  }

  // =========================
  // BIẾN ĐỘNG: QUA ĐỜI
  // =========================
  await prisma.residentChange.create({
    data: {
      residentId: residents[10].id,
      changeType: 8,
      fromDate: new Date(2023, 8, 12),
      reason: "Qua đời do tuổi cao",
      approvalStatus: 1,
      managerId: head.id
    }
  })

  // =========================
  // BIẾN ĐỘNG: MỚI SINH
  // =========================
  const newborn = await prisma.resident.create({
    data: {
      residentCCCD: null,
      fullname: "Nguyễn Minh An",
      dob: new Date(2025, 2, 10),
      gender: "M",
      relationToOwner: "SON",
      householdId: households[0].id
    }
  })

  await prisma.residentChange.create({
    data: {
      residentId: newborn.id,
      changeType: 0,
      fromDate: new Date(2025, 2, 10),
      approvalStatus: 1,
      managerId: deputy.id
    }
  })

  // =========================
  // FEE TYPES
  // =========================
  const feeTypes = await prisma.feeType.createMany({
    data: [
      {
        name: "Phí vệ sinh môi trường",
        description: "Thu theo hộ",
        isMandatory: true,
        unitPrice: 30000,
        isActive: true
      },
      {
        name: "Phí an ninh trật tự",
        description: "Đảm bảo an ninh",
        isMandatory: true,
        unitPrice: 20000,
        isActive: true
      },
      {
        name: "Ủng hộ quỹ khuyến học",
        description: "Tự nguyện",
        isMandatory: false,
        unitPrice: 0,
        isActive: true
      }
    ]
  )

  const feeTypeList = await prisma.feeType.findMany()

  // =========================
  // FEE RECORDS
  // =========================
  for (let i = 0; i < 25; i++) {
    const hh = households[i % households.length]
    const ft = feeTypeList[i % feeTypeList.length]

    await prisma.feeRecord.create({
      data: {
        fundAmount: ft.unitPrice || 50000,
        status: 2,
        isActive: true,
        householdId: hh.id,
        feeTypeId: ft.id,
        managerId: head.id
      }
    })
  }

  console.log("Seeded TDP 7 La Khê successfully")
}

main()
  .catch(err => console.error(err))
  .finally(async () => prisma.$disconnect())
