import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const householdCode = "576729967" // 👈 MÃ HỘ DEMO CỦA BẠN

  console.log("🧹 Reset demo household:", householdCode)

  const household = await prisma.household.findUnique({
    where: { householdCode },
    include: {
      account: true
    }
  })

  if (!household) {
    console.log("❌ Không tìm thấy hộ khẩu")
    return
  }

  /* =================================================
   * XÓA ĐÚNG THEO SCHEMA
   * ================================================= */

  // 1️⃣ NotificationRecipient (CHỈ của user hộ này)
  if (household.account) {
    await prisma.notificationRecipient.deleteMany({
      where: {
        userId: household.account.id
      }
    })
  }

  // 2️⃣ FeeRecord (theo household)
  await prisma.feeRecord.deleteMany({
    where: {
      householdId: household.id
    }
  })

  // 3️⃣ Residents
  await prisma.resident.deleteMany({
    where: {
      householdId: household.id
    }
  })

  // 4️⃣ User HOUSEHOLD
  if (household.account) {
    await prisma.user.delete({
      where: {
        id: household.account.id
      }
    })
  }

  // 5️⃣ Household
  await prisma.household.delete({
    where: {
      id: household.id
    }
  })

  console.log("✅ Reset demo household DONE")
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect())
