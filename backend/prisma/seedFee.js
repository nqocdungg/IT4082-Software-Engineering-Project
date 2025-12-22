// prisma/seedFee.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ==================================================
  // CLEAR ONLY FEE DATA (không đụng users/households)
  // ==================================================
  await prisma.feeRecord.deleteMany().catch(() => {});
  await prisma.feeType.deleteMany().catch(() => {});

  // ==================================================
  // GET MANAGER (ưu tiên KẾ TOÁN -> HEAD -> DEPUTY)
  // ==================================================
  const manager =
    (await prisma.user.findFirst({ where: { role: "ACCOUNTANT" } })) ||
    (await prisma.user.findFirst({ where: { role: "HEAD" } })) ||
    (await prisma.user.findFirst({ where: { role: "DEPUTY" } }));

  if (!manager) {
    throw new Error("Không tìm thấy user (ACCOUNTANT/HEAD/DEPUTY) để làm managerId");
  }

  // ==================================================
  // GET HOUSEHOLDS (bám theo địa chỉ trong seed.js)
  // ==================================================
  const addresses = [
    "Số 12 ngõ 34 TDP 7 La Khê, Hà Đông, Hà Nội",
    "Số 18 ngõ 90 TDP 7 La Khê, Hà Đông, Hà Nội",
    "Số 25 ngõ 16 TDP 7 La Khê, Hà Đông, Hà Nội",
    "Số 41 ngõ 102 TDP 7 La Khê, Hà Đông, Hà Nội",
    "Số 56 ngõ 12 TDP 7 La Khê, Hà Đông, Hà Nội",
  ];

  const households = await prisma.household.findMany({
    where: { address: { in: addresses } },
    include: { owner: true },
  });

  if (households.length === 0) {
    throw new Error("Không tìm thấy household nào. Nhớ chạy seed.js trước nhé.");
  }

  const byOwner = (name) =>
    households.find((h) => (h.owner?.fullname || "").trim() === name);

  const hHung = byOwner("Nguyễn Văn Hùng");
  const hNam = byOwner("Trần Văn Nam");
  const hDung = byOwner("Phạm Văn Dũng");
  const hBinh = byOwner("Lê Văn Bình");
  const hSon = byOwner("Hoàng Văn Sơn");

  // ==================================================
  // FEE TYPES (thực tế)
  // ==================================================
  const feeVS = await prisma.feeType.create({
    data: {
      name: "Phí vệ sinh",
      description: "Thu theo tháng, bắt buộc",
      isMandatory: true,
      unitPrice: 20000,
      isActive: true,
      fromDate: new Date("2024-01-01"),
      toDate: new Date("2024-12-31"),
    },
  });

  const feeAN = await prisma.feeType.create({
    data: {
      name: "Quỹ an ninh",
      description: "Đóng góp duy trì an ninh khu dân cư",
      isMandatory: true,
      unitPrice: 50000,
      isActive: true,
      fromDate: new Date("2024-01-01"),
      toDate: new Date("2024-12-31"),
    },
  });

  const feeKH = await prisma.feeType.create({
    data: {
      name: "Quỹ khuyến học",
      description: "Đóng góp tự nguyện cho hoạt động khuyến học",
      isMandatory: false,
      unitPrice: null,
      isActive: true,
      fromDate: new Date("2024-01-01"),
      toDate: new Date("2024-12-31"),
    },
  });

  // helper tạo record (đúng schema)
  async function addRecord({ household, feeType, amount, status, description }) {
    if (!household) return;
    return prisma.feeRecord.create({
      data: {
        householdId: household.id,
        feeTypeId: feeType.id,
        managerId: manager.id,
        amount: Number(amount) || 0,
        status, // 0 unpaid, 1 partial, 2 paid
        description: description || "",
      },
    });
  }

  // ==================================================
  // FEE RECORDS (kịch bản thực tế, giống kiểu ảnh m gửi)
  // ==================================================

  // 1) Nguyễn Văn Hùng - có 1 khoản thu một phần + vài khoản chưa thu
  await addRecord({
    household: hHung,
    feeType: feeVS,
    amount: 0,
    status: 0,
    description: "Chưa nộp, sẽ nhắc lại",
  });
  await addRecord({
    household: hHung,
    feeType: feeAN,
    amount: 25000,
    status: 1,
    description: "Thu một phần, hẹn nộp nốt tuần sau",
  });
  await addRecord({
    household: hHung,
    feeType: feeKH,
    amount: 0,
    status: 0,
    description: "Chưa đóng góp",
  });

  // 2) Trần Văn Nam - đã chuyển khoản phí an ninh, vệ sinh chưa thu
  await addRecord({
    household: hNam,
    feeType: feeAN,
    amount: 50000,
    status: 2,
    description: "Đã chuyển khoản",
  });
  await addRecord({
    household: hNam,
    feeType: feeVS,
    amount: 0,
    status: 0,
    description: "Chưa thu",
  });

  // 3) Phạm Văn Dũng - vệ sinh đóng đúng hạn, khuyến học tự nguyện ít
  await addRecord({
    household: hDung,
    feeType: feeVS,
    amount: 20000,
    status: 2,
    description: "Đóng đúng hạn",
  });
  await addRecord({
    household: hDung,
    feeType: feeKH,
    amount: 30000,
    status: 2,
    description: "Ủng hộ khuyến học",
  });

  // 4) Lê Văn Bình - chủ yếu chưa thu (kiểu ảnh của m)
  await addRecord({
    household: hBinh,
    feeType: feeVS,
    amount: 0,
    status: 0,
    description: "Chưa thu",
  });
  await addRecord({
    household: hBinh,
    feeType: feeAN,
    amount: 0,
    status: 0,
    description: "Chưa nộp, sẽ nhắc lại",
  });

  // 5) Hoàng Văn Sơn - phí vệ sinh thu 1 phần, an ninh đã thu
  await addRecord({
    household: hSon,
    feeType: feeVS,
    amount: 10000,
    status: 1,
    description: "Thu một phần",
  });
  await addRecord({
    household: hSon,
    feeType: feeAN,
    amount: 50000,
    status: 2,
    description: "Đã thu đủ",
  });

  console.log("✅ Seed FeeType + FeeRecord (dữ liệu thực tế theo seed.js) thành công");
}

main()
  .catch((e) => {
    console.error("❌ seedFee error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
