import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function minusDays(date, days) {
  return new Date(date.getTime() - days * 86400000)
}

async function main() {
  console.log("🚀 Seed Notification 2023 – FINAL (proper types)")

  /* ================= RESET ================= */
  await prisma.notificationRecipient.deleteMany().catch(() => {})
  await prisma.notification.deleteMany().catch(() => {})

  /* ================= LOAD DATA ================= */
  const feeTypes = await prisma.feeType.findMany({
    where: {
      fromDate: { lte: new Date("2023-12-31") },
      toDate: { gte: new Date("2023-01-01") }
    }
  })

  const feeRecords = await prisma.feeRecord.findMany({
    where: { status: 2 },
    include: { feeType: true }
  })

  const householdUsers = await prisma.user.findMany({
    where: {
      role: "HOUSEHOLD",
      isActive: true,
      householdId: { not: null }
    }
  })

  let totalRecipients = 0

  /* =====================================================
   * 1️⃣ THÔNG BÁO MỞ KHOẢN PHÍ
   * ===================================================== */
  for (const fee of feeTypes) {
    const notif = await prisma.notification.create({
      data: {
        title: `Triển khai ${fee.name}`,
        message:
          `Ban quản lý tổ dân phố thông báo triển khai ${fee.name}. `
          + `Đề nghị các hộ dân theo dõi và thực hiện theo thời gian quy định.`,
        type: "FEE_OPEN",
        createdAt: fee.fromDate
      }
    })

    for (const u of householdUsers) {
      await prisma.notificationRecipient.create({
        data: {
          notificationId: notif.id,
          userId: u.id,
          isRead: false
        }
      })
      totalRecipients++
    }
  }

  /* =====================================================
   * 2️⃣ XÁC NHẬN ĐÃ THANH TOÁN
   * ===================================================== */
  for (const r of feeRecords) {
    const user = householdUsers.find(u => u.householdId === r.householdId)
    if (!user) continue

    const notif = await prisma.notification.create({
      data: {
        title: `Đã ghi nhận thanh toán ${r.feeType.name}`,
        message:
          `Hệ thống đã ghi nhận quý hộ đã hoàn thành `
          + `${r.feeType.name}. Xin cảm ơn sự phối hợp.`,
        type: "PAYMENT_SUCCESS",
        createdAt: r.createdAt
      }
    })

    await prisma.notificationRecipient.create({
      data: {
        notificationId: notif.id,
        userId: user.id,
        isRead: Math.random() < 0.3
      }
    })

    totalRecipients++
  }

  /* =====================================================
   * 3️⃣ VẬN ĐỘNG ĐÓNG GÓP
   * ===================================================== */
  for (const fee of feeTypes.filter(f => !f.isMandatory)) {
    const notif = await prisma.notification.create({
      data: {
        title: `Vận động ${fee.name}`,
        message:
          `Ban quản lý tổ dân phố phát động vận động `
          + `${fee.name}. Rất mong nhận được sự quan tâm `
          + `và đóng góp tự nguyện của các hộ dân.`,
        type: "CONTRIBUTION_CALL",
        createdAt: randomDate(fee.fromDate, fee.toDate)
      }
    })

    for (const u of householdUsers) {
      await prisma.notificationRecipient.create({
        data: {
          notificationId: notif.id,
          userId: u.id,
          isRead: false
        }
      })
      totalRecipients++
    }
  }

  /* =====================================================
   * 4️⃣ CẢNH BÁO SẮP HẾT HẠN – 5 NGÀY & 2 NGÀY
   * ===================================================== */
  for (const fee of feeTypes.filter(f => f.isMandatory)) {
    for (const days of [5, 2]) {
      const remindDate = minusDays(fee.toDate, days)

      const unpaidHouseholds = await prisma.household.findMany({
        where: {
          status: 1,
          feeRecords: {
            none: {
              feeTypeId: fee.id,
              status: 2
            }
          }
        }
      })

      if (!unpaidHouseholds.length) continue

      const notif = await prisma.notification.create({
        data: {
          title: `⚠️ Sắp hết hạn đóng ${fee.name}`,
          message:
            `${fee.name} sẽ kết thúc vào ngày `
            + `${fee.toDate.toLocaleDateString("vi-VN")}. `
            + `Đề nghị quý hộ gia đình khẩn trương kiểm tra `
            + `và hoàn thành nghĩa vụ đóng phí (nếu chưa hoàn thành).`,
          type: "PAYMENT_DUE_SOON",
          createdAt: remindDate
        }
      })

      for (const h of unpaidHouseholds) {
        const user = householdUsers.find(u => u.householdId === h.id)
        if (!user) continue

        await prisma.notificationRecipient.create({
          data: {
            notificationId: notif.id,
            userId: user.id,
            isRead: false
          }
        })

        totalRecipients++
      }
    }
  }

  console.log("✅ Seed Notification 2023 hoàn tất")
  console.log("📄 Tổng recipient:", totalRecipients)
}

main()
  .catch(err => console.error("❌ Seed error:", err))
  .finally(async () => prisma.$disconnect())
