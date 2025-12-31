import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/* =====================================================
 * DATA TEMPLATES
 * ===================================================== */
const TITLES = {
  MEETING: [
    "Mời họp tổ dân phố định kỳ tháng",
    "Họp triển khai công tác bầu cử tổ trưởng",
    "Họp bàn về vấn đề an ninh trật tự ngõ xóm",
    "Họp lấy ý kiến nhân dân về cải tạo đường ngõ"
  ],
  CLEANUP: [
    "Ra quân tổng vệ sinh ngõ xóm sáng Chủ Nhật",
    "Dọn dẹp vệ sinh môi trường phòng chống dịch bệnh",
    "Vận động khơi thông cống rãnh, phát quang bụi rậm"
  ],
  UTILITY: [
    "Thông báo lịch cắt điện luân phiên",
    "Thông báo tạm ngừng cấp nước sạch để sửa đường ống",
    "Thông báo bảo trì hệ thống internet/cáp quang khu vực",
    "Lịch thu gom rác thải cồng kềnh"
  ],
  SECURITY: [
    "Cảnh báo: Xuất hiện đối tượng lạ mặt lảng vảng",
    "Cảnh báo: Gia tăng tình trạng trộm cắp xe máy",
    "Nhắc nhở khóa cửa, cổng cẩn thận dịp nghỉ lễ",
    "Cảnh báo thủ đoạn lừa đảo qua mạng/điện thoại"
  ],
  ADMIN: [
    "Đề nghị cư dân cập nhật thông tin định danh điện tử (VNeID)",
    "Rà soát thông tin tiêm chủng cho trẻ em",
    "Tiếp nhận hồ sơ đăng ký nghĩa vụ quân sự",
    "Hướng dẫn thủ tục hành chính công trực tuyến"
  ],
  HEALTH: [
    "Lịch phun thuốc diệt muỗi phòng sốt xuất huyết",
    "Thông báo tiêm vắc xin cúm mùa cho người cao tuổi",
    "Cảnh báo dịch đau mắt đỏ đang lây lan nhanh"
  ]
}

/* =====================================================
 * HELPER FUNCTIONS
 * ===================================================== */
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}

// Sinh ngày trong tháng cụ thể
function getDateInMonth(year, month) {
  const day = rand(1, 28) // Tránh ngày 29-31 để đỡ lỗi tháng nhuận
  return new Date(year, month, day, rand(8, 18), rand(0, 59))
}

function generateContent(category, title, month, year) {
  let message = ""
  switch (category) {
    case 'MEETING':
      message = `Ban quản lý trân trọng kính mời đại diện các hộ gia đình đến tham dự cuộc họp vào 19h30 tối thứ 7 tuần này tại Nhà văn hóa. Nội dung: ${title}. Rất mong bà con đi đầy đủ.`
      break
    case 'CLEANUP':
      message = `Thực hiện phong trào "Ngày Chủ Nhật Xanh", đề nghị các hộ gia đình cử người tham gia dọn dẹp vệ sinh đoạn đường trước cửa nhà vào 7h30 sáng ngày ${rand(1, 28)}/${month + 1}.`
      break
    case 'UTILITY':
      message = `Nhận được thông báo từ đơn vị cung cấp, khu vực Tổ dân phố 7 sẽ bị gián đoạn dịch vụ trong khoảng thời gian từ 08h00 đến 16h00 ngày ${rand(1, 28)}/${month + 1}/${year}. Mong bà con thông cảm và chủ động sắp xếp.`
      break
    case 'SECURITY':
      message = `Thời gian gần đây tình hình an ninh có diễn biến phức tạp. ${title}. Đề nghị bà con nâng cao cảnh giác, nếu thấy dấu hiệu khả nghi báo ngay cho CSKV hoặc Tổ trưởng.`
      break
    case 'ADMIN':
      message = `Công an phường và Ban quản lý thông báo: ${title}. Thời gian tiếp nhận: Các buổi chiều trong tuần tại Nhà văn hóa TDP.`
      break
    case 'HEALTH':
      message = `Trung tâm y tế dự phòng thông báo: ${title}. Đề nghị người dân phối hợp thực hiện để bảo vệ sức khỏe cộng đồng.`
      break
    default:
      message = "Thông báo từ Ban quản lý tổ dân phố."
  }
  return message
}

/* =====================================================
 * MAIN SCRIPT
 * ===================================================== */
