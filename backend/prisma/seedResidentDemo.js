import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

/* =====================================================
 * HELPERS
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

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function minusDays(date, days) {
  return new Date(date.getTime() - days * 86400000)
}

/* =====================================================
 * MAIN
 * ===================================================== */
async function main() {
  console.log("🚀 Seed DEMO Resident + Fee + Notification (FIX 2023–2024 PAID)")

  // 🔐 TẠO HỘ TRƯỚC NĂM 2023
  const CREATED_DATE = new Date("2022-12-31T10:00:00")

  // ❌ 2 KHOẢN BẮT BUỘC 2025 CHƯA ĐÓNG
  const UNPAID_MANDATORY_2025 = [
    "Phí vệ sinh môi trường năm 2025",
    "Phí an ninh trật tự năm 2025"
  ]

  await prisma.$transaction(async tx => {
    /* =================================================
     * 1️⃣ STAFF USERS
     * ================================================= */
    const staffRoles = ["HEAD", "DEPUTY", "ACCOUNTANT"]
    const staffUsers = []

    for (const role of staffRoles) {
      let u = await tx.user.findFirst({ where: { role } })
      if (!u) {
        u = await tx.user.create({
          data: {
            username: role.toLowerCase(),
            password: await bcrypt.hash("123456", 8),
            fullname: role,
            role,
            createdAt: CREATED_DATE
          }
        })
      }
      staffUsers.push(u)
    }

    /* =================================================
     * 2️⃣ HOUSEHOLD
     * ================================================= */
    const householdCode = await generateUniqueHouseholdCode(tx)

    const household = await tx.household.create({
      data: {
        householdCode,
        address: "Số 25 ngõ 68 TDP 7, Phường La Khê, Hà Đông, Hà Nội",
        status: 1,
        registrationDate: CREATED_DATE,
        updatedAt: CREATED_DATE
      }
    })

    const householdUser = await tx.user.create({
      data: {
        username: `hk_${householdCode}`,
        password: await bcrypt.hash("123456", 8),
        fullname: `Hộ ${householdCode}`,
        role: "HOUSEHOLD",
        householdId: household.id,
        isActive: true,
        createdAt: CREATED_DATE
      }
    })

    /* =================================================
     * 3️⃣ RESIDENTS (CỐ ĐỊNH NHÂN KHẨU)
     * ================================================= */
    const residentsData = [
      ["Nguyễn Văn An", "M", "1978-05-12", "Chủ hộ", "Nhân viên văn phòng"],
      ["Nguyễn Thị Thu Hà", "F", "1981-08-22", "Vợ", "Nhân viên văn phòng"],
      ["Nguyễn Văn Bình", "M", "1951-03-10", "Bố", "Hưu trí"],
      ["Trần Thị Lan", "F", "1953-11-05", "Mẹ", "Nội trợ"],
      ["Nguyễn Minh Tuấn", "M", "2007-09-15", "Con", "Học sinh"],
      ["Nguyễn Ngọc Linh", "F", "2013-04-20", "Con", "Học sinh"]
    ]

    let ownerId = null

    for (let i = 0; i < residentsData.length; i++) {
      const [fullname, gender, dob, relation, occupation] = residentsData[i]

      const r = await tx.resident.create({
        data: {
          residentCCCD: "0" + (100000000000 + i),
          fullname,
          dob: new Date(dob),
          gender,
          ethnicity: "Kinh",
          religion: "Không",
          nationality: "Việt Nam",
          hometown: "Hà Nội",
          occupation,
          relationToOwner: relation,
          status: 0,
          householdId: household.id,
          createdAt: CREATED_DATE,
          updatedAt: CREATED_DATE
        }
      })

      if (relation === "Chủ hộ") ownerId = r.id
    }

    await tx.household.update({
      where: { id: household.id },
      data: { ownerId }
    })

    const memberCount = residentsData.length

    /* =================================================
     * 4️⃣ FEERECORD — KHÓA CỨNG 2023 & 2024 ĐÃ ĐÓNG
     * ================================================= */
    const feeTypes = await tx.feeType.findMany({
      where: {
        fromDate: { gte: new Date("2023-01-01") },
        toDate: { lte: new Date("2025-12-31") }
      }
    })

    const paidRecords = []

    for (const fee of feeTypes) {
      const year = fee.fromDate.getFullYear()

      // ❌ BỎ QUA 2 KHOẢN BẮT BUỘC 2025
      if (
        fee.isMandatory &&
        year === 2025 &&
        UNPAID_MANDATORY_2025.includes(fee.name)
      ) {
        continue
      }

      // ✔️ PHÍ ĐÓNG GÓP: MỖI NĂM VÀI KHOẢN
      if (!fee.isMandatory && Math.random() > 0.4) continue

      // 🔐 BẮT BUỘC 2023 & 2024 → LUÔN ĐÓNG ĐỦ
      const amount = fee.isMandatory
        ? fee.unitPrice * memberCount
        : Math.floor(50_000 + Math.random() * 200_000)

      const isOnline = Math.random() < 0.6

      const record = await tx.feeRecord.create({
        data: {
          householdId: household.id,
          feeTypeId: fee.id,
          amount,
          status: 2,
          method: isOnline ? "ONLINE" : "OFFLINE",
          managerId: isOnline ? householdUser.id : pick(staffUsers).id,
          createdAt: randomDate(fee.fromDate, fee.toDate)
        }
      })

      paidRecords.push({ record, fee })
    }

    /* =================================================
     * 5️⃣ NOTIFICATION (GIỮ NGUYÊN)
     * ================================================= */

    // MỞ KHOẢN
    for (const fee of feeTypes) {
      const n = await tx.notification.create({
        data: {
          title: `Triển khai ${fee.name}`,
          message: `Ban quản lý tổ dân phố thông báo triển khai ${fee.name}.`,
          type: "FEE_OPEN",
          createdAt: fee.fromDate
        }
      })

      await tx.notificationRecipient.create({
        data: {
          notificationId: n.id,
          userId: householdUser.id,
          isRead: false
        }
      })
    }

    // ĐÃ THANH TOÁN
    for (const { record, fee } of paidRecords) {
      const n = await tx.notification.create({
        data: {
          title: `Đã ghi nhận thanh toán ${fee.name}`,
          message: `Quý hộ đã hoàn thành ${fee.name}. Xin cảm ơn.`,
          type: "PAYMENT_SUCCESS",
          createdAt: record.createdAt
        }
      })

      await tx.notificationRecipient.create({
        data: {
          notificationId: n.id,
          userId: householdUser.id,
          isRead: Math.random() < 0.3
        }
      })
    }

    // CẢNH BÁO CHỈ CHO 2 KHOẢN 2025
    for (const fee of feeTypes.filter(
      f => f.isMandatory && f.fromDate.getFullYear() === 2025
    )) {
      if (!UNPAID_MANDATORY_2025.includes(fee.name)) continue

      for (const days of [5, 2]) {
        const n = await tx.notification.create({
          data: {
            title: `⚠️ Sắp hết hạn ${fee.name}`,
            message:
              `${fee.name} sẽ kết thúc vào `
              + `${fee.toDate.toLocaleDateString("vi-VN")}. `
              + `Đề nghị quý hộ khẩn trương hoàn thành.`,
            type: "PAYMENT_DUE_SOON",
            createdAt: minusDays(fee.toDate, days)
          }
        })

        await tx.notificationRecipient.create({
          data: {
            notificationId: n.id,
            userId: householdUser.id,
            isRead: false
          }
        })
      }
    }

    console.log("======================================")
    console.log("🏠 DEMO HOUSEHOLD CREATED")
    console.log("➡️ HouseholdCode :", householdCode)
    console.log("➡️ Username      :", `hk_${householdCode}`)
    console.log("➡️ Password      : 123456")
    console.log("======================================")
  })

  console.log("✅ Seed DEMO ALL-IN-ONE hoàn tất")
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect())
