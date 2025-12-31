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

/* =====================================================
 * Helper
 * ===================================================== */
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

const START_DATE = new Date("2023-01-01T00:00:00")
const END_DATE   = new Date("2025-12-31T23:59:59")

/* =====================================================
 * Vietnam realistic data
 * ===================================================== */
const LAST_NAMES = [
  "Nguyễn","Trần","Lê","Phạm","Hoàng","Huỳnh","Phan","Vũ","Võ",
  "Đặng","Bùi","Đỗ","Hồ","Ngô","Dương","Lý","Tạ","Đinh","Mai","Cao",
  "Triệu","Tống"
]

const MALE_NAMES = [
  "Văn An","Văn Bình","Văn Cường","Văn Dũng","Văn Đức","Hữu Phúc",
  "Quang Huy","Minh Tuấn","Anh Tuấn","Đình Long","Thành Đạt",
  "Xuân Trường","Trọng Nghĩa","Hoàng Nam","Quốc Khánh","Hải Nam",
  "Minh Trí","Vũ Minh","Chí Vũ"
]

const FEMALE_NAMES = [
  "Thị Hoa","Thị Hương","Thị Lan","Thị Mai","Thu Hà","Ngọc Anh",
  "Thanh Huyền","Phương Linh","Kim Oanh","Thu Trang","Bích Ngọc",
  "Minh Châu","Khánh Linh","Diệu Anh","Ngọc Linh","Đoan Trang",
  "Ngọc Huyền","Thu Hằng","Minh Hằng","Ngọc Hà","Mai Linh","Yến Nhi"
]

const HOMETOWNS = [
  "Hà Nội","Hà Nam","Nam Định","Ninh Bình","Hưng Yên","Thái Bình",
  "Bắc Ninh","Vĩnh Phúc","Phú Thọ","Hải Dương","Bắc Giang","Thanh Hóa","Nghệ An"
]

/* =====================================================
 * Age & relation logic
 * ===================================================== */
function dateFromAge(age) {
  const year = new Date().getFullYear() - age
  return new Date(year, rand(0, 11), rand(1, 28))
}

function spouseAge(ownerAge) {
  return clamp(ownerAge + rand(-6, 6), 22, 80)
}

function childAge(ownerAge) {
  return clamp(ownerAge - rand(18, 40), 0, 40)
}

function parentAge(ownerAge) {
  return clamp(ownerAge + rand(18, 40), 45, 95)
}

function buildRelations(memberCount) {
  const rel = ["Chủ hộ"]
  if (memberCount === 1) return rel

  if (Math.random() < 0.7) rel.push("Vợ/Chồng")

  while (rel.length < memberCount) {
    const r = Math.random()
    if (r < 0.7) rel.push("Con")
    else rel.push("Bố/Mẹ")
  }
  return rel
}

function resolveRelation(raw, ownerGender) {
  if (raw === "Chủ hộ") return { relation: "Chủ hộ", gender: ownerGender }

  if (raw === "Vợ/Chồng") {
    const gender = ownerGender === "M" ? "F" : "M"
    return { relation: gender === "F" ? "Vợ" : "Chồng", gender }
  }

  if (raw === "Bố/Mẹ") {
    const gender = Math.random() < 0.5 ? "M" : "F"
    return { relation: gender === "M" ? "Bố" : "Mẹ", gender }
  }

  const gender = Math.random() < 0.5 ? "M" : "F"
  return { relation: "Con", gender }
}

function dobByRelation(relation, ownerAge) {
  if (relation === "Chủ hộ") return dateFromAge(ownerAge)
  if (relation === "Vợ" || relation === "Chồng") return dateFromAge(spouseAge(ownerAge))
  if (relation === "Con") return dateFromAge(childAge(ownerAge))
  if (relation === "Bố" || relation === "Mẹ") return dateFromAge(parentAge(ownerAge))
  return dateFromAge(rand(0, 85))
}

/* =====================================================
 * MAIN
 * ===================================================== */
