import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

/* =====================================================
 * Generate UNIQUE householdCode (9 digits)
 * ===================================================== */
async function generateUniqueHouseholdCode(tx) {
  while (true) {
    const code = Math.floor(100000000 + Math.random() * 900000000).toString()
    const existed = await tx.household.findUnique({
      where: { householdCode: code }
    })
    if (!existed) return code
  }
}

async function main() {
  /* =====================================================
   * CLEAR DATA
   * ===================================================== */
  await prisma.feeRecord.deleteMany().catch(() => {})
  await prisma.feeType.deleteMany().catch(() => {})
  await prisma.residentChange.deleteMany().catch(() => {})

  await prisma.household.updateMany({
    data: { ownerId: null }
  }).catch(() => {})

  await prisma.resident.deleteMany().catch(() => {})
  await prisma.household.deleteMany().catch(() => {})
  await prisma.user.deleteMany().catch(() => {})

  /* =====================================================
   * USERS – CÁN BỘ
   * ===================================================== */
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

  /* =====================================================
   * 6 HOUSEHOLDS SEED
   * ===================================================== */
  const householdSeeds = [
    {
      address: "Số 12 ngõ 34 TDP 7 La Khê, Hà Đông, Hà Nội",
      owner: {
        residentCCCD: "001203001001",
        fullname: "Nguyễn Văn Hùng",
        dob: new Date(1978, 4, 12),
        gender: "M",
        ethnicity: "Kinh",
        religion: "Không",
        nationality: "Việt Nam",
        hometown: "Yên Bái",
        occupation: "Lao động tự do"
      },
      members: [
        {
          residentCCCD: "001203001002",
          fullname: "Trần Thị Lan",
          dob: new Date(1980, 8, 3),
          gender: "F",
          ethnicity: "Kinh",
          religion: "Không",
          nationality: "Việt Nam",
          hometown: "Hà Nội",
          occupation: "Nội trợ",
          relationToOwner: "Vợ"
        }
      ]
    },
    {
      address: "Số 18 ngõ 90 TDP 7 La Khê, Hà Đông, Hà Nội",
      owner: {
        residentCCCD: "001203001010",
        fullname: "Trần Văn Nam",
        dob: new Date(1975, 9, 10),
        gender: "M",
        ethnicity: "Kinh",
        religion: "Không",
        nationality: "Việt Nam",
        hometown: "Bắc Giang",
        occupation: "Công nhân"
      },
      members: []
    },
    {
      address: "Số 25 ngõ 16 TDP 7 La Khê, Hà Đông, Hà Nội",
      owner: {
        residentCCCD: "001203001020",
        fullname: "Phạm Văn Dũng",
        dob: new Date(1968, 6, 2),
        gender: "M",
        ethnicity: "Kinh",
        religion: "Không",
        nationality: "Việt Nam",
        hometown: "Quảng Ninh",
        occupation: "Lái xe"
      },
      members: []
    },
    {
      address: "Số 41 ngõ 102 TDP 7 La Khê, Hà Đông, Hà Nội",
      owner: {
        residentCCCD: "001203001030",
        fullname: "Lê Văn Bình",
        dob: new Date(1955, 3, 15),
        gender: "M",
        ethnicity: "Kinh",
        religion: "Không",
        nationality: "Việt Nam",
        hometown: "Hà Nội",
        occupation: "Hưu trí"
      },
      members: []
    },
    {
      address: "Số 56 ngõ 12 TDP 7 La Khê, Hà Đông, Hà Nội",
      owner: {
        residentCCCD: "001203001040",
        fullname: "Hoàng Văn Sơn",
        dob: new Date(1982, 11, 5),
        gender: "M",
        ethnicity: "Kinh",
        religion: "Không",
        nationality: "Việt Nam",
        hometown: "Hà Nội",
        occupation: "Thợ xây"
      },
      members: []
    },
    {
      address: "Số 88 ngõ 77 TDP 7 La Khê, Hà Đông, Hà Nội",
      owner: {
        residentCCCD: "001203001050",
        fullname: "Đỗ Văn Minh",
        dob: new Date(1990, 1, 9),
        gender: "M",
        ethnicity: "Kinh",
        religion: "Không",
        nationality: "Việt Nam",
        hometown: "Bắc Ninh",
        occupation: "Nhân viên IT"
      },
      members: []
    }
  ]

  /* =====================================================
   * INSERT HOUSEHOLDS + USER HOUSEHOLD
   * ===================================================== */
  let index = 1

  for (const h of householdSeeds) {
    await prisma.$transaction(async tx => {
      const household = await tx.household.create({
        data: {
          householdCode: await generateUniqueHouseholdCode(tx),
          address: h.address,
          status: 1
        }
      })

      const ownerResident = await tx.resident.create({
        data: {
          ...h.owner,
          relationToOwner: "Chủ hộ",
          householdId: household.id,
          status: 0
        }
      })

      await tx.household.update({
        where: { id: household.id },
        data: { ownerId: ownerResident.id }
      })

      for (const m of h.members) {
        await tx.resident.create({
          data: {
            ...m,
            householdId: household.id,
            status: 0
          }
        })
      }

      // 🔐 CREATE USER HOUSEHOLD
      await tx.user.create({
        data: {
          username: `ho_${index}`,
          password: await bcrypt.hash("123456", 8),
          fullname: `Hộ ${index}`,
          role: "HOUSEHOLD",
          householdId: household.id,
          isActive: true
        }
      })
    })

    index++
  }

  console.log("✅ Seed 6 hộ + tài khoản hộ khẩu – THÀNH CÔNG")
}

main()
  .catch(err => {
    console.error("❌ Seed error:", err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
