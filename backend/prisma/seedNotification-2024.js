import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function minusDays(date, days) {
  return new Date(date.getTime() - days * 86400000)
}

function randomReadAt(createdAt) {
  return new Date(createdAt.getTime() + Math.floor(Math.random() * 6 + 1) * 3600000)
}

const START_2024 = new Date("2024-01-01T00:00:00")
const END_2024   = new Date("2024-12-31T23:59:59")

async function main() {
  console.log("🚀 Seed Notification 2024 – FINAL FIXED")

  /* ================= LOAD DATA ================= */

  const feeTypes = await prisma.feeType.findMany({
    where: {
      fromDate: { lte: END_2024 },
      toDate: { gte: START_2024 }
    }
  })

  const feeRecords = await prisma.feeRecord.findMany({
    where: {
      status: 2,
      createdAt: { gte: START_2024, lte: END_2024 }
    },
    include: { feeType: true }
  })

  const householdUsers = await prisma.user.findMany({
    where: {
      role: "HOUSEHOLD",
      isActive: true,
      householdId: { not: null }
    }
  })

  if (!feeTypes.length) {
    throw new Error("❌ No FeeType found for 2024")
  }

  /* ================= EXISTING NOTIFICATIONS ================= */

  const existingKeys = new Set(
    (
      await prisma.notification.findMany({
        select: { type: true, title: true, createdAt: true }
      })
    ).map(
      n => `${n.type}|${n.title}|${n.createdAt.toISOString()}`
    )
  )

  let totalRecipients = 0
  let createdNotifications = 0

  function exists(type, title, createdAt) {
    return existingKeys.has(`${type}|${title}|${createdAt.toISOString()}`)
  }

  /* =====================================================
   * 1️⃣ FEE_OPEN
   * ===================================================== */
  for (const fee of feeTypes) {
    const title = `Triển khai ${fee.name}`
    const createdAt = fee.fromDate

    if (exists("FEE_OPEN", title, createdAt)) continue

    const notif = await prisma.notification.create({
      data: {
        title,
        message:
          `Ban quản lý tổ dân phố thông báo triển khai ${fee.name}. `
          + `Đề nghị các hộ dân theo dõi thông tin và thực hiện `
          + `đầy đủ nghĩa vụ theo thời gian quy định.`,
        type: "FEE_OPEN",
        createdAt
      }
    })

    createdNotifications++

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
   * 2️⃣ PAYMENT_SUCCESS
   * ===================================================== */
  for (const r of feeRecords) {
    const user = householdUsers.find(u => u.householdId === r.householdId)
    if (!user) continue

    const title = `Đã ghi nhận thanh toán ${r.feeType.name}`
    const createdAt = r.createdAt

    if (exists("PAYMENT_SUCCESS", title, createdAt)) continue

    const isRead = Math.random() < 0.3

    const notif = await prisma.notification.create({
      data: {
        title,
        message:
          `Hệ thống đã ghi nhận quý hộ đã hoàn thành `
          + `${r.feeType.name}. Xin cảm ơn sự phối hợp của quý hộ.`,
        type: "PAYMENT_SUCCESS",
        createdAt
      }
    })

    createdNotifications++

    await prisma.notificationRecipient.create({
      data: {
        notificationId: notif.id,
        userId: user.id,
        isRead,
        readAt: isRead ? randomReadAt(createdAt) : null
      }
    })

    totalRecipients++
  }

  /* =====================================================
   * 3️⃣ CONTRIBUTION_CALL
   * ===================================================== */
  for (const fee of feeTypes.filter(f => !f.isMandatory)) {
    const createdAt = randomDate(fee.fromDate, fee.toDate)
    const title = `Vận động ${fee.name}`

    if (exists("CONTRIBUTION_CALL", title, createdAt)) continue

    const notif = await prisma.notification.create({
      data: {
        title,
        message:
          `Ban quản lý tổ dân phố phát động vận động ${fee.name}. `
          + `Rất mong nhận được sự quan tâm, chia sẻ `
          + `và đóng góp tự nguyện của các hộ dân.`,
        type: "CONTRIBUTION_CALL",
        createdAt
      }
    })

    createdNotifications++

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
   * 4️⃣ PAYMENT_DUE_SOON (CẢNH BÁO)
   * ===================================================== */
  for (const fee of feeTypes.filter(f => f.isMandatory)) {
    for (const days of [5, 2]) {
      const remindDate = minusDays(fee.toDate, days)
      if (remindDate < START_2024 || remindDate > END_2024) continue

      const unpaidHouseholds = await prisma.household.findMany({
        where: {
          status: 1,
          feeRecords: {
            none: {
              feeTypeId: fee.id,
              status: 2,
              createdAt: { gte: START_2024, lte: END_2024 }
            }
          }
        }
      })

      if (!unpaidHouseholds.length) continue

      const title = `⚠️ Sắp hết hạn đóng ${fee.name}`

      if (exists("PAYMENT_DUE_SOON", title, remindDate)) continue

      const notif = await prisma.notification.create({
        data: {
          title,
          message:
            `${fee.name} sẽ kết thúc vào ngày `
            + `${fee.toDate.toLocaleDateString("vi-VN")}. `
            + `Đề nghị quý hộ gia đình khẩn trương kiểm tra `
            + `và hoàn thành nghĩa vụ đóng phí (nếu chưa hoàn thành).`,
          type: "PAYMENT_DUE_SOON",
          createdAt: remindDate
        }
      })

      createdNotifications++

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

  console.log("✅ Seed Notification 2024 hoàn tất")
  console.log("🔔 Notification tạo mới:", createdNotifications)
  console.log("📄 Tổng recipient:", totalRecipients)
}

main()
  .catch(err => console.error("❌ Seed error:", err))
  .finally(async () => prisma.$disconnect())