async function main() {
  console.log("🚀 Bắt đầu seed ~300+ thông báo (2023-2025)...")

  // 1. Dọn dẹp thông báo cũ (giữ lại các loại phí)
  const oldNotis = await prisma.notification.findMany({
    where: { type: { in: ["ANNOUNCEMENT", "WARNING", "EVENT"] } },
    select: { id: true }
  })
  const oldIds = oldNotis.map(n => n.id)
  if (oldIds.length > 0) {
    await prisma.notificationRecipient.deleteMany({ where: { notificationId: { in: oldIds } } })
    await prisma.notification.deleteMany({ where: { id: { in: oldIds } } })
  }

  // 2. Lấy danh sách hộ dân
  const users = await prisma.user.findMany({
    where: { role: "HOUSEHOLD", isActive: true },
    select: { id: true }
  })
  if (users.length === 0) {
    console.error("❌ Không có user hộ dân.")
    return
  }

  let notificationsBuffer = []

  // 3. Loop qua từng tháng của 2023, 2024, 2025
  const years = [2023, 2024, 2025]
  
  for (const year of years) {
    for (let month = 0; month < 12; month++) {
      
      // --- A. CÁC SỰ KIỆN CỐ ĐỊNH TRONG NĂM (SEASONAL) ---
      
      // Tháng 1: Tết dương / Tết âm
      if (month === 0) {
        notificationsBuffer.push({
          title: `Chúc mừng năm mới Xuân ${year === 2023 ? "Quý Mão" : year === 2024 ? "Giáp Thìn" : "Ất Tỵ"}`,
          message: "Kính chúc toàn thể nhân dân trong tổ dân phố một năm mới An Khang - Thịnh Vượng - Vạn Sự Như Ý.",
          type: "EVENT",
          createdAt: new Date(year, 0, 1, 8, 0)
        })
      }

      // Tháng 2: Lễ hội / Tổng kết đầu năm
      if (month === 1) {
        notificationsBuffer.push({
          title: "Đăng ký tham gia lễ hội truyền thống đầu xuân",
          message: "Ban quản lý tổ chức đoàn đi lễ hội đầu năm. Bà con nào tham gia vui lòng đăng ký với tổ trưởng trước ngày 15/02.",
          type: "EVENT",
          createdAt: getDateInMonth(year, month)
        })
      }

      // Tháng 3: Thanh niên
      if (month === 2) {
        notificationsBuffer.push({
          title: "Giải bóng đá thanh niên chào mừng 26/3",
          message: "Mời bà con ra sân cổ vũ cho đội bóng thanh niên của tổ vào chiều Chủ nhật tuần này.",
          type: "EVENT",
          createdAt: getDateInMonth(year, month)
        })
      }

      // Tháng 5: Chuẩn bị hè / Quốc tế thiếu nhi
      if (month === 4) {
        notificationsBuffer.push({
          title: "Thông báo nộp phiếu sinh hoạt hè",
          message: "Đề nghị phụ huynh nộp phiếu sinh hoạt hè cho các cháu học sinh về sinh hoạt tại địa phương.",
          type: "ANNOUNCEMENT",
          createdAt: getDateInMonth(year, month)
        })
      }

      // Tháng 6: Quốc tế thiếu nhi / Nắng nóng
      if (month === 5) {
        notificationsBuffer.push({
          title: "Tổ chức vui Tết thiếu nhi 1/6",
          message: "Mời các cháu thiếu nhi đến nhà văn hóa nhận quà và xem văn nghệ vào tối 01/06.",
          type: "EVENT",
          createdAt: new Date(year, 5, 1, 9, 0)
        })
        // Mùa hè hay cắt điện
        notificationsBuffer.push({
          title: "Cảnh báo quá tải điện mùa nắng nóng",
          message: "Đề nghị các hộ gia đình sử dụng điện tiết kiệm, tắt bớt thiết bị giờ cao điểm để tránh quá tải gây cháy nổ trạm biến áp.",
          type: "WARNING",
          createdAt: getDateInMonth(year, month)
        })
      }

      // Tháng 7: Thương binh liệt sỹ
      if (month === 6) {
        notificationsBuffer.push({
          title: "Lễ thắp nến tri ân ngày 27/7",
          message: "Mời đại diện các gia đình chính sách tham dự buổi gặp mặt tri ân tại UBND Phường.",
          type: "EVENT",
          createdAt: new Date(year, 6, 25, 8, 0)
        })
      }

      // Tháng 8: Mưa bão / Sốt xuất huyết
      if (month === 7) {
        notificationsBuffer.push({
          title: "Cảnh báo phòng chống bão và ngập úng",
          message: "Dự báo có mưa lớn kéo dài. Đề nghị bà con khơi thông cống rãnh trước cửa nhà và kê cao đồ đạc.",
          type: "WARNING",
          createdAt: getDateInMonth(year, month)
        })
      }

      // Tháng 9: Trung thu / Khai giảng / PCCC
      if (month === 8) {
        notificationsBuffer.push({
          title: "Đêm hội Trăng rằm - Vui tết Trung Thu",
          message: "Chương trình phá cỗ Trung thu cho các cháu sẽ diễn ra vào 19h30 ngày 14/08 Âm lịch.",
          type: "EVENT",
          createdAt: getDateInMonth(year, month)
        })
        notificationsBuffer.push({
          title: "Tổng kiểm tra an toàn PCCC hộ gia đình",
          message: "Đoàn kiểm tra liên ngành sẽ đi kiểm tra PCCC tại các hộ kết hợp kinh doanh. Đề nghị bà con chuẩn bị bình chữa cháy.",
          type: "WARNING",
          createdAt: getDateInMonth(year, month)
        })
      }

      // Tháng 11: Đại đoàn kết
      if (month === 10) {
        notificationsBuffer.push({
          title: "Ngày hội Đại đoàn kết toàn dân tộc",
          message: "Mời đại diện hộ gia đình dự bữa cơm thân mật tại Nhà văn hóa nhân ngày hội Đại đoàn kết 18/11.",
          type: "EVENT",
          createdAt: new Date(year, 10, 15, 8, 0)
        })
      }

      // --- B. CÁC SỰ KIỆN NGẪU NHIÊN HÀNG THÁNG (FILLER) ---
      // Mỗi tháng sinh thêm 4-6 sự kiện ngẫu nhiên để lấp đầy
      const randomCount = rand(4, 6)
      
      for (let i = 0; i < randomCount; i++) {
        const category = pick(['MEETING', 'CLEANUP', 'UTILITY', 'SECURITY', 'ADMIN', 'HEALTH'])
        const titleRaw = pick(TITLES[category])
        // Thêm chút biến tấu cho tiêu đề đỡ trùng
        const title = `${titleRaw} ${year < 2025 || Math.random() > 0.5 ? "" : "(Mới)"}`
        const message = generateContent(category, titleRaw, month, year)
        
        let type = "ANNOUNCEMENT"
        if (category === 'SECURITY' || category === 'UTILITY' || category === 'HEALTH') type = "WARNING"
        if (category === 'MEETING') type = "EVENT"

        notificationsBuffer.push({
          title: title,
          message: message,
          type: type,
          createdAt: getDateInMonth(year, month)
        })
      }
    }
  }

  // 4. INSERT DATA VÀO DB
  // Sắp xếp theo thời gian để đẹp hơn
  notificationsBuffer.sort((a, b) => a.createdAt - b.createdAt)

  console.log(`📝 Đang ghi ${notificationsBuffer.length} thông báo vào database...`)
  
  // Chia nhỏ batch để insert (dù prisma createMany nhanh nhưng logic recipient phức tạp nên dùng loop)
  // Để tối ưu tốc độ, ta dùng Promise.all cho từng chunk nhỏ
  
  const CHUNK_SIZE = 50
  for (let i = 0; i < notificationsBuffer.length; i += CHUNK_SIZE) {
    const chunk = notificationsBuffer.slice(i, i + CHUNK_SIZE)
    
    await Promise.all(chunk.map(async (item) => {
      // Create Notification
      const noti = await prisma.notification.create({
        data: item
      })

      // Generate Recipients logic
      // Tin cũ (> 30 ngày): 98% đã đọc
      // Tin mới (< 7 ngày): 40% đã đọc
      const now = new Date()
      const diffDays = (now - item.createdAt) / (1000 * 60 * 60 * 24)
      const readProb = diffDays > 30 ? 0.98 : (diffDays < 0 ? 0 : 0.4) // Future dates = 0% read

      const recipientsData = users.map(u => {
        const isRead = Math.random() < readProb
        return {
          userId: u.id,
          notificationId: noti.id,
          isRead: isRead,
          readAt: isRead ? new Date(item.createdAt.getTime() + rand(1, 48) * 3600000) : null
        }
      })

      await prisma.notificationRecipient.createMany({ data: recipientsData })
    }))
    
    console.log(`✅ Đã xử lý ${Math.min(i + CHUNK_SIZE, notificationsBuffer.length)} / ${notificationsBuffer.length}`)
  }

  console.log("=======================================")
  console.log(`🎉 SEED HOÀN TẤT: ${notificationsBuffer.length} thông báo.`)
  console.log("=======================================")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })