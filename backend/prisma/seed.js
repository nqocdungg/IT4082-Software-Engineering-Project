import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// ==================================================
// Generate UNIQUE householdCode (9 digits)
// ==================================================
async function generateUniqueHouseholdCode() {
  while (true) {
    const code = Math.floor(100000000 + Math.random() * 900000000).toString()
    const existed = await prisma.household.findUnique({
      where: { householdCode: code }
    })
    if (!existed) return code
  }
}

async function main() {
  // ==================================================
  // CLEAR DATA
  // ==================================================
  await prisma.feeRecord.deleteMany().catch(() => {})
  await prisma.feeType.deleteMany().catch(() => {})
  await prisma.residentChange.deleteMany().catch(() => {})

  await prisma.household.updateMany({ data: { ownerId: null } }).catch(() => {})
  await prisma.resident.deleteMany().catch(() => {})
  await prisma.household.deleteMany().catch(() => {})
  await prisma.user.deleteMany().catch(() => {})

  // ==================================================
  // USERS (GIỮ USERNAME + PASSWORD)
  // ==================================================
  const headUser = await prisma.user.create({
    data: {
      username: "to_truong",
      password: await bcrypt.hash("totruong@123", 8),
      fullname: "TỔ TRƯỞNG",
      role: "HEAD"
    }
  })

  await prisma.user.create({
    data: {
      username: "to_pho",
      password: await bcrypt.hash("topho@123", 8),
      fullname: "TỔ PHÓ",
      role: "DEPUTY"
    }
  })

  await prisma.user.create({
    data: {
      username: "ke_toan",
      password: await bcrypt.hash("ketoan@123", 8),
      fullname: "KẾ TOÁN",
      role: "ACCOUNTANT"
    }
  })

  // ==================================================
  // HOUSEHOLDS + RESIDENTS (5 HỘ)
  // ==================================================
  const householdSeeds = [
    {
      address: "Số 12 ngõ 34 TDP 7 La Khê, Hà Đông, Hà Nội",
      members: [
        {
          residentCCCD: "001203001001",
          fullname: "Nguyễn Văn Hùng",
          dob: new Date(1978, 4, 12),
          gender: "M",
          ethnicity: "Kinh",
          religion: "Không",
          nationality: "Việt Nam",
          hometown: "Hà Đông, Hà Nội",
          occupation: "Lao động tự do",
          relationToOwner: "Chủ hộ",
          status: 0
        },
        {
          residentCCCD: "001203001002",
          fullname: "Trần Thị Lan",
          dob: new Date(1980, 8, 3),
          gender: "F",
          ethnicity: "Kinh",
          religion: "Không",
          nationality: "Việt Nam",
          hometown: "Hà Đông, Hà Nội",
          occupation: "Nội trợ",
          relationToOwner: "Vợ",
          status: 0
        },
        {
          residentCCCD: "001203001003",
          fullname: "Nguyễn Văn Đức",
          dob: new Date(2004, 1, 21),
          gender: "M",
          ethnicity: "Kinh",
          religion: "Không",
          nationality: "Việt Nam",
          hometown: "Hà Đông, Hà Nội",
          occupation: "Sinh viên",
          relationToOwner: "Con",
          status: 0
        }
      ]
    },

    {
      address: "Số 18 ngõ 90 TDP 7 La Khê, Hà Đông, Hà Nội",
      members: [
        {
          residentCCCD: "001203001010",
          fullname: "Trần Văn Nam",
          dob: new Date(1975, 9, 10),
          gender: "M",
          ethnicity: "Kinh",
          religion: "Không",
          nationality: "Việt Nam",
          hometown: "Hà Đông, Hà Nội",
          occupation: "Công nhân",
          relationToOwner: "Chủ hộ",
          status: 0
        },
        {
          residentCCCD: "001203001011",
          fullname: "Đặng Thị Thu",
          dob: new Date(1978, 2, 8),
          gender: "F",
          ethnicity: "Kinh",
          religion: "Không",
          nationality: "Việt Nam",
          hometown: "Hà Đông, Hà Nội",
          occupation: "Buôn bán",
          relationToOwner: "Vợ",
          status: 0
        }
      ]
    },

    {
      address: "Số 25 ngõ 16 TDP 7 La Khê, Hà Đông, Hà Nội",
      members: [
        {
          residentCCCD: "001203001020",
          fullname: "Phạm Văn Dũng",
          dob: new Date(1968, 6, 2),
          gender: "M",
          ethnicity: "Kinh",
          religion: "Không",
          nationality: "Việt Nam",
          hometown: "Hà Đông, Hà Nội",
          occupation: "Lái xe",
          relationToOwner: "Chủ hộ",
          status: 0
        },
        {
          residentCCCD: "001203001021",
          fullname: "Bùi Thị Hòa",
          dob: new Date(1970, 10, 28),
          gender: "F",
          ethnicity: "Kinh",
          religion: "Không",
          nationality: "Việt Nam",
          hometown: "Hà Đông, Hà Nội",
          occupation: "Nội trợ",
          relationToOwner: "Vợ",
          status: 0
        }
      ]
    },

    {
      address: "Số 41 ngõ 102 TDP 7 La Khê, Hà Đông, Hà Nội",
      members: [
        {
          residentCCCD: "001203001030",
          fullname: "Lê Văn Bình",
          dob: new Date(1955, 3, 15),
          gender: "M",
          ethnicity: "Kinh",
          religion: "Không",
          nationality: "Việt Nam",
          hometown: "Hà Đông, Hà Nội",
          occupation: "Hưu trí",
          relationToOwner: "Chủ hộ",
          status: 0
        }
      ]
    },

    {
      address: "Số 56 ngõ 12 TDP 7 La Khê, Hà Đông, Hà Nội",
      members: [
        {
          residentCCCD: "001203001040",
          fullname: "Hoàng Văn Sơn",
          dob: new Date(1982, 11, 5),
          gender: "M",
          ethnicity: "Kinh",
          religion: "Không",
          nationality: "Việt Nam",
          hometown: "Hà Đông, Hà Nội",
          occupation: "Thợ xây",
          relationToOwner: "Chủ hộ",
          status: 0
        },
        {
          residentCCCD: "001203001041",
          fullname: "Nguyễn Thị Phương",
          dob: new Date(1984, 4, 19),
          gender: "F",
          ethnicity: "Kinh",
          religion: "Không",
          nationality: "Việt Nam",
          hometown: "Hà Đông, Hà Nội",
          occupation: "Công nhân",
          relationToOwner: "Vợ",
          status: 0
        }
      ]
    }
  ]

  // ==================================================
  // INSERT DATA
  // ==================================================
  for (const h of householdSeeds) {
    const household = await prisma.household.create({
      data: {
        householdCode: await generateUniqueHouseholdCode(),
        address: h.address,
        status: 0
      }
    })

    for (const r of h.members) {
      const resident = await prisma.resident.create({
        data: {
          residentCCCD: r.residentCCCD,
          fullname: r.fullname,
          dob: r.dob,
          gender: r.gender,
          ethnicity: r.ethnicity,
          religion: r.religion,
          nationality: r.nationality,
          hometown: r.hometown,
          occupation: r.occupation,
          relationToOwner: r.relationToOwner,
          householdId: household.id,
          status: r.status
        }
      })

      if (r.relationToOwner === "Chủ hộ") {
        await prisma.household.update({
          where: { id: household.id },
          data: { ownerId: resident.id }
        })
      }
    }
  }

  // ==================================================
  // BIẾN ĐỘNG: 1 CHUYỂN ĐI, 1 QUA ĐỜI
  // ==================================================
  const moveOut = await prisma.resident.findFirst({
    where: { fullname: "Nguyễn Văn Đức" }
  })

  if (moveOut) {
    await prisma.residentChange.create({
      data: {
        residentId: moveOut.id,
        changeType: 4,
        fromAddress: "TDP 7 La Khê",
        toAddress: "Phường Mộ Lao, Hà Đông",
        fromDate: new Date(2024, 8, 1),
        approvalStatus: 1,
        managerId: headUser.id
      }
    })

    await prisma.resident.update({
      where: { id: moveOut.id },
      data: { status: 3, householdId: null }
    })
  }

  const deceased = await prisma.resident.findFirst({
    where: { fullname: "Đặng Thị Thu" }
  })

  if (deceased) {
    await prisma.residentChange.create({
      data: {
        residentId: deceased.id,
        changeType: 7,
        fromAddress: "TDP 7 La Khê",
        toAddress: "TDP 7 La Khê",
        fromDate: new Date(2023, 6, 12),
        approvalStatus: 1,
        managerId: headUser.id
      }
    })

    await prisma.resident.update({
      where: { id: deceased.id },
      data: { status: 4 }
    })
  }

  console.log("✅ Seed FULL 5 hộ – FINAL – thành công")
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect())