async function main() {
  console.log("🚀 Start FINAL seed Resident + Household")

  await prisma.residentChange.deleteMany().catch(() => {})
  await prisma.feeRecord.deleteMany().catch(() => {})
  await prisma.feeType.deleteMany().catch(() => {})

  await prisma.household.updateMany({ data: { ownerId: null } }).catch(() => {})
  await prisma.resident.deleteMany().catch(() => {})
  await prisma.household.deleteMany().catch(() => {})
  await prisma.user.deleteMany().catch(() => {})

  await prisma.user.create({
    data: {
      username: "to_truong",
      password: await bcrypt.hash("totruong@123", 8),
      fullname: "TỔ TRƯỞNG",
      role: "HEAD",
      createdAt: randomDate(START_DATE, END_DATE)
    }
  })

  await prisma.user.create({
    data: {
      username: "to_pho",
      password: await bcrypt.hash("topho@123", 8),
      fullname: "TỔ PHÓ",
      role: "DEPUTY",
      createdAt: randomDate(START_DATE, END_DATE)
    }
  })

  await prisma.user.create({
    data: {
      username: "ke_toan",
      password: await bcrypt.hash("ketoan@123", 8),
      fullname: "KẾ TOÁN",
      role: "ACCOUNTANT",
      createdAt: randomDate(START_DATE, END_DATE)
    }
  })

  const HOUSEHOLD_COUNT = 360
  const householdPassword = await bcrypt.hash("123456", 8)
  let totalResidents = 0

  for (let i = 0; i < HOUSEHOLD_COUNT; i++) {
    await prisma.$transaction(async tx => {
      const regDate = randomDate(START_DATE, END_DATE)

      const household = await tx.household.create({
        data: {
          householdCode: await generateUniqueHouseholdCode(tx),
          address: `Số ${rand(1,150)} ngõ ${rand(1,120)} TDP 7 Phường La Khê, Hà Đông, Hà Nội`,
          status: 1,
          registrationDate: regDate,
          updatedAt: regDate
        }
      })

      await tx.user.create({
        data: {
          username: `hk_${household.householdCode}`,
          password: householdPassword,
          fullname: `Hộ ${household.householdCode}`,
          role: "HOUSEHOLD",
          householdId: household.id,
          isActive: true,
          createdAt: regDate
        }
      })

      const memberCount = rand(1, 6)
      const ownerGender = Math.random() < 0.6 ? "M" : "F"
      const ownerAge = rand(30, 65)

      const relations = buildRelations(memberCount)
      let ownerId = null

      for (const raw of relations) {
        const { relation, gender } = resolveRelation(raw, ownerGender)

        const fullname =
          pick(LAST_NAMES) + " " +
          (gender === "M" ? pick(MALE_NAMES) : pick(FEMALE_NAMES))

        const createdAt = randomDate(regDate, END_DATE)

        const resident = await tx.resident.create({
          data: {
            residentCCCD: "0" + rand(100000000000, 999999999999),
            fullname,
            dob: dobByRelation(relation, ownerAge),
            gender,
            ethnicity: "Kinh",
            religion: Math.random() < 0.9 ? "Không" : "Phật giáo",
            nationality: "Việt Nam",
            hometown: pick(HOMETOWNS),
            occupation: relation === "Con" ? "Học sinh" : pick(["Công nhân","Nhân viên văn phòng","Hưu trí","Buôn bán tự do"]),
            relationToOwner: relation,
            status: 0,
            householdId: household.id,
            createdAt,
            updatedAt: createdAt
          }
        })

        if (relation === "Chủ hộ") ownerId = resident.id
        totalResidents++
      }

      await tx.household.update({
        where: { id: household.id },
        data: { ownerId }
      })
    })
  }

  console.log("✅ Seed FINAL hoàn tất")
  console.log("🏠 Số hộ:", HOUSEHOLD_COUNT)
  console.log("👤 Tổng nhân khẩu:", totalResidents)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
