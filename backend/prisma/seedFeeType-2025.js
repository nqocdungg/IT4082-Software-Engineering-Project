import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function d(dateStr) {
  return new Date(dateStr + "T00:00:00")
}

async function main() {
  console.log("🚀 Seed FeeType 2025 – FINAL (copy from 2023, updated year)")

  const feeTypes = [

    /* ======================= BẮT BUỘC – CẢ NĂM (5) ======================= */

    {
      name: "Phí vệ sinh môi trường năm 2025",
      isMandatory: true,
      unitPrice: 72000,
      fromDate: d("2025-01-01"),
      toDate: d("2025-12-31"),
      shortDescription: "Đảm bảo vệ sinh môi trường khu dân cư.",
      longDescription:
        "Nhằm duy trì thường xuyên công tác thu gom, vận chuyển và xử lý rác thải sinh hoạt trên địa bàn tổ dân phố, Ban quản lý tổ dân phố triển khai thu phí vệ sinh môi trường năm 2025.\n\n"
        + "Khoản thu này được sử dụng để chi trả cho các đơn vị thu gom rác, vệ sinh đường làng ngõ xóm, điểm tập kết rác, phục vụ trực tiếp cho toàn thể các hộ dân đang sinh sống trong khu dân cư.\n\n"
        + "Việc thực hiện đầy đủ khoản phí góp phần giữ gìn môi trường sống sạch sẽ, hạn chế ô nhiễm, bảo vệ sức khỏe cộng đồng. Ban quản lý rất mong nhận được sự phối hợp và đóng góp đầy đủ của các hộ gia đình."
    },

    {
      name: "Phí an ninh trật tự năm 2025",
      isMandatory: true,
      unitPrice: 36000,
      fromDate: d("2025-01-01"),
      toDate: d("2025-12-31"),
      shortDescription: "Đảm bảo an ninh, trật tự khu dân cư.",
      longDescription:
        "Ban quản lý tổ dân phố triển khai thu phí an ninh trật tự năm 2025 nhằm phục vụ công tác giữ gìn an ninh, trật tự trên địa bàn.\n\n"
        + "Khoản phí được sử dụng để hỗ trợ các hoạt động tuần tra, phòng ngừa vi phạm pháp luật, phối hợp xử lý các tình huống mất an ninh, góp phần đảm bảo sự bình yên cho các hộ dân trong khu dân cư.\n\n"
        + "Sự đóng góp của các hộ gia đình là cơ sở quan trọng để xây dựng môi trường sống an toàn, ổn định và văn minh."
    },

    {
      name: "Phí chiếu sáng công cộng năm 2025",
      isMandatory: true,
      unitPrice: 24000,
      fromDate: d("2025-01-01"),
      toDate: d("2025-12-31"),
      shortDescription: "Duy trì hệ thống chiếu sáng công cộng.",
      longDescription:
        "Khoản phí chiếu sáng công cộng năm 2025 được thu nhằm đảm bảo kinh phí vận hành, bảo trì và sửa chữa hệ thống đèn chiếu sáng tại các tuyến đường, ngõ xóm thuộc tổ dân phố.\n\n"
        + "Hệ thống chiếu sáng phục vụ trực tiếp nhu cầu đi lại, sinh hoạt ban đêm của người dân, đồng thời góp phần đảm bảo an ninh trật tự và an toàn giao thông.\n\n"
        + "Ban quản lý đề nghị các hộ dân phối hợp thực hiện để hệ thống chiếu sáng được duy trì ổn định, lâu dài."
    },

    {
      name: "Phí quản lý tổ dân phố năm 2025",
      isMandatory: true,
      unitPrice: 30000,
      fromDate: d("2025-01-01"),
      toDate: d("2025-12-31"),
      shortDescription: "Phục vụ hoạt động quản lý tổ dân phố.",
      longDescription:
        "Phí quản lý tổ dân phố năm 2025 được thu nhằm phục vụ các hoạt động hành chính, hội họp, thông tin tuyên truyền và triển khai các nhiệm vụ chung tại địa phương.\n\n"
        + "Khoản thu giúp duy trì hoạt động của Ban quản lý tổ dân phố, đảm bảo công tác điều hành, phối hợp giữa chính quyền và nhân dân được thông suốt.\n\n"
        + "Sự đóng góp của các hộ dân là yếu tố cần thiết để tổ dân phố hoạt động hiệu quả, ổn định."
    },

    {
      name: "Phí phòng chống dịch năm 2025",
      isMandatory: true,
      unitPrice: 18000,
      fromDate: d("2025-01-01"),
      toDate: d("2025-12-31"),
      shortDescription: "Hỗ trợ công tác phòng chống dịch bệnh.",
      longDescription:
        "Nhằm chủ động phòng ngừa và ứng phó với các nguy cơ dịch bệnh, Ban quản lý tổ dân phố triển khai thu phí phòng chống dịch năm 2025.\n\n"
        + "Nguồn kinh phí được sử dụng để mua sắm vật tư y tế, hóa chất khử khuẩn, phục vụ công tác vệ sinh phòng dịch và tuyên truyền nâng cao ý thức cho người dân.\n\n"
        + "Việc đóng góp đầy đủ giúp tăng cường khả năng bảo vệ sức khỏe cộng đồng và hạn chế nguy cơ bùng phát dịch bệnh."
    },

    /* ======================= BẮT BUỘC – PHÁT SINH ======================= */

    {
      name: "Phí sửa chữa hệ thống thoát nước (03–04/2025)",
      isMandatory: true,
      unitPrice: 12000,
      fromDate: d("2025-03-01"),
      toDate: d("2025-04-30"),
      shortDescription: "Sửa chữa hệ thống thoát nước khu dân cư.",
      longDescription:
        "Do hệ thống thoát nước trên địa bàn tổ dân phố xuất hiện tình trạng xuống cấp, Ban quản lý tổ dân phố triển khai thu phí sửa chữa hệ thống thoát nước trong năm 2025.\n\n"
        + "Khoản thu được sử dụng để nạo vét, sửa chữa các điểm hư hỏng, phục vụ trực tiếp cho các hộ dân sinh sống tại khu vực bị ảnh hưởng."
    },

    {
      name: "Phí tổng vệ sinh khu dân cư tháng 11/2025",
      isMandatory: true,
      unitPrice: 6000,
      fromDate: d("2025-11-01"),
      toDate: d("2025-11-30"),
      shortDescription: "Tổ chức tổng vệ sinh khu dân cư.",
      longDescription:
        "Nhằm chỉnh trang cảnh quan khu dân cư trước dịp cuối năm 2025, Ban quản lý tổ dân phố triển khai thu phí tổng vệ sinh khu dân cư.\n\n"
        + "Khoản thu phục vụ cho việc thuê nhân công, phương tiện vệ sinh, xử lý rác thải tồn đọng."
    },

/* ======================= ĐÓNG GÓP – 13 ======================= */

{
  name: "Ủng hộ ngày Thương binh – Liệt sĩ 27/07/2025",
  isMandatory: false,
  unitPrice: null,
  fromDate: d("2025-06-15"),
  toDate: d("2025-07-31"),
  shortDescription: "Tri ân người có công với cách mạng.",
  longDescription:
    "Nhân dịp kỷ niệm ngày Thương binh – Liệt sĩ 27/7/2025, Ban quản lý tổ dân phố phát động cuộc vận động ủng hộ nhằm tri ân các anh hùng liệt sĩ, thương binh và gia đình người có công đang sinh sống trên địa bàn.\n\n"
    + "Nguồn đóng góp được sử dụng để thăm hỏi, tặng quà các gia đình chính sách, thể hiện đạo lý \"Uống nước nhớ nguồn\" của dân tộc.\n\n"
    + "Ban quản lý kêu gọi sự chung tay, đóng góp tự nguyện của các hộ dân."
},

{
  name: "Ủng hộ quỹ Vì người nghèo năm 2025",
  isMandatory: false,
  unitPrice: null,
  fromDate: d("2025-10-01"),
  toDate: d("2025-11-30"),
  shortDescription: "Hỗ trợ hộ gia đình có hoàn cảnh khó khăn.",
  longDescription:
    "Cuộc vận động ủng hộ quỹ Vì người nghèo năm 2025 nhằm hỗ trợ các hộ nghèo, cận nghèo, hộ có hoàn cảnh đặc biệt khó khăn trên địa bàn tổ dân phố.\n\n"
    + "Nguồn quỹ được sử dụng để hỗ trợ đời sống, sửa chữa nhà ở, giúp các hộ khó khăn ổn định cuộc sống.\n\n"
    + "Mỗi sự đóng góp đều mang ý nghĩa thiết thực, thể hiện tinh thần tương thân tương ái trong cộng đồng."
},

{
  name: "Ủng hộ đồng bào bị ảnh hưởng bão lũ năm 2025",
  isMandatory: false,
  unitPrice: null,
  fromDate: d("2025-09-01"),
  toDate: d("2025-10-15"),
  shortDescription: "Hỗ trợ đồng bào vùng thiên tai.",
  longDescription:
    "Trước những thiệt hại nặng nề do bão lũ gây ra tại nhiều địa phương, Ban quản lý tổ dân phố phát động cuộc vận động ủng hộ đồng bào bị ảnh hưởng thiên tai.\n\n"
    + "Nguồn đóng góp nhằm hỗ trợ lương thực, nhu yếu phẩm và khắc phục hậu quả thiên tai cho người dân vùng bị ảnh hưởng.\n\n"
    + "Ban quản lý kêu gọi tinh thần sẻ chia, chung tay của toàn thể các hộ dân."
},

{
  name: "Ủng hộ Tết Thiếu nhi 01/06/2025",
  isMandatory: false,
  unitPrice: null,
  fromDate: d("2025-05-01"),
  toDate: d("2025-06-05"),
  shortDescription: "Chăm lo cho thiếu nhi trên địa bàn.",
  longDescription:
    "Nhân dịp Tết Thiếu nhi 01/06/2025, Ban quản lý tổ dân phố phát động vận động ủng hộ nhằm tổ chức các hoạt động vui chơi, tặng quà cho thiếu nhi trên địa bàn.\n\n"
    + "Đặc biệt quan tâm đến các em thiếu nhi có hoàn cảnh khó khăn, mồ côi, con em gia đình chính sách.\n\n"
    + "Sự đóng góp của các hộ dân góp phần mang lại niềm vui và động viên tinh thần cho các em."
},

{
  name: "Ủng hộ quỹ khuyến học năm 2025",
  isMandatory: false,
  unitPrice: null,
  fromDate: d("2025-08-01"),
  toDate: d("2025-09-30"),
  shortDescription: "Hỗ trợ học sinh có hoàn cảnh khó khăn.",
  longDescription:
    "Cuộc vận động ủng hộ quỹ khuyến học năm 2025 nhằm hỗ trợ học sinh trên địa bàn tổ dân phố có hoàn cảnh khó khăn, nguy cơ bỏ học.\n\n"
    + "Nguồn quỹ được sử dụng để hỗ trợ sách vở, đồ dùng học tập và động viên tinh thần các em tiếp tục đến trường.\n\n"
    + "Ban quản lý mong nhận được sự chung tay của cộng đồng vì tương lai của thế hệ trẻ."
},

{
  name: "Ủng hộ Tết Trung thu cho thiếu nhi năm 2025",
  isMandatory: false,
  unitPrice: null,
  fromDate: d("2025-08-15"),
  toDate: d("2025-09-25"),
  shortDescription: "Mang Trung thu ấm áp đến thiếu nhi.",
  longDescription:
    "Nhằm tổ chức Tết Trung thu cho các em thiếu nhi trên địa bàn, Ban quản lý tổ dân phố phát động vận động ủng hộ.\n\n"
    + "Nguồn đóng góp dùng để tổ chức chương trình Trung thu, tặng quà cho thiếu nhi, đặc biệt là các em có hoàn cảnh khó khăn.\n\n"
    + "Sự quan tâm của cộng đồng giúp các em có một mùa Trung thu vui tươi, ý nghĩa."
},

{
  name: "Ủng hộ quỹ phòng chống thiên tai năm 2025",
  isMandatory: false,
  unitPrice: null,
  fromDate: d("2025-04-01"),
  toDate: d("2025-05-31"),
  shortDescription: "Chủ động phòng ngừa thiên tai.",
  longDescription:
    "Quỹ phòng chống thiên tai năm 2025 được phát động nhằm huy động nguồn lực phục vụ công tác phòng ngừa, ứng phó và khắc phục hậu quả thiên tai tại địa phương.\n\n"
    + "Nguồn quỹ được sử dụng cho các hoạt động phòng chống, hỗ trợ người dân khi có thiên tai xảy ra.\n\n"
    + "Ban quản lý kêu gọi sự đóng góp tự nguyện của các hộ dân."
},

{
  name: "Ủng hộ quỹ người cao tuổi năm 2025",
  isMandatory: false,
  unitPrice: null,
  fromDate: d("2025-02-01"),
  toDate: d("2025-03-31"),
  shortDescription: "Chăm lo đời sống người cao tuổi.",
  longDescription:
    "Cuộc vận động ủng hộ quỹ người cao tuổi năm 2025 nhằm chăm lo đời sống vật chất và tinh thần cho người cao tuổi trên địa bàn tổ dân phố.\n\n"
    + "Nguồn quỹ được sử dụng để thăm hỏi, hỗ trợ các cụ có hoàn cảnh khó khăn, neo đơn.\n\n"
    + "Sự đóng góp của cộng đồng thể hiện truyền thống kính lão trọng thọ."
},

{
  name: "Ủng hộ quỹ đền ơn đáp nghĩa năm 2025",
  isMandatory: false,
  unitPrice: null,
  fromDate: d("2025-07-01"),
  toDate: d("2025-08-31"),
  shortDescription: "Tri ân gia đình chính sách.",
  longDescription:
    "Cuộc vận động ủng hộ quỹ đền ơn đáp nghĩa năm 2025 nhằm tri ân các gia đình chính sách, người có công với cách mạng trên địa bàn.\n\n"
    + "Nguồn đóng góp được sử dụng để thăm hỏi, hỗ trợ các gia đình chính sách.\n\n"
    + "Ban quản lý mong nhận được sự chung tay của toàn thể các hộ dân."
},

{
  name: "Ủng hộ xây dựng đời sống văn hóa khu dân cư năm 2025",
  isMandatory: false,
  unitPrice: null,
  fromDate: d("2025-03-01"),
  toDate: d("2025-04-30"),
  shortDescription: "Xây dựng đời sống văn hóa khu dân cư.",
  longDescription:
    "Cuộc vận động nhằm xây dựng nếp sống văn hóa, văn minh trong khu dân cư, nâng cao đời sống tinh thần cho người dân.\n\n"
    + "Nguồn đóng góp được sử dụng để tổ chức các hoạt động văn hóa, phong trào cộng đồng tại tổ dân phố.\n\n"
    + "Sự tham gia của các hộ dân góp phần xây dựng cộng đồng đoàn kết, văn minh."
},

{
  name: "Ủng hộ quỹ phòng cháy chữa cháy năm 2025",
  isMandatory: false,
  unitPrice: null,
  fromDate: d("2025-11-01"),
  toDate: d("2025-12-15"),
  shortDescription: "Tăng cường công tác phòng cháy chữa cháy.",
  longDescription:
    "Nhằm nâng cao ý thức và năng lực phòng cháy chữa cháy trong khu dân cư, Ban quản lý tổ dân phố phát động vận động ủng hộ quỹ phòng cháy chữa cháy năm 2025.\n\n"
    + "Nguồn quỹ được sử dụng để mua sắm trang thiết bị, tổ chức tuyên truyền, tập huấn kỹ năng phòng cháy chữa cháy cho người dân.\n\n"
    + "Ban quản lý mong nhận được sự phối hợp, đóng góp của các hộ dân."
},

{
  name: "Ủng hộ quỹ chăm sóc sức khỏe cộng đồng năm 2025",
  isMandatory: false,
  unitPrice: null,
  fromDate: d("2025-01-15"),
  toDate: d("2025-02-28"),
  shortDescription: "Chăm sóc sức khỏe cộng đồng.",
  longDescription:
    "Cuộc vận động ủng hộ quỹ chăm sóc sức khỏe cộng đồng năm 2025 nhằm hỗ trợ các hoạt động chăm sóc, bảo vệ và nâng cao sức khỏe cho người dân trên địa bàn.\n\n"
    + "Nguồn quỹ được sử dụng để tổ chức khám sức khỏe, tuyên truyền phòng bệnh, hỗ trợ các trường hợp khó khăn.\n\n"
    + "Sự đóng góp của các hộ dân góp phần xây dựng cộng đồng khỏe mạnh, bền vững."
},


    /* ======================= KHOẢN MỚI 2025 (2) ======================= */

    {
      name: "Phí chuyển đổi số và vận hành hệ thống năm 2025",
      isMandatory: true,
      unitPrice: 20000,
      fromDate: d("2025-01-01"),
      toDate: d("2025-12-31"),
      shortDescription: "Vận hành hệ thống quản lý điện tử.",
      longDescription:
        "Khoản phí nhằm phục vụ việc triển khai, vận hành và duy trì hệ thống quản lý tổ dân phố điện tử, bao gồm phần mềm, hạ tầng kỹ thuật và hỗ trợ người dân sử dụng dịch vụ số."
    },

    {
      name: "Ủng hộ quỹ bảo vệ môi trường xanh năm 2025",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2025-06-01"),
      toDate: d("2025-08-31"),
      shortDescription: "Xây dựng khu dân cư xanh – sạch – đẹp.",
      longDescription:
        "Cuộc vận động nhằm gây quỹ trồng cây xanh, cải tạo cảnh quan và nâng cao ý thức bảo vệ môi trường trong khu dân cư."
    }

  ]

  for (const f of feeTypes) {
    await prisma.feeType.create({
      data: { ...f, isActive: true }
    })
  }

  console.log(`✅ Seed ${feeTypes.length} FeeType năm 2025 – DONE`)
}

main()
  .catch(err => console.error("❌ Seed error:", err))
  .finally(async () => prisma.$disconnect())
