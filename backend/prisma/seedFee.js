// prisma/seedFee.js
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  /* =====================================================
   * CLEAR ONLY FEE TYPES
   * (KHÔNG seed ai đã nộp / chưa nộp)
   * ===================================================== */
  await prisma.feeRecord.deleteMany().catch(() => {})
  await prisma.feeType.deleteMany().catch(() => {})

  /* =====================================================
   * SEED FEE TYPES (CHUẨN NGHIỆP VỤ)
   * ===================================================== */

  await prisma.feeType.createMany({
    data: [
      {
        name: "Phí vệ sinh",
        description: "Phí vệ sinh hàng tháng",
        isMandatory: true,
        unitPrice: 20000,
        isActive: true,
        fromDate: new Date("2024-01-01"),
        toDate: new Date("2024-12-31")
      },
      {
        name: "Quỹ an ninh",
        description: "Đóng góp duy trì an ninh khu dân cư",
        isMandatory: true,
        unitPrice: 50000,
        isActive: true,
        fromDate: new Date("2024-01-01"),
        toDate: new Date("2024-12-31")
      },
      {
        name: "Quỹ khuyến học",
        description: "Đóng góp tự nguyện cho hoạt động khuyến học",
        isMandatory: false,
        unitPrice: null,
        isActive: true,
        fromDate: new Date("2024-01-01"),
        toDate: new Date("2024-12-31")
      }
    ]
  })

  console.log("✅ Seed FeeType (CHƯA có FeeRecord) – THÀNH CÔNG")
}

main()
  .catch((e) => {
    console.error("❌ seedFee error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
