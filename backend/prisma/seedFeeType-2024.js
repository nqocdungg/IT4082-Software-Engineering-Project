import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function d(dateStr) {
  return new Date(dateStr + "T00:00:00")
}

function dEnd(dateStr) {
  return new Date(dateStr + "T23:59:59")
}

async function main() {
  console.log("🚀 Seed FeeType 2024 – APPEND ONLY")

  /**
   * =====================================================
   * POLICY
   * -----------------------------------------------------
   * - 2023: năm gốc → ĐƯỢC reset
   * - TỪ 2024 TRỞ ĐI → TUYỆT ĐỐI KHÔNG RESET
   * - File này CHỈ append FeeType năm 2024
   * - Có kiểm tra trùng theo `name`
   * =====================================================
   */

  /* ================= LOAD EXISTING ================= */
  const existingNames = new Set(
    (
      await prisma.feeType.findMany({
        select: { name: true }
      })
    ).map(f => f.name)
  )

  /* ================= DATA ================= */
  const feeTypes = [

    /* =====================================================
     * BẮT BUỘC – CẢ NĂM
     * ===================================================== */

    {
      name: "Phí vệ sinh môi trường năm 2024",
      isMandatory: true,
      unitPrice: 78000,
      fromDate: d("2024-01-01"),
      toDate: dEnd("2024-12-31"),
      shortDescription: "Duy trì vệ sinh môi trường khu dân cư.",
      longDescription:
        "Ban quản lý tổ dân phố triển khai thu phí vệ sinh môi trường năm 2024 nhằm đảm bảo công tác thu gom, vận chuyển và xử lý rác thải sinh hoạt trên toàn bộ địa bàn khu dân cư.\n\n"
        + "Nguồn kinh phí thu được được sử dụng cho hoạt động thu gom rác thải hằng ngày, vệ sinh đường ngõ, điểm tập kết rác và duy trì cảnh quan môi trường sống chung của cộng đồng dân cư.\n\n"
        + "Ban quản lý đề nghị các hộ gia đình nghiêm túc thực hiện nghĩa vụ đóng phí để góp phần xây dựng khu dân cư xanh – sạch – đẹp."
    },

    {
      name: "Phí an ninh trật tự năm 2024",
      isMandatory: true,
      unitPrice: 36000,
      fromDate: d("2024-01-01"),
      toDate: dEnd("2024-12-31"),
      shortDescription: "Đảm bảo an ninh trật tự khu dân cư.",
      longDescription:
        "Nhằm tăng cường công tác giữ gìn an ninh trật tự tại khu dân cư, Ban quản lý tổ dân phố triển khai thu phí an ninh trật tự năm 2024.\n\n"
        + "Khoản phí được sử dụng để hỗ trợ các hoạt động tuần tra, phòng ngừa vi phạm pháp luật, phối hợp xử lý các tình huống phát sinh, góp phần đảm bảo môi trường sống an toàn cho các hộ dân.\n\n"
        + "Ban quản lý mong nhận được sự phối hợp và đóng góp đầy đủ của các hộ gia đình để công tác đảm bảo an ninh trật tự được duy trì ổn định."
    },

    {
      name: "Phí chiếu sáng công cộng năm 2024",
      isMandatory: true,
      unitPrice: 24000,
      fromDate: d("2024-01-01"),
      toDate: dEnd("2024-12-31"),
      shortDescription: "Duy trì hệ thống chiếu sáng công cộng.",
      longDescription:
        "Phí chiếu sáng công cộng năm 2024 được thu nhằm phục vụ việc vận hành, bảo trì và sửa chữa hệ thống đèn chiếu sáng tại các tuyến đường, ngõ xóm trên địa bàn tổ dân phố.\n\n"
        + "Hệ thống chiếu sáng công cộng góp phần đảm bảo an toàn giao thông, an ninh trật tự và phục vụ nhu cầu sinh hoạt ban đêm của người dân.\n\n"
        + "Ban quản lý đề nghị các hộ dân phối hợp thực hiện đóng phí để hệ thống chiếu sáng được duy trì hoạt động hiệu quả."
    },

    {
      name: "Phí quản lý tổ dân phố năm 2024",
      isMandatory: true,
      unitPrice: 30000,
      fromDate: d("2024-01-01"),
      toDate: dEnd("2024-12-31"),
      shortDescription: "Phục vụ công tác quản lý tổ dân phố.",
      longDescription:
        "Phí quản lý tổ dân phố năm 2024 được thu nhằm phục vụ các hoạt động hành chính, hội họp, tuyên truyền, phổ biến thông tin và triển khai các nhiệm vụ chung tại địa phương.\n\n"
        + "Khoản thu giúp Ban quản lý tổ dân phố hoạt động ổn định, kịp thời xử lý các công việc phát sinh, nâng cao hiệu quả quản lý và phục vụ nhân dân.\n\n"
        + "Ban quản lý mong nhận được sự phối hợp của các hộ gia đình để tổ dân phố hoàn thành tốt nhiệm vụ được giao."
    },

    /* =====================================================
     * BẮT BUỘC – PHÁT SINH
     * ===================================================== */

    {
      name: "Phí bảo trì hệ thống camera an ninh (03–08/2024)",
      isMandatory: true,
      unitPrice: 20000,
      fromDate: d("2024-03-01"),
      toDate: dEnd("2024-08-31"),
      shortDescription: "Bảo trì hệ thống camera an ninh.",
      longDescription:
        "Trong quá trình vận hành, hệ thống camera an ninh trên địa bàn cần được bảo trì, sửa chữa và nâng cấp định kỳ để đảm bảo hoạt động ổn định.\n\n"
        + "Khoản phí bảo trì được sử dụng cho việc sửa chữa thiết bị hư hỏng, thay thế linh kiện và đảm bảo hình ảnh giám sát phục vụ công tác an ninh trật tự tại khu dân cư.\n\n"
        + "Ban quản lý đề nghị các hộ dân phối hợp đóng góp để hệ thống camera phát huy hiệu quả, góp phần giữ gìn an ninh chung."
    },

    {
      name: "Phí sửa chữa hệ thống thoát nước (09–10/2024)",
      isMandatory: true,
      unitPrice: 14000,
      fromDate: d("2024-09-01"),
      toDate: dEnd("2024-10-31"),
      shortDescription: "Khắc phục hệ thống thoát nước xuống cấp.",
      longDescription:
        "Trong thời gian mưa bão, một số tuyến thoát nước trên địa bàn tổ dân phố phát sinh tình trạng xuống cấp, tắc nghẽn cục bộ, ảnh hưởng đến sinh hoạt của người dân.\n\n"
        + "Khoản phí thu được sử dụng để nạo vét, sửa chữa và khắc phục các điểm úng ngập, đảm bảo vệ sinh môi trường và an toàn đi lại cho các hộ dân.\n\n"
        + "Ban quản lý mong nhận được sự phối hợp của các hộ gia đình để công tác sửa chữa được triển khai kịp thời."
    },

    /* ======================= ĐÓNG GÓP (13) ======================= */


    {
      name: "Ủng hộ chương trình Xuân yêu thương Tết 2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-01-05"),
      toDate: d("2024-02-05"),
      shortDescription: "Chăm lo Tết cho hộ khó khăn.",
      longDescription:
        "Chương trình “Xuân yêu thương” Tết 2024 được phát động nhằm hỗ trợ các hộ gia đình có hoàn cảnh khó khăn, hộ nghèo, cận nghèo và các trường hợp đặc biệt trên địa bàn tổ dân phố được đón Tết đầy đủ, ấm áp.\n\n"
        + "Nguồn đóng góp được sử dụng để thăm hỏi, tặng quà Tết, hỗ trợ nhu yếu phẩm cho các hộ khó khăn và một số trường hợp neo đơn trong khu dân cư.\n\n"
        + "Ban quản lý kêu gọi sự chung tay, chia sẻ tự nguyện của các hộ dân để lan tỏa tinh thần tương thân tương ái."
    },


    {
      name: "Ủng hộ Tết Thiếu nhi 01/06/2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-05-01"),
      toDate: d("2024-06-05"),
      shortDescription: "Chăm lo thiếu nhi trên địa bàn.",
      longDescription:
        "Nhân dịp Tết Thiếu nhi 01/06/2024, Ban quản lý tổ dân phố phát động vận động ủng hộ nhằm tổ chức hoạt động vui chơi, tặng quà cho các em thiếu nhi đang sinh sống trên địa bàn.\n\n"
        + "Đặc biệt quan tâm đến các em có hoàn cảnh khó khăn, mồ côi, con em gia đình chính sách trong khu dân cư để các em có một ngày Tết Thiếu nhi vui tươi, ý nghĩa.\n\n"
        + "Rất mong nhận được sự quan tâm và đóng góp tự nguyện của các hộ gia đình."
    },


    {
      name: "Ủng hộ quỹ khuyến học năm 2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-08-01"),
      toDate: d("2024-09-30"),
      shortDescription: "Hỗ trợ học sinh vượt khó.",
      longDescription:
        "Quỹ khuyến học năm 2024 được phát động nhằm động viên, hỗ trợ các em học sinh trên địa bàn tổ dân phố có hoàn cảnh khó khăn, nguy cơ bỏ học do điều kiện kinh tế.\n\n"
        + "Nguồn quỹ dùng để hỗ trợ sách vở, đồ dùng học tập và khen thưởng các em có tinh thần vượt khó, vươn lên trong học tập.\n\n"
        + "Ban quản lý mong nhận được sự chung tay của cộng đồng vì tương lai của thế hệ trẻ."
    },


    {
      name: "Ủng hộ Tết Trung thu cho thiếu nhi năm 2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-08-15"),
      toDate: d("2024-09-25"),
      shortDescription: "Mang Trung thu ấm áp đến thiếu nhi.",
      longDescription:
        "Nhằm tổ chức Tết Trung thu cho các em thiếu nhi trên địa bàn tổ dân phố, Ban quản lý phát động vận động ủng hộ để tổ chức chương trình Trung thu và tặng quà cho các em.\n\n"
        + "Ưu tiên hỗ trợ các em thiếu nhi có hoàn cảnh khó khăn trong khu dân cư để các em có mùa Trung thu vui tươi, đủ đầy.\n\n"
        + "Rất mong nhận được sự ủng hộ tự nguyện của các hộ dân."
    },


    {
      name: "Ủng hộ ngày Thương binh – Liệt sĩ 27/07/2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-06-15"),
      toDate: d("2024-07-31"),
      shortDescription: "Tri ân người có công.",
      longDescription:
        "Nhân dịp kỷ niệm ngày Thương binh – Liệt sĩ 27/7/2024, Ban quản lý tổ dân phố phát động vận động ủng hộ nhằm tri ân các gia đình chính sách, người có công với cách mạng đang cư trú trên địa bàn.\n\n"
        + "Nguồn đóng góp được sử dụng để thăm hỏi, tặng quà các gia đình chính sách tại tổ dân phố, thể hiện đạo lý “Uống nước nhớ nguồn”.\n\n"
        + "Ban quản lý kêu gọi sự tham gia tự nguyện của các hộ dân để hoạt động tri ân được tổ chức chu đáo."
    },


    {
      name: "Ủng hộ quỹ đền ơn đáp nghĩa năm 2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-07-01"),
      toDate: d("2024-08-31"),
      shortDescription: "Hỗ trợ gia đình chính sách.",
      longDescription:
        "Cuộc vận động ủng hộ quỹ đền ơn đáp nghĩa năm 2024 nhằm tiếp tục chăm lo, hỗ trợ các gia đình chính sách, người có công với cách mạng trên địa bàn tổ dân phố.\n\n"
        + "Nguồn đóng góp dùng để thăm hỏi, hỗ trợ khó khăn đột xuất và tổ chức các hoạt động tri ân tại địa phương.\n\n"
        + "Ban quản lý mong nhận được sự chung tay của cộng đồng dân cư."
    },


    {
      name: "Ủng hộ quỹ Vì người nghèo năm 2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-10-01"),
      toDate: d("2024-11-30"),
      shortDescription: "Hỗ trợ hộ gia đình khó khăn.",
      longDescription:
        "Cuộc vận động ủng hộ quỹ Vì người nghèo năm 2024 nhằm hỗ trợ các hộ nghèo, cận nghèo và các trường hợp khó khăn đặc biệt trên địa bàn tổ dân phố.\n\n"
        + "Nguồn quỹ được sử dụng để hỗ trợ đời sống, sửa chữa nhà ở, hỗ trợ nhu yếu phẩm và giúp các hộ khó khăn ổn định cuộc sống.\n\n"
        + "Mỗi sự đóng góp, dù nhỏ, đều là sự sẻ chia thiết thực. Ban quản lý mong nhận được sự hưởng ứng của các hộ dân."
    },


    {
      name: "Ủng hộ đồng bào bị ảnh hưởng bão lũ năm 2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-09-01"),
      toDate: d("2024-10-15"),
      shortDescription: "Hỗ trợ đồng bào vùng thiên tai.",
      longDescription:
        "Trước thiệt hại do bão lũ gây ra tại nhiều địa phương, Ban quản lý tổ dân phố phát động vận động ủng hộ đồng bào bị ảnh hưởng thiên tai năm 2024.\n\n"
        + "Nguồn đóng góp được sử dụng để hỗ trợ lương thực, nhu yếu phẩm và khắc phục hậu quả thiên tai cho người dân vùng bị ảnh hưởng.\n\n"
        + "Ban quản lý kêu gọi tinh thần sẻ chia và chung tay của cộng đồng dân cư."
    },


    {
      name: "Ủng hộ quỹ phòng chống thiên tai năm 2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-04-01"),
      toDate: d("2024-05-31"),
      shortDescription: "Chủ động phòng ngừa thiên tai.",
      longDescription:
        "Quỹ phòng chống thiên tai năm 2024 được phát động nhằm huy động nguồn lực phục vụ công tác phòng ngừa, ứng phó và khắc phục hậu quả thiên tai tại địa phương.\n\n"
        + "Nguồn quỹ được sử dụng cho các hoạt động phòng chống, hỗ trợ người dân khi có thiên tai xảy ra và khắc phục hậu quả sau thiên tai.\n\n"
        + "Ban quản lý mong nhận được sự tham gia tự nguyện của các hộ dân."
    },


    {
      name: "Ủng hộ xây dựng đời sống văn hóa khu dân cư năm 2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-03-01"),
      toDate: d("2024-04-30"),
      shortDescription: "Xây dựng đời sống văn hóa.",
      longDescription:
        "Cuộc vận động nhằm xây dựng nếp sống văn hóa, văn minh trong khu dân cư; nâng cao đời sống tinh thần cho người dân.\n\n"
        + "Nguồn đóng góp được sử dụng để tổ chức các hoạt động văn hóa – thể thao, phong trào cộng đồng và các chương trình gắn kết người dân tại tổ dân phố.\n\n"
        + "Ban quản lý kêu gọi sự hưởng ứng của các hộ dân để xây dựng khu dân cư đoàn kết, văn minh."
    },


    {
      name: "Ủng hộ quỹ phòng cháy chữa cháy năm 2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-11-01"),
      toDate: d("2024-12-15"),
      shortDescription: "Tăng cường phòng cháy chữa cháy.",
      longDescription:
        "Nhằm nâng cao ý thức và năng lực phòng cháy chữa cháy trong khu dân cư, Ban quản lý tổ dân phố phát động vận động ủng hộ quỹ phòng cháy chữa cháy năm 2024.\n\n"
        + "Nguồn quỹ được sử dụng để mua sắm trang thiết bị, tổ chức tuyên truyền và hướng dẫn kỹ năng phòng cháy chữa cháy cho người dân.\n\n"
        + "Ban quản lý mong nhận được sự phối hợp và đóng góp tự nguyện của các hộ dân."
    },


    {
      name: "Ủng hộ quỹ người cao tuổi năm 2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-02-01"),
      toDate: d("2024-03-31"),
      shortDescription: "Chăm lo người cao tuổi.",
      longDescription:
        "Cuộc vận động ủng hộ quỹ người cao tuổi năm 2024 nhằm chăm lo đời sống vật chất và tinh thần cho người cao tuổi trên địa bàn tổ dân phố.\n\n"
        + "Nguồn quỹ được sử dụng để thăm hỏi, hỗ trợ các cụ neo đơn, có hoàn cảnh khó khăn tại khu dân cư.\n\n"
        + "Ban quản lý mong nhận được sự chung tay của cộng đồng để lan tỏa truyền thống kính lão trọng thọ."
    },


    {
      name: "Ủng hộ quỹ chuyển đổi số cộng đồng năm 2024",
      isMandatory: false,
      unitPrice: null,
      fromDate: d("2024-04-01"),
      toDate: d("2024-05-31"),
      shortDescription: "Thúc đẩy chuyển đổi số cộng đồng.",
      longDescription:
        "Quỹ chuyển đổi số cộng đồng năm 2024 được phát động nhằm hỗ trợ các hoạt động phổ cập kỹ năng số, tăng cường tiếp cận công nghệ thông tin cho người dân trên địa bàn.\n\n"
        + "Nguồn đóng góp được sử dụng cho các hoạt động tập huấn, hỗ trợ người dân (đặc biệt là người cao tuổi) tiếp cận các tiện ích số, dịch vụ công trực tuyến.\n\n"
        + "Ban quản lý kêu gọi sự hưởng ứng tự nguyện của các hộ dân để thúc đẩy cộng đồng hiện đại, thuận tiện."
    }


  ]

  /* ================= INSERT ================= */
  let created = 0
  let skipped = 0

  for (const f of feeTypes) {
    if (existingNames.has(f.name)) {
      skipped++
      continue
    }

    await prisma.feeType.create({
      data: {
        ...f,
        isActive: true
      }
    })

    created++
  }

  console.log("✅ Seed FeeType 2024 hoàn tất")
  console.log(`➕ Tạo mới: ${created}`)
  console.log(`⏭️ Bỏ qua (đã tồn tại): ${skipped}`)
}

main()
  .catch(err => console.error("❌ Seed error:", err))
  .finally(async () => prisma.$disconnect())
