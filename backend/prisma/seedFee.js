// D:\IT4082-Software-Engineering-Project\backend\prisma\seedFee.js

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/* =====================================================
 * HELPER FUNCTIONS
 * ===================================================== */
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}

function randomDateInBetween(startStr, endStr) {
  const start = new Date(startStr)
  const end = new Date(endStr)
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

/* =====================================================
 * DATA GENERATOR
 * ===================================================== */

// 1. DANH SÁCH 10 LOẠI PHÍ CỐ ĐỊNH (MANDATORY) - Ngoài phí vệ sinh
const MANDATORY_FEES = [
  // --- 2023 ---
  {
    name: "Phí an ninh trật tự 2023",
    desc: "Chi trả phụ cấp cho bảo vệ dân phố, tuần tra đêm.",
    price: 50000, // thu theo hộ hoặc nhân khẩu (ở đây code đang logic theo nhân khẩu)
    start: "2023-01-01", end: "2023-12-31"
  },
  {
    name: "Phí chiếu sáng công cộng 2023",
    desc: "Tiền điện chiếu sáng ngõ xóm năm 2023.",
    price: 30000,
    start: "2023-02-01", end: "2023-12-31"
  },
  {
    name: "Phí bảo trì đường bộ ngõ xóm 2023",
    desc: "Duy tu, sửa chữa nhỏ đường đi chung.",
    price: 20000,
    start: "2023-06-01", end: "2023-12-31"
  },
  
  // --- 2024 ---
  {
    name: "Phí an ninh trật tự 2024",
    desc: "Đảm bảo an ninh khu dân cư năm 2024.",
    price: 50000,
    start: "2024-01-01", end: "2024-12-31"
  },
  {
    name: "Phí chiếu sáng công cộng 2024",
    desc: "Tiền điện và thay bóng đèn hỏng năm 2024.",
    price: 35000,
    start: "2024-02-01", end: "2024-12-31"
  },
  {
    name: "Phí vận chuyển rác cồng kềnh 2024",
    desc: "Thu gom rác thải lớn (bàn ghế hỏng, cành cây) định kỳ.",
    price: 15000,
    start: "2024-05-01", end: "2024-12-31"
  },

  // --- 2025 ---
  {
    name: "Phí vệ sinh môi trường 2025",
    desc: "Phí thu gom rác thải sinh hoạt năm 2025 (6.000đ/tháng).",
    price: 72000,
    start: "2025-01-01", end: "2025-12-31"
  },
  {
    name: "Phí an ninh trật tự 2025",
    desc: "Chi phí an ninh, chốt trực năm 2025.",
    price: 60000,
    start: "2025-01-05", end: "2025-12-31"
  },
  {
    name: "Phí quản lý vận hành camera an ninh 2025",
    desc: "Bảo dưỡng hệ thống camera giám sát của tổ dân phố.",
    price: 20000,
    start: "2025-03-01", end: "2025-12-31"
  },
  {
    name: "Phí chiếu sáng công cộng 2025",
    desc: "Chi trả tiền điện chiếu sáng công cộng năm 2025.",
    price: 40000,
    start: "2025-02-15", end: "2025-12-31"
  }
]

// 2. DANH SÁCH 50 LOẠI ĐÓNG GÓP TỰ NGUYỆN (CONTRIBUTION)
const VOLUNTARY_FEES = [
  // --- NHÓM LỄ TẾT & TRUYỀN THỐNG (2023-2025) ---
  { n: "Ủng hộ Tết Nguyên Đán Quý Mão 2023", s: "2023-01-01", e: "2023-01-20" },
  { n: "Lễ hội đầu xuân 2023", s: "2023-02-01", e: "2023-02-28" },
  { n: "Quỹ Tết Thiếu Nhi 1/6/2023", s: "2023-05-15", e: "2023-06-01" },
  { n: "Ủng hộ ngày Thương binh Liệt sỹ 27/7/2023", s: "2023-07-01", e: "2023-07-27" },
  { n: "Tổ chức rằm Trung Thu 2023", s: "2023-08-15", e: "2023-09-29" },
  { n: "Ngày hội Đại đoàn kết 2023", s: "2023-11-01", e: "2023-11-18" },
  
  { n: "Trang trí Tết Giáp Thìn 2024", s: "2024-01-10", e: "2024-02-05" },
  { n: "Mừng thọ người cao tuổi xuân 2024", s: "2024-02-10", e: "2024-02-28" },
  { n: "Quỹ Quốc tế Thiếu nhi 1/6/2024", s: "2024-05-10", e: "2024-06-01" },
  { n: "Tri ân 27/7 năm 2024", s: "2024-07-01", e: "2024-07-27" },
  { n: "Đêm hội Trăng rằm 2024", s: "2024-09-01", e: "2024-09-17" },
  { n: "Kỷ niệm ngày phụ nữ VN 20/10/2024", s: "2024-10-01", e: "2024-10-20" },
  { n: "Ngày hội Đại đoàn kết 2024", s: "2024-11-01", e: "2024-11-18" },

  { n: "Trang trí Tết Ất Tỵ 2025", s: "2024-12-20", e: "2025-01-25" },
  { n: "Gặp mặt đầu xuân 2025", s: "2025-02-01", e: "2025-02-15" },
  { n: "Quỹ 8/3/2025 - Phụ nữ tổ dân phố", s: "2025-03-01", e: "2025-03-08" },
  { n: "Quỹ chăm sóc thiếu niên nhi đồng hè 2025", s: "2025-05-20", e: "2025-06-15" },

  // --- NHÓM TỪ THIỆN & KHUYẾN HỌC ---
  { n: "Quỹ Khuyến học năm học 2022-2023", s: "2023-05-01", e: "2023-06-30" },
  { n: "Quỹ Vì người nghèo 2023", s: "2023-10-17", e: "2023-11-18" },
  { n: "Ủng hộ nạn nhân chất độc da cam 2023", s: "2023-08-01", e: "2023-08-10" },
  { n: "Quỹ chăm sóc Người cao tuổi 2023", s: "2023-09-01", e: "2023-10-01" },

  { n: "Quỹ Khuyến học năm học 2023-2024", s: "2024-05-01", e: "2024-06-30" },
  { n: "Hỗ trợ trẻ em nghèo vượt khó 2024", s: "2024-08-15", e: "2024-09-05" },
  { n: "Quỹ Vì người nghèo 2024", s: "2024-10-17", e: "2024-11-18" },
  { n: "Tết nhân ái - Xuân yêu thương 2024", s: "2024-12-01", e: "2024-12-31" },

  { n: "Quỹ Khuyến học năm học 2024-2025", s: "2025-05-01", e: "2025-06-30" },
  { n: "Quỹ đền ơn đáp nghĩa 2025", s: "2025-07-01", e: "2025-07-27" },

  // --- NHÓM CƠ SỞ VẬT CHẤT & MÔI TRƯỜNG ---
  { n: "Xã hội hóa làm lại đường ngõ 2023", s: "2023-03-01", e: "2023-05-30" },
  { n: "Mua sắm bàn ghế Nhà văn hóa", s: "2023-06-01", e: "2023-07-15" },
  { n: "Lắp đặt hệ thống Camera an ninh (GĐ1)", s: "2023-09-01", e: "2023-10-30" },
  { n: "Cải tạo hệ thống thoát nước ngõ 12", s: "2023-11-01", e: "2023-12-31" },

  { n: "Trồng cây xanh khu vực công cộng", s: "2024-03-01", e: "2024-03-31" },
  { n: "Sửa chữa loa phát thanh phường", s: "2024-04-01", e: "2024-05-15" },
  { n: "Lắp đặt Camera an ninh (GĐ2 - Bổ sung)", s: "2024-08-01", e: "2024-09-15" },
  { n: "Sơn sửa cổng chào tổ dân phố", s: "2024-11-01", e: "2024-12-15" },
  
  { n: "Nâng cấp sân chơi trẻ em", s: "2025-04-01", e: "2025-06-01" },
  { n: "Mua sắm thiết bị âm thanh hội trường", s: "2025-07-01", e: "2025-08-15" },

  // --- NHÓM THIÊN TAI & DỊCH BỆNH & KHÁC ---
  { n: "Ủng hộ đồng bào lũ lụt miền Trung 10/2023", s: "2023-10-10", e: "2023-11-10" },
  { n: "Phòng chống dịch sốt xuất huyết 2023", s: "2023-06-01", e: "2023-07-01" },
  { n: "Ủng hộ nạn nhân hỏa hoạn chung cư mini", s: "2023-09-15", e: "2023-09-30" },
  
  { n: "Ủng hộ đồng bào bị hạn hán xâm nhập mặn", s: "2024-04-01", e: "2024-04-30" },
  { n: "Khắc phục hậu quả bão số 3 (Yagi)", s: "2024-09-10", e: "2024-09-30" },
  { n: "Vệ sinh tiêu độc khử trùng môi trường", s: "2024-10-05", e: "2024-10-20" },

  { n: "Quỹ hoạt động CLB Văn nghệ - Thể thao", s: "2025-03-15", e: "2025-04-30" },
  { n: "Ủng hộ Quỹ Biển đảo quê hương", s: "2025-05-01", e: "2025-06-01" },
  { n: "Phong trào 'Toàn dân bảo vệ an ninh tổ quốc'", s: "2025-08-01", e: "2025-08-19" },
  { n: "Cuộc vận động 'Người Việt dùng hàng Việt'", s: "2025-09-01", e: "2025-10-30" },
  
  // Các khoản phụ lấp đầy danh sách 50
  { n: "Đóng góp mua cờ Tổ quốc treo ngày lễ", s: "2023-08-15", e: "2023-08-30" },
  { n: "Hỗ trợ hội thi Nấu ăn giỏi cấp Phường", s: "2024-03-01", e: "2024-03-08" },
  { n: "Ủng hộ giải bóng đá thanh niên tổ dân phố", s: "2024-03-15", e: "2024-03-26" },
  { n: "Quyên góp sách vở cũ cho trẻ em vùng cao", s: "2025-05-15", e: "2025-06-15" },
  { n: "Ủng hộ xây dựng tủ sách cộng đồng", s: "2025-07-15", e: "2025-08-30" }
]

/* =====================================================
 * MAIN SCRIPT
 * ===================================================== */
async function main() {
  console.log("🚀 Bắt đầu seed dữ liệu quy mô lớn (60 loại phí)...")

  // 1. CLEAR DATA
  await prisma.notificationRecipient.deleteMany().catch(() => {})
  await prisma.notification.deleteMany().catch(() => {})
  await prisma.feeRecord.deleteMany().catch(() => {})
  await prisma.feeType.deleteMany().catch(() => {})

  // 2. PREPARE USERS & HOUSEHOLDS
  const households = await prisma.household.findMany({
    where: { status: 1 },
    include: {
      residents: { where: { status: { in: [0, 1] } } },
      account: true
    }
  })

  if (households.length === 0) {
    console.error("❌ Không tìm thấy hộ khẩu nào. Hãy chạy seedResidentHousehold.js trước.")
    return
  }

  // Lấy User quản lý để gán người thu tiền
  let manager = await prisma.user.findFirst({ where: { role: "ACCOUNTANT" } })
  if (!manager) manager = await prisma.user.findFirst({ where: { role: "HEAD" } })
  
  console.log(`ℹ️ Tổng số hộ: ${households.length}`)

  let totalFeeTypes = 0
  let totalRecords = 0

  // 3. SEED MANDATORY FEES (10 ITEMS)
  console.log("👉 Đang tạo 10 loại phí CỐ ĐỊNH...")
  for (const m of MANDATORY_FEES) {
    const feeType = await prisma.feeType.create({
      data: {
        name: m.name,
        shortDescription: m.desc,
        isMandatory: true,
        unitPrice: m.price,
        isActive: true,
        fromDate: new Date(m.start),
        toDate: new Date(m.end)
      }
    })
    totalFeeTypes++

    // Tạo thông báo
    const noti = await prisma.notification.create({
      data: {
        title: `📢 Thông báo thu: ${m.name}`,
        message: `${m.desc} Mức thu: ${m.price.toLocaleString()} VNĐ/nhân khẩu.`,
        type: "FEE_ANNOUNCEMENT",
        relatedId: feeType.id,
        createdAt: new Date(m.start)
      }
    })
    await createNotiRecipients(households, noti.id, m.start, m.end)

    // Tạo FeeRecord (95% hộ đóng đủ)
    for (const hh of households) {
      const memCount = hh.residents.length
      if (memCount === 0) continue

      const amount = memCount * m.price
      const randVal = Math.random()
      
      let status = 0
      let paidAmt = 0

      if (randVal < 0.95) { // 95% đóng đủ
        status = 2; paidAmt = amount
      } else if (randVal < 0.98) { // 3% đóng thiếu
        status = 1; paidAmt = amount / 2
      } else { // 2% chưa đóng
        continue
      }

      await createFeeRecord(hh.id, feeType.id, paidAmt, status, manager.id, m.desc, m.start, m.end)
    }
  }

  // 4. SEED VOLUNTARY FEES (50 ITEMS)
  console.log("👉 Đang tạo 50 loại phí ỦNG HỘ...")
  for (const v of VOLUNTARY_FEES) {
    const feeType = await prisma.feeType.create({
      data: {
        name: v.n,
        shortDescription: "Vận động đóng góp tự nguyện.",
        longDescription: `Ban quản lý kêu gọi toàn thể nhân dân tham gia đóng góp: ${v.n}.`,
        isMandatory: false,
        unitPrice: null,
        isActive: true,
        fromDate: new Date(v.s),
        toDate: new Date(v.e)
      }
    })
    totalFeeTypes++

    // Tạo thông báo
    const noti = await prisma.notification.create({
      data: {
        title: `💌 Kêu gọi ủng hộ: ${v.n}`,
        message: `Ban quản lý phát động đợt ủng hộ "${v.n}". Rất mong nhận được tấm lòng vàng của các hộ gia đình.`,
        type: "FEE_ANNOUNCEMENT",
        relatedId: feeType.id,
        createdAt: new Date(v.s)
      }
    })
    await createNotiRecipients(households, noti.id, v.s, v.e)

    // Tạo FeeRecord (Tỷ lệ đóng góp 40-70% tùy loại)
    const participationRate = rand(40, 70) / 100
    const donationLevels = [20000, 50000, 100000, 200000, 500000]

    for (const hh of households) {
      if (Math.random() > participationRate) continue // Hộ này không đóng

      const amount = pick(donationLevels)
      await createFeeRecord(hh.id, feeType.id, amount, 2, manager.id, "Đóng góp tự nguyện", v.s, v.e)
    }
  }

  /* =====================================================
   * INTERNAL HELPER FOR DB WRITES
   * ===================================================== */
  async function createNotiRecipients(households, notiId, startStr, endStr) {
    const recipients = []
    for (const hh of households) {
      if (hh.account) {
        recipients.push({
          userId: hh.account.id,
          notificationId: notiId,
          isRead: Math.random() > 0.4,
          readAt: Math.random() > 0.4 ? randomDateInBetween(startStr, endStr) : null
        })
      }
    }
    if (recipients.length > 0) {
      await prisma.notificationRecipient.createMany({ data: recipients })
    }
  }

  async function createFeeRecord(hhId, feeTypeId, amount, status, managerId, desc, startStr, endStr) {
    // Ngày nộp tiền nằm trong khoảng thu
    let payDate = randomDateInBetween(startStr, endStr)
    const now = new Date()
    // Không sinh ngày nộp tiền ở tương lai
    if (payDate > now) payDate = now
    
    // Nếu khoản thu bắt đầu ở tương lai (so với thời điểm chạy seed), thì chưa có ai đóng tiền cả
    if (new Date(startStr) > now) return

    await prisma.feeRecord.create({
      data: {
        amount, status,
        method: Math.random() > 0.7 ? "ONLINE" : "OFFLINE",
        description: desc,
        householdId: hhId,
        feeTypeId: feeTypeId,
        managerId: managerId,
        createdAt: payDate,
        updatedAt: payDate
      }
    })
    totalRecords++
  }

  console.log("=======================================")
  console.log(`✅ SEED HOÀN TẤT`)
  console.log(`- Tổng FeeType: ${totalFeeTypes}`)
  console.log(`- Tổng FeeRecord: ${totalRecords}`)
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