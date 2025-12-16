// prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // =========================
  // XÓA DỮ LIỆU THEO ĐÚNG THỨ TỰ QUAN HỆ
  // =========================
  // 1. Xóa thay đổi nhân khẩu (nếu có)
  await prisma.residentChange.deleteMany().catch(() => {});

  // 2. Xóa các bản ghi thu phí
  await prisma.feeRecord.deleteMany().catch(() => {});

  // 3. Xóa loại phí
  await prisma.feeType.deleteMany().catch(() => {});

  // 4. Clear ownerId / userId trong Household để tránh FK tới Resident / User
  await prisma.household
    .updateMany({
      data: {
        ownerId: null,
        userId: null,
      },
    })
    .catch(() => {});

  // 5. Xóa Resident, Household, User
  await prisma.resident.deleteMany();
  await prisma.household.deleteMany();
  await prisma.user.deleteMany();

  // =========================
  // CREATE USERS (HEAD, DEPUTY)
  // =========================
  const hashedHead = await bcrypt.hash("totruong@123", 8);
  const hashedDeputy = await bcrypt.hash("topho@123", 8);

  const head = await prisma.user.create({
    data: {
      username: "to_truong",
      password: hashedHead,
      fullname: "Nguyễn Văn A",
      phone: "0912345678",
      role: "HEAD",
    },
  });

  const deputy = await prisma.user.create({
    data: {
      username: "to_pho",
      password: hashedDeputy,
      fullname: "Nguyễn Thị B",
      phone: "0987654321",
      role: "DEPUTY",
    },
  });

  // =========================
  // CREATE HOUSEHOLDS
  // =========================
  const household1 = await prisma.household.create({
    data: {
      address: "Số 12, ngõ 34, TDP 7, phường La Khê",
      registrationDate: new Date("2010-04-12"),
      nbrOfResident: 4,
      status: 0,
    },
  });

  const household2 = await prisma.household.create({
    data: {
      address: "Số 45, ngõ 16, TDP 7, phường La Khê",
      registrationDate: new Date("2015-09-20"),
      nbrOfResident: 3,
      status: 0,
    },
  });

  const household3 = await prisma.household.create({
    data: {
      address: "Số 89, tổ 7, phường La Khê",
      registrationDate: new Date("2018-06-11"),
      nbrOfResident: 2,
      status: 0,
    },
  });

  const household4 = await prisma.household.create({
    data: {
      address: "Số 21B, ngõ 90, tổ dân phố 7, La Khê",
      registrationDate: new Date("2012-01-01"),
      nbrOfResident: 3,
      status: 0,
    },
  });

  const household5 = await prisma.household.create({
    data: {
      address: "Số 102, tổ 7, phường La Khê",
      registrationDate: new Date("2020-02-15"),
      nbrOfResident: 3,
      status: 0,
    },
  });

  // =========================
  // CREATE RESIDENTS (TỪNG NGƯỜI)
  // =========================

  // Household 1
  const r1 = await prisma.resident.create({
    data: {
      residentCCCD: "001202001111",
      fullname: "Nguyễn Văn Minh",
      dob: new Date("1970-05-20"),
      gender: "M",
      relationToOwner: "Chủ hộ",
      status: 0,
      householdId: household1.id,
    },
  });

  await prisma.resident.create({
    data: {
      residentCCCD: "001202001112",
      fullname: "Phạm Thị Hoa",
      dob: new Date("1974-09-21"),
      gender: "F",
      relationToOwner: "Vợ",
      status: 0,
      householdId: household1.id,
    },
  });

  await prisma.resident.create({
    data: {
      residentCCCD: "001202001113",
      fullname: "Nguyễn Văn Nam",
      dob: new Date("2000-11-11"),
      gender: "M",
      relationToOwner: "Con trai",
      status: 1,
      householdId: household1.id,
    },
  });

  await prisma.resident.create({
    data: {
      residentCCCD: "001202001114",
      fullname: "Nguyễn Thị Linh",
      dob: new Date("2005-01-01"),
      gender: "F",
      relationToOwner: "Con gái",
      status: 0,
      householdId: household1.id,
    },
  });

  // Household 2
  const r2 = await prisma.resident.create({
    data: {
      residentCCCD: "001202002221",
      fullname: "Trần Văn Tuấn",
      dob: new Date("1980-03-10"),
      gender: "M",
      relationToOwner: "Chủ hộ",
      status: 0,
      householdId: household2.id,
    },
  });

  await prisma.resident.create({
    data: {
      residentCCCD: "001202002222",
      fullname: "Nguyễn Thị Yến",
      dob: new Date("1984-04-25"),
      gender: "F",
      relationToOwner: "Vợ",
      status: 0,
      householdId: household2.id,
    },
  });

  await prisma.resident.create({
    data: {
      residentCCCD: "001202002223",
      fullname: "Trần Minh Khang",
      dob: new Date("2012-08-12"),
      gender: "M",
      relationToOwner: "Con",
      status: 0,
      householdId: household2.id,
    },
  });

  // Household 3
  const r3 = await prisma.resident.create({
    data: {
      residentCCCD: "001202003331",
      fullname: "Lê Văn Đức",
      dob: new Date("1955-12-01"),
      gender: "M",
      relationToOwner: "Chủ hộ",
      status: 0,
      householdId: household3.id,
    },
  });

  await prisma.resident.create({
    data: {
      residentCCCD: "001202003332",
      fullname: "Lê Thị Hồng",
      dob: new Date("1958-02-22"),
      gender: "F",
      relationToOwner: "Vợ",
      status: 4,
      householdId: household3.id,
    },
  });

  // Household 4
  const r4 = await prisma.resident.create({
    data: {
      residentCCCD: "001202004441",
      fullname: "Phan Quốc Việt",
      dob: new Date("1990-07-07"),
      gender: "M",
      relationToOwner: "Chủ hộ",
      status: 0,
      householdId: household4.id,
    },
  });

  await prisma.resident.create({
    data: {
      residentCCCD: "001202004442",
      fullname: "Hoàng Thu Trang",
      dob: new Date("1993-04-14"),
      gender: "F",
      relationToOwner: "Vợ",
      status: 0,
      householdId: household4.id,
    },
  });

  await prisma.resident.create({
    data: {
      residentCCCD: "001202004443",
      fullname: "Phan Bảo Anh",
      dob: new Date("2020-10-10"),
      gender: "F",
      relationToOwner: "Con",
      status: 0,
      householdId: household4.id,
    },
  });

  // Household 5
  const r5 = await prisma.resident.create({
    data: {
      residentCCCD: "001202005551",
      fullname: "Đỗ Mạnh Cường",
      dob: new Date("1985-09-09"),
      gender: "M",
      relationToOwner: "Chủ hộ",
      status: 0,
      householdId: household5.id,
    },
  });

  await prisma.resident.create({
    data: {
      residentCCCD: "001202005552",
      fullname: "Đỗ Việt Anh",
      dob: new Date("2010-12-12"),
      gender: "M",
      relationToOwner: "Con",
      status: 2,
      householdId: household5.id,
    },
  });

  await prisma.resident.create({
    data: {
      residentCCCD: "001202005553",
      fullname: "Đỗ Thu Hương",
      dob: new Date("1988-03-03"),
      gender: "F",
      relationToOwner: "Vợ",
      status: 0,
      householdId: household5.id,
    },
  });

  // =========================
  // SET OWNER (THEO ID THẬT)
  // =========================
  await prisma.household.update({
    where: { id: household1.id },
    data: { ownerId: r1.id },
  });

  await prisma.household.update({
    where: { id: household2.id },
    data: { ownerId: r2.id },
  });

  await prisma.household.update({
    where: { id: household3.id },
    data: { ownerId: r3.id },
  });

  await prisma.household.update({
    where: { id: household4.id },
    data: { ownerId: r4.id },
  });

  await prisma.household.update({
    where: { id: household5.id },
    data: { ownerId: r5.id },
  });

    // =========================
  // SEED KHOẢN THU (FeeType) + LỊCH SỬ THU (FeeRecord)
  // =========================
  const feeTypesData = [
    {
      name: "Phí vệ sinh môi trường",
      description: "Thu theo hộ để phục vụ công tác vệ sinh",
      isMandatory: true,
      unitPrice: 30000,
      isActive: true,
      fromDate: new Date("2025-01-01"),
      toDate: new Date("2025-12-31"),
    },
    {
      name: "Phí an ninh trật tự",
      description: "Hỗ trợ lực lượng bảo vệ khu dân cư",
      isMandatory: true,
      unitPrice: 20000,
      isActive: true,
      fromDate: new Date("2025-01-01"),
      toDate: new Date("2025-06-30"),
    },
    {
      name: "Ủng hộ quỹ khuyến học",
      description: "Đóng góp tự nguyện cho hoạt động khuyến học",
      isMandatory: false,
      unitPrice: 50000,
      isActive: true,
      fromDate: new Date("2025-02-01"),
      toDate: new Date("2025-03-31"),
    },
    {
      name: "Ủng hộ đồng bào lũ lụt",
      description: "Quỹ từ thiện dành cho vùng thiên tai",
      isMandatory: false,
      unitPrice: 0,
      isActive: true,
      fromDate: new Date("2025-09-01"),
      toDate: new Date("2025-10-15"),
    },
    {
      name: "Quỹ đền ơn đáp nghĩa",
      description: "Hỗ trợ gia đình chính sách",
      isMandatory: true,
      unitPrice: 15000,
      isActive: true,
      fromDate: new Date("2025-01-01"),
      toDate: new Date("2025-07-31"),
    },
    {
      name: "Quỹ phòng chống dịch bệnh",
      description: "Phòng chống dịch địa phương",
      isMandatory: true,
      unitPrice: 10000,
      isActive: true,
      fromDate: new Date("2025-01-01"),
      toDate: new Date("2025-06-30"),
    },
    {
      name: "Ủng hộ người nghèo",
      description: "Quỹ từ thiện tự nguyện",
      isMandatory: false,
      unitPrice: 0,
      isActive: true,
      fromDate: new Date("2025-02-01"),
      toDate: new Date("2025-12-31"),
    },
    {
      name: "Phí chiếu sáng công cộng",
      description: "Duy trì hệ thống điện chiếu sáng",
      isMandatory: true,
      unitPrice: 25000,
      isActive: true,
      fromDate: new Date("2025-01-01"),
      toDate: new Date("2025-12-31"),
    },
  ];


  const feeTypes = [];
  for (let fee of feeTypesData) {
    const newFee = await prisma.feeType.create({ data: fee });
    feeTypes.push(newFee);
  }

  const households = [household1, household2, household3, household4, household5];

  const possibleAmounts = [20000, 30000, 50000, 100000];
  const notes = [
    "Đã thu đủ",
    "Thu một phần",
    "Đóng góp tự nguyện",
    "Thu trực tiếp",
    "Chuyển khoản",
  ];

  for (let i = 0; i < 20; i++) {
    const fee = feeTypes[Math.floor(Math.random() * feeTypes.length)];
    const hh = households[Math.floor(Math.random() * households.length)];

    const amount =
      fee.unitPrice && fee.unitPrice > 0
        ? fee.unitPrice
        : possibleAmounts[Math.floor(Math.random() * possibleAmounts.length)];

    await prisma.feeRecord.create({
      data: {
        description: notes[Math.floor(Math.random() * notes.length)],
        fundAmount: amount,
        status: 2,
        isActive: true,
        householdId: hh.id,
        feeTypeId: fee.id,
        managerId: head.id, 
      },
    });
  }


  console.log(
    "Seeded successfully (users, households, residents, fees, records)!"
  );

}

main()
  .catch((e) => console.error(e))
  .finally(async () => prisma.$disconnect());
