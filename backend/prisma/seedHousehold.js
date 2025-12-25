import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // 5 hộ “thực” theo đúng address trong data của m
  const households = [
    {
      address: "Số 12 ngõ 34 TDP 7 La Khê, Hà Đông, Hà Nội",
      householdCode: "100000001",
      account: { username: "ho_001", password: "123456", fullname: "TÀI KHOẢN HỘ 001" }
    },
    {
      address: "Số 18 ngõ 90 TDP 7 La Khê, Hà Đông, Hà Nội",
      householdCode: "100000002",
      account: { username: "ho_002", password: "123456", fullname: "TÀI KHOẢN HỘ 002" }
    },
    {
      address: "Số 25 ngõ 16 TDP 7 La Khê, Hà Đông, Hà Nội",
      householdCode: "100000003",
      account: { username: "ho_003", password: "123456", fullname: "TÀI KHOẢN HỘ 003" }
    },
    {
      address: "Số 41 ngõ 102 TDP 7 La Khê, Hà Đông, Hà Nội",
      householdCode: "100000004",
      account: { username: "ho_004", password: "123456", fullname: "TÀI KHOẢN HỘ 004" }
    },
    {
      address: "Số 56 ngõ 12 TDP 7 La Khê, Hà Đông, Hà Nội",
      householdCode: "100000005",
      account: { username: "ho_005", password: "123456", fullname: "TÀI KHOẢN HỘ 005" }
    }
  ]

  for (const h of households) {
    // 1) tìm household theo address
    const household = await prisma.household.findFirst({
      where: { address: h.address },
      select: { id: true, householdCode: true }
    })

    if (!household) {
      console.warn(`❌ Không tìm thấy household theo address: ${h.address}`)
      continue
    }

    // 2) update householdCode cố định (nếu khác)
    if (household.householdCode !== h.householdCode) {
      // tránh đè trùng code nếu DB đã có hộ khác dùng code này
      const existedCode = await prisma.household.findUnique({
        where: { householdCode: h.householdCode },
        select: { id: true }
      })
      if (existedCode && existedCode.id !== household.id) {
        console.warn(
          `⚠️ householdCode ${h.householdCode} đã thuộc householdId=${existedCode.id} (bỏ qua update code cho ${h.address})`
        )
      } else {
        await prisma.household.update({
          where: { id: household.id },
          data: {
            householdCode: h.householdCode,
            status: 1
          }
        })
        console.log(`✅ Update householdCode: ${h.address} -> ${h.householdCode}`)
      }
    }

    // 3) tạo / cập nhật account HOUSEHOLD + link householdId
    await prisma.user.upsert({
      where: { username: h.account.username },
      update: {
        fullname: h.account.fullname,
        role: "HOUSEHOLD",
        isActive: true,
        householdId: household.id
      },
      create: {
        username: h.account.username,
        password: await bcrypt.hash(h.account.password, 8),
        fullname: h.account.fullname,
        role: "HOUSEHOLD",
        isActive: true,
        householdId: household.id
      }
    })

    console.log(`✅ Upsert HOUSEHOLD user: ${h.account.username} -> householdId=${household.id}`)
  }

  console.log("\nDONE ✅")
  console.log("Tài khoản đăng nhập HOUSEHOLD:")
  console.log("ho_001 .. ho_005 | password: 123456")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
