// prisma/seedFee.js
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  /* =====================================================
   * CLEAR ONLY FEE DATA
   * ===================================================== */
  await prisma.feeRecord.deleteMany().catch(() => {})
  await prisma.feeType.deleteMany().catch(() => {})

  /* =====================================================
   * SEED FEE TYPES
   * ===================================================== */

  await prisma.feeType.createMany({
    data: [
      /* ===============================
      * PHÍ BẮT BUỘC – THÁNG 12
      * =============================== */
      {
        name: "Phí vệ sinh tháng 12/2024",
        shortDescription: "Chi trả cho công tác vệ sinh môi trường khu dân cư trong tháng 12.",
        longDescription:
          "Nhằm đảm bảo môi trường sống xanh – sạch – đẹp, góp phần nâng cao chất lượng đời sống "
          + "của các hộ dân trong khu dân cư, ban quản lý triển khai thu phí vệ sinh tháng 12/2024. "
          + "Khoản phí này được sử dụng cho công tác thu gom rác thải sinh hoạt, vệ sinh đường nội bộ, "
          + "khu vực công cộng và xử lý rác đúng quy định. Việc đóng phí đầy đủ và đúng hạn "
          + "góp phần duy trì cảnh quan môi trường sạch sẽ, phòng tránh ô nhiễm và dịch bệnh.",
        isMandatory: true,
        unitPrice: 20000,
        isActive: true,
        fromDate: new Date("2024-12-01"),
        toDate: new Date("2024-12-31")
      },
      {
        name: "Phí an ninh trật tự tháng 12/2024",
        shortDescription: "Đảm bảo an ninh, trật tự và an toàn khu dân cư trong tháng 12.",
        longDescription:
          "Để giữ gìn an ninh trật tự, phòng chống tội phạm và các tệ nạn xã hội trong khu dân cư, "
          + "ban quản lý tổ chức thu phí an ninh trật tự tháng 12/2024. Nguồn kinh phí thu được "
          + "được sử dụng để hỗ trợ hoạt động tuần tra, phối hợp với lực lượng bảo vệ dân phố, "
          + "duy trì hệ thống camera an ninh và các biện pháp đảm bảo an toàn cho người dân. "
          + "Sự đóng góp của các hộ dân là cơ sở quan trọng để xây dựng khu dân cư an toàn, văn minh.",
        isMandatory: true,
        unitPrice: 15000,
        isActive: true,
        fromDate: new Date("2024-12-01"),
        toDate: new Date("2024-12-31")
      },
      {
        name: "Phí chiếu sáng công cộng tháng 12/2024",
        shortDescription: "Chi trả tiền điện và bảo trì hệ thống chiếu sáng công cộng.",
        longDescription:
          "Khoản phí chiếu sáng công cộng tháng 12/2024 được thu nhằm phục vụ việc chi trả tiền điện "
          + "cho hệ thống đèn đường, đèn khu vực công cộng trong khu dân cư. Bên cạnh đó, "
          + "nguồn kinh phí này còn được sử dụng để bảo trì, sửa chữa và thay thế các thiết bị chiếu sáng "
          + "bị hư hỏng, đảm bảo ánh sáng đầy đủ vào ban đêm, góp phần bảo đảm an toàn giao thông "
          + "và an ninh trật tự trong khu vực.",
        isMandatory: true,
        unitPrice: 10000,
        isActive: true,
        fromDate: new Date("2024-12-01"),
        toDate: new Date("2024-12-31")
      },

      /* ===============================
      * ĐÓNG GÓP TỰ NGUYỆN – BÀI VẬN ĐỘNG
      * =============================== */
      {
        name: "Ủng hộ đồng bào miền Trung khắc phục thiên tai",
        shortDescription: "Vận động ủng hộ đồng bào miền Trung bị ảnh hưởng bởi thiên tai.",
        longDescription:
          "Trong thời gian vừa qua, các tỉnh miền Trung đã phải gánh chịu nhiều đợt mưa lũ nghiêm trọng, "
          + "gây thiệt hại lớn về người và tài sản. Với tinh thần tương thân tương ái, "
          + "lá lành đùm lá rách, ban quản lý khu dân cư phát động đợt vận động ủng hộ đồng bào "
          + "miền Trung khắc phục hậu quả thiên tai. Toàn bộ số tiền đóng góp sẽ được tổng hợp, "
          + "công khai minh bạch và chuyển đến các địa phương, tổ chức cứu trợ để hỗ trợ người dân "
          + "ổn định cuộc sống, sớm vượt qua khó khăn.",
        isMandatory: false,
        unitPrice: null,
        isActive: true,
        fromDate: new Date("2024-12-01"),
        toDate: new Date("2025-01-31")
      },
      {
        name: "Quỹ khuyến học năm học 2024–2025",
        shortDescription: "Hỗ trợ, khuyến khích học sinh có thành tích học tập tốt.",
        longDescription:
          "Nhằm khuyến khích tinh thần hiếu học, tạo điều kiện cho học sinh trong khu dân cư "
          + "có cơ hội học tập và phát triển toàn diện, ban quản lý phát động đóng góp Quỹ khuyến học "
          + "năm học 2024–2025. Nguồn quỹ sẽ được sử dụng để khen thưởng học sinh đạt thành tích cao, "
          + "hỗ trợ học sinh có hoàn cảnh khó khăn, góp phần xây dựng phong trào học tập tích cực "
          + "và bền vững trong cộng đồng.",
        isMandatory: false,
        unitPrice: null,
        isActive: true,
        fromDate: new Date("2024-11-01"),
        toDate: new Date("2025-02-28")
      },
      {
        name: "Đóng góp trang trí khu dân cư dịp Tết Nguyên Đán",
        shortDescription: "Trang trí cảnh quan khu dân cư chào đón Tết Nguyên Đán.",
        longDescription:
          "Nhằm tạo không khí vui tươi, phấn khởi chào đón Tết Nguyên Đán, "
          + "ban quản lý khu dân cư kêu gọi các hộ dân tự nguyện đóng góp "
          + "kinh phí để trang trí cờ hoa, đèn chiếu sáng, tiểu cảnh tại các khu vực công cộng. "
          + "Hoạt động này góp phần làm đẹp cảnh quan, tăng cường tinh thần đoàn kết và "
          + "xây dựng đời sống văn hóa lành mạnh trong khu dân cư.",
        isMandatory: false,
        unitPrice: null,
        isActive: true,
        fromDate: new Date("2024-12-01"),
        toDate: new Date("2025-01-15")
      },
      {
        name: "Quỹ chăm sóc người cao tuổi",
        shortDescription: "Hỗ trợ các hoạt động chăm sóc người cao tuổi trong khu dân cư.",
        longDescription:
          "Với mục tiêu thể hiện sự quan tâm, chăm sóc và tri ân người cao tuổi, "
          + "ban quản lý khu dân cư phát động đóng góp Quỹ chăm sóc người cao tuổi. "
          + "Nguồn quỹ được sử dụng để tổ chức các hoạt động thăm hỏi, tặng quà, "
          + "chăm sóc sức khỏe cho người cao tuổi, đặc biệt vào các dịp lễ, Tết, "
          + "qua đó góp phần nâng cao đời sống tinh thần cho các cụ.",
        isMandatory: false,
        unitPrice: null,
        isActive: true,
        fromDate: new Date("2024-12-01"),
        toDate: new Date("2025-03-31")
      },
      {
        name: "Ủng hộ phòng chống dịch bệnh",
        shortDescription: "Đóng góp phục vụ công tác phòng chống dịch bệnh.",
        longDescription:
          "Trước nguy cơ bùng phát các loại dịch bệnh, ban quản lý khu dân cư "
          + "kêu gọi các hộ dân tự nguyện đóng góp để phục vụ công tác phòng chống dịch. "
          + "Nguồn kinh phí sẽ được sử dụng cho việc mua sắm vật tư y tế, "
          + "tổ chức khử khuẩn khu vực công cộng và tuyên truyền nâng cao ý thức "
          + "phòng chống dịch bệnh trong cộng đồng.",
        isMandatory: false,
        unitPrice: null,
        isActive: true,
        fromDate: new Date("2024-12-01"),
        toDate: new Date("2025-01-31")
      },
      {
        name: "Quỹ hoạt động văn hóa – thể thao",
        shortDescription: "Tổ chức các hoạt động văn hóa, thể thao trong khu dân cư.",
        longDescription:
          "Nhằm tăng cường đời sống tinh thần, nâng cao sức khỏe và "
          + "thắt chặt tình đoàn kết trong khu dân cư, ban quản lý phát động "
          + "đóng góp Quỹ hoạt động văn hóa – thể thao. Quỹ được sử dụng để "
          + "tổ chức các hoạt động văn nghệ, thể thao, giao lưu cộng đồng, "
          + "tạo sân chơi lành mạnh cho người dân ở mọi lứa tuổi.",
        isMandatory: false,
        unitPrice: null,
        isActive: true,
        fromDate: new Date("2024-12-01"),
        toDate: new Date("2025-02-28")
      },
      {
        name: "Đóng góp sửa chữa cơ sở vật chất khu dân cư",
        shortDescription: "Sửa chữa, nâng cấp các hạng mục cơ sở vật chất chung.",
        longDescription:
          "Qua thời gian sử dụng, nhiều hạng mục cơ sở vật chất chung trong khu dân cư "
          + "đã xuống cấp, cần được sửa chữa và nâng cấp. Ban quản lý kêu gọi "
          + "các hộ dân tự nguyện đóng góp kinh phí để phục vụ việc sửa chữa "
          + "đường nội bộ, nhà sinh hoạt cộng đồng và các công trình công cộng khác. "
          + "Việc đóng góp sẽ góp phần cải thiện điều kiện sinh hoạt chung, "
          + "nâng cao chất lượng môi trường sống cho toàn khu dân cư.",
        isMandatory: false,
        unitPrice: null,
        isActive: true,
        fromDate: new Date("2024-12-01"),
        toDate: new Date("2025-03-31")
      }
    ]

  })

  console.log("✅ Seed FeeType (10 khoản thu, CHƯA có FeeRecord) – THÀNH CÔNG")
}

main()
  .catch((e) => {
    console.error("❌ seedFee error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
