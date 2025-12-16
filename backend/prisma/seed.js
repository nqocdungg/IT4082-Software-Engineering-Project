import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // =========================
  // CLEAR DATA (đúng thứ tự FK)
  // =========================
  await prisma.feeRecord.deleteMany().catch(() => {})
  await prisma.feeType.deleteMany().catch(() => {})
  await prisma.temporaryResidence.deleteMany().catch(() => {})
  await prisma.residentChange.deleteMany().catch(() => {})

  await prisma.household.updateMany({ data: { ownerId: null } }).catch(() => {})

  await prisma.resident.deleteMany().catch(() => {})
  await prisma.household.deleteMany().catch(() => {})
  await prisma.user.deleteMany().catch(() => {})

  // =========================
  // USERS
  // =========================
  const headUser = await prisma.user.create({
    data: {
      username: "to_truong",
      password: await bcrypt.hash("totruong@123", 8),
      fullname: "Nguyễn Văn A",
      phone: "0912345678",
      role: "HEAD",
      isActive: true,
    },
  })

  const deputyUser = await prisma.user.create({
    data: {
      username: "to_pho",
      password: await bcrypt.hash("topho@123", 8),
      fullname: "Nguyễn Thị B",
      phone: "0987654321",
      role: "DEPUTY",
      isActive: true,
    },
  })

  const accountantUser = await prisma.user.create({
    data: {
      username: "ke_toan",
      password: await bcrypt.hash("ketoan@123", 8),
      fullname: "Lê Thị C",
      phone: "0909090909",
      role: "ACCOUNTANT",
      isActive: true,
    },
  })

  // =========================
  // HOUSEHOLDS (8 hộ - TDP 7 La Khê)  -> Tổng thường trú: 42
  // =========================
  const householdSeed = [
    {
      address: "Số 12 ngõ 34 TDP 7 phường La Khê quận Hà Đông Hà Nội",
      registrationDate: new Date(2012, 0, 10),
      status: 0,
      nbrOfResident: 6,
    },
    {
      address: "Số 18 ngõ 90 TDP 7 phường La Khê quận Hà Đông Hà Nội",
      registrationDate: new Date(2014, 5, 2),
      status: 0,
      nbrOfResident: 6,
    },
    {
      address: "Số 25 ngõ 16 TDP 7 phường La Khê quận Hà Đông Hà Nội",
      registrationDate: new Date(2011, 2, 20),
      status: 0,
      nbrOfResident: 5,
    },
    {
      address: "Số 41 ngõ 102 TDP 7 phường La Khê quận Hà Đông Hà Nội",
      registrationDate: new Date(2016, 8, 12),
      status: 0,
      nbrOfResident: 5,
    },
    {
      address: "Số 56 ngõ 12 TDP 7 phường La Khê quận Hà Đông Hà Nội",
      registrationDate: new Date(2010, 10, 5),
      status: 0,
      nbrOfResident: 5,
    },
    {
      address: "Số 73 ngõ 45 TDP 7 phường La Khê quận Hà Đông Hà Nội",
      registrationDate: new Date(2018, 3, 18),
      status: 0,
      nbrOfResident: 5,
    },
    {
      address: "Số 88 ngõ 8 TDP 7 phường La Khê quận Hà Đông Hà Nội",
      registrationDate: new Date(2013, 6, 7),
      status: 0,
      nbrOfResident: 5,
    },
    {
      address: "Số 101 ngõ 67 TDP 7 phường La Khê quận Hà Đông Hà Nội",
      registrationDate: new Date(2015, 9, 30),
      status: 0,
      nbrOfResident: 5,
    },
  ]

  const households = []
  for (const hh of householdSeed) {
    households.push(await prisma.household.create({ data: hh }))
  }

  // =========================
  // RESIDENTS (thường trú) - nhập tay theo từng hộ
  // Tổng: 42 (trong đó 1 newborn CCCD null)
  // =========================
  const perHouseResidents = [
    // HH1: 6
    [
      { cccd: "001203001001", fullname: "Nguyễn Văn Hùng", dob: new Date(1978, 4, 12), gender: "M", relation: "HEAD" },
      { cccd: "001203001002", fullname: "Trần Thị Lan", dob: new Date(1980, 8, 3), gender: "F", relation: "WIFE" },
      { cccd: "001203001003", fullname: "Nguyễn Văn Đức", dob: new Date(2004, 1, 21), gender: "M", relation: "SON" },
      { cccd: "001203001004", fullname: "Nguyễn Thị Mai", dob: new Date(2008, 6, 9), gender: "F", relation: "DAUGHTER" },
      { cccd: "001203001005", fullname: "Nguyễn Văn Bình", dob: new Date(1950, 3, 2), gender: "M", relation: "FATHER" },
      { cccd: "001203001006", fullname: "Phạm Thị Hòa", dob: new Date(1953, 10, 28), gender: "F", relation: "MOTHER" },
    ],
    // HH2: 6
    [
      { cccd: "001203001007", fullname: "Đặng Văn Thắng", dob: new Date(1972, 7, 14), gender: "M", relation: "HEAD" },
      { cccd: "001203001008", fullname: "Nguyễn Thị Lệ", dob: new Date(1975, 11, 1), gender: "F", relation: "WIFE" },
      { cccd: "001203001009", fullname: "Đặng Văn Nam", dob: new Date(1998, 9, 22), gender: "M", relation: "SON" },
      { cccd: "001203001010", fullname: "Đặng Thị Hạnh", dob: new Date(2003, 2, 5), gender: "F", relation: "DAUGHTER" },
      { cccd: "001203001011", fullname: "Đỗ Văn Khang", dob: new Date(1946, 0, 18), gender: "M", relation: "FATHER" },
      { cccd: "001203001012", fullname: "Đỗ Thị Tâm", dob: new Date(1949, 9, 7), gender: "F", relation: "MOTHER" },
    ],
    // HH3: 5
    [
      { cccd: "001203001013", fullname: "Vũ Văn Phúc", dob: new Date(1984, 6, 30), gender: "M", relation: "HEAD" },
      { cccd: "001203001014", fullname: "Ngô Thị Thu", dob: new Date(1987, 1, 11), gender: "F", relation: "WIFE" },
      { cccd: "001203001015", fullname: "Vũ Văn Minh", dob: new Date(2010, 4, 16), gender: "M", relation: "SON" },
      { cccd: "001203001016", fullname: "Vũ Thị Ngọc", dob: new Date(2013, 8, 25), gender: "F", relation: "DAUGHTER" },
      { cccd: "001203001017", fullname: "Ngô Văn Hào", dob: new Date(1962, 3, 8), gender: "M", relation: "FATHER" },
    ],
    // HH4: 5
    [
      { cccd: "001203001018", fullname: "Phạm Văn Sơn", dob: new Date(1970, 10, 19), gender: "M", relation: "HEAD" },
      { cccd: "001203001019", fullname: "Lê Thị Vân", dob: new Date(1972, 5, 6), gender: "F", relation: "WIFE" },
      { cccd: "001203001020", fullname: "Phạm Văn Khôi", dob: new Date(1996, 7, 2), gender: "M", relation: "SON" },
      { cccd: "001203001021", fullname: "Phạm Thị Huyền", dob: new Date(2001, 11, 23), gender: "F", relation: "DAUGHTER" },
      { cccd: "001203001022", fullname: "Lê Văn Cường", dob: new Date(1945, 2, 12), gender: "M", relation: "FATHER" },
    ],
    // HH5: 5
    [
      { cccd: "001203001023", fullname: "Nguyễn Văn Trí", dob: new Date(1981, 8, 9), gender: "M", relation: "HEAD" },
      { cccd: "001203001024", fullname: "Hoàng Thị Yến", dob: new Date(1984, 6, 1), gender: "F", relation: "WIFE" },
      { cccd: "001203001025", fullname: "Nguyễn Văn Tùng", dob: new Date(2007, 9, 10), gender: "M", relation: "SON" },
      { cccd: "001203001026", fullname: "Nguyễn Thị Linh", dob: new Date(2012, 0, 17), gender: "F", relation: "DAUGHTER" },
      { cccd: "001203001027", fullname: "Hoàng Văn Hợi", dob: new Date(1959, 6, 29), gender: "M", relation: "FATHER" },
    ],
    // HH6: 5
    [
      { cccd: "001203001028", fullname: "Trần Văn Khánh", dob: new Date(1976, 3, 27), gender: "M", relation: "HEAD" },
      { cccd: "001203001029", fullname: "Đinh Thị Hường", dob: new Date(1978, 9, 15), gender: "F", relation: "WIFE" },
      { cccd: "001203001030", fullname: "Trần Thị Ngân", dob: new Date(2006, 6, 20), gender: "F", relation: "DAUGHTER" },
      { cccd: "001203001031", fullname: "Trần Văn Duy", dob: new Date(2011, 3, 4), gender: "M", relation: "SON" },
      { cccd: "001203001032", fullname: "Đinh Văn Lộc", dob: new Date(1952, 11, 31), gender: "M", relation: "FATHER" },
    ],
    // HH7: 5
    [
      { cccd: "001203001033", fullname: "Lê Văn Quang", dob: new Date(1968, 1, 5), gender: "M", relation: "HEAD" },
      { cccd: "001203001034", fullname: "Phan Thị Hảo", dob: new Date(1970, 7, 8), gender: "F", relation: "WIFE" },
      { cccd: "001203001035", fullname: "Lê Thị Phương", dob: new Date(1994, 10, 12), gender: "F", relation: "DAUGHTER" },
      { cccd: "001203001036", fullname: "Lê Văn Hiếu", dob: new Date(1999, 9, 3), gender: "M", relation: "SON" },
      { cccd: "001203001037", fullname: "Phan Văn Đạt", dob: new Date(1942, 6, 19), gender: "M", relation: "FATHER" },
    ],
    // HH8: 5 (có 1 newborn CCCD null)
    [
      { cccd: "001203001038", fullname: "Bùi Văn Long", dob: new Date(1988, 2, 14), gender: "M", relation: "HEAD" },
      { cccd: "001203001039", fullname: "Nguyễn Thị Hồng", dob: new Date(1990, 9, 26), gender: "F", relation: "WIFE" },
      { cccd: "001203001040", fullname: "Bùi Văn An", dob: new Date(2014, 8, 7), gender: "M", relation: "SON" },
      { cccd: "001203001041", fullname: "Bùi Thị Thảo", dob: new Date(2018, 4, 12), gender: "F", relation: "DAUGHTER" },
      { cccd: null,            fullname: "Bùi Minh Khang", dob: new Date(2025, 1, 10), gender: "M", relation: "SON" },
    ],
  ]

  const createdResidentsByCCCD = new Map() // cccd -> resident
  const allPermanentResidents = []

  for (let i = 0; i < households.length; i++) {
    const hh = households[i]
    const list = perHouseResidents[i]

    for (const r of list) {
      const created = await prisma.resident.create({
        data: {
          residentCCCD: r.cccd,
          fullname: r.fullname,
          dob: r.dob,
          gender: r.gender,
          relationToOwner: r.relation,
          householdId: hh.id,
        },
      })

      allPermanentResidents.push(created)
      if (r.cccd) createdResidentsByCCCD.set(r.cccd, created)

      if (r.relation === "HEAD") {
        await prisma.household.update({
          where: { id: hh.id },
          data: { ownerId: created.id },
        })
      }
    }
  }

  // =========================
  // TEMP RESIDENTS (8 người tạm trú, householdId = null)
  // =========================
  const tempSeed = [
    { cccd: "002203002001", fullname: "Trần Thị Hương", dob: new Date(2003, 9, 2), gender: "F", from: new Date(2024, 7, 1),  to: null, status: 0, address: "Phòng 201 - Nhà trọ ngõ 34 TDP 7 La Khê Hà Đông" },
    { cccd: "002203002002", fullname: "Phạm Văn Dũng", dob: new Date(2002, 3, 18), gender: "M", from: new Date(2024, 8, 15), to: null, status: 0, address: "Phòng 305 - Nhà trọ ngõ 90 TDP 7 La Khê Hà Đông" },
    { cccd: "002203002003", fullname: "Ngô Thị Minh", dob: new Date(2004, 0, 25), gender: "F", from: new Date(2024, 6, 20), to: null, status: 0, address: "Phòng 102 - Nhà trọ ngõ 16 TDP 7 La Khê Hà Đông" },
    { cccd: "002203002004", fullname: "Lê Văn Hải", dob: new Date(2001, 11, 9), gender: "M", from: new Date(2024, 9, 1),  to: null, status: 0, address: "Phòng 406 - Nhà trọ ngõ 45 TDP 7 La Khê Hà Đông" },
    { cccd: "002203002005", fullname: "Đỗ Thị Trang", dob: new Date(2000, 5, 14), gender: "F", from: new Date(2024, 5, 5),  to: new Date(2025, 2, 1), status: 1, address: "Phòng 103 - Nhà trọ ngõ 12 TDP 7 La Khê Hà Đông" },
    { cccd: "002203002006", fullname: "Bùi Văn Tuấn", dob: new Date(1999, 8, 30), gender: "M", from: new Date(2024, 4, 10), to: new Date(2025, 0, 20), status: 1, address: "Phòng 202 - Nhà trọ ngõ 102 TDP 7 La Khê Hà Đông" },
    { cccd: "002203002007", fullname: "Hoàng Thị Ly", dob: new Date(2005, 2, 6), gender: "F", from: new Date(2024, 10, 12),to: null, status: 0, address: "KTX khu vực La Khê - Hà Đông" },
    { cccd: "002203002008", fullname: "Nguyễn Văn Phong", dob: new Date(2003, 6, 22), gender: "M", from: new Date(2024, 7, 28), to: null, status: 0, address: "Phòng 401 - Nhà trọ ngõ 67 TDP 7 La Khê Hà Đông" },
  ]

  const tempResidents = []
  for (const t of tempSeed) {
    const r = await prisma.resident.create({
      data: {
        residentCCCD: t.cccd,
        fullname: t.fullname,
        dob: t.dob,
        gender: t.gender,
        relationToOwner: "TEMP",
        householdId: null,
      },
    })
    tempResidents.push({ resident: r, tmp: t })

    await prisma.temporaryResidence.create({
      data: {
        residentId: r.id,
        address: t.address,
        fromDate: t.from,
        toDate: t.to,
        status: t.status, // 0 active, 1 ended
      },
    })
  }

  // =========================
  // RESIDENT CHANGES (đầy đủ thông tin)
  // =========================

  // 1) Birth (newborn HH8)
  const newborn = allPermanentResidents.find(x => x.residentCCCD === null && x.fullname === "Bùi Minh Khang")
  await prisma.residentChange.create({
    data: {
      residentId: newborn.id,
      changeType: 0,
      fromAddress: households[7].address,
      toAddress: households[7].address,
      fromDate: newborn.dob,
      toDate: newborn.dob,
      reason: "Khai sinh, nhập nhân khẩu theo hộ",
      approvalStatus: 1,
      managerId: deputyUser.id,
    },
  })

  // 2) Temp residence changes cho 8 người tạm trú
  for (const tr of tempResidents) {
    await prisma.residentChange.create({
      data: {
        residentId: tr.resident.id,
        changeType: 1,
        fromAddress: "Ngoài địa bàn (hộ khẩu gốc)",
        toAddress: tr.tmp.address,
        fromDate: tr.tmp.from,
        toDate: tr.tmp.to ?? null,
        reason: "Đăng ký tạm trú để học tập/làm việc",
        approvalStatus: 1,
        managerId: deputyUser.id,
      },
    })
  }

  // 3) Temp absence (tạm vắng) - chọn 2 người thường trú
  const rAbs1 = createdResidentsByCCCD.get("001203001003") // Nguyễn Văn Đức (HH1)
  const rAbs2 = createdResidentsByCCCD.get("001203001020") // Phạm Văn Khôi (HH4)
  await prisma.residentChange.create({
    data: {
      residentId: rAbs1.id,
      changeType: 2,
      fromAddress: households[0].address,
      toAddress: "TP Hồ Chí Minh",
      fromDate: new Date(2025, 0, 5),
      toDate: new Date(2025, 1, 25),
      reason: "Thực tập ngắn hạn",
      approvalStatus: 1,
      managerId: deputyUser.id,
    },
  })
  await prisma.residentChange.create({
    data: {
      residentId: rAbs2.id,
      changeType: 2,
      fromAddress: households[3].address,
      toAddress: "Đà Nẵng",
      fromDate: new Date(2024, 11, 20),
      toDate: new Date(2025, 0, 10),
      reason: "Đi công tác",
      approvalStatus: 1,
      managerId: headUser.id,
    },
  })

  // 4) Move out - 1 người thường trú chuyển đi
  const rMoveOut = createdResidentsByCCCD.get("001203001035") // Lê Thị Phương (HH7)
  await prisma.residentChange.create({
    data: {
      residentId: rMoveOut.id,
      changeType: 4,
      fromAddress: households[6].address,
      toAddress: "Phường Mộ Lao, quận Hà Đông, Hà Nội",
      fromDate: new Date(2024, 9, 1),
      toDate: new Date(2024, 9, 1),
      reason: "Chuyển nơi ở theo công việc",
      approvalStatus: 1,
      managerId: headUser.id,
    },
  })

  // 5) Death - 1 người thường trú
  const rDeath = createdResidentsByCCCD.get("001203001012") // Đỗ Thị Tâm (HH2)
  await prisma.residentChange.create({
    data: {
      residentId: rDeath.id,
      changeType: 8,
      fromAddress: households[1].address,
      toAddress: households[1].address,
      fromDate: new Date(2023, 7, 12),
      toDate: new Date(2023, 7, 12),
      reason: "Qua đời do tuổi cao",
      approvalStatus: 1,
      managerId: headUser.id,
    },
  })

  // =========================
  // FEE TYPES (đầy đủ)
  // =========================
  const feeType1 = await prisma.feeType.create({
    data: {
      name: "Phí vệ sinh môi trường",
      description: "Thu theo hộ, hàng tháng",
      isMandatory: true,
      unitPrice: 30000,
      isActive: true,
      fromDate: new Date(2025, 0, 1),
      toDate: null,
    },
  })

  const feeType2 = await prisma.feeType.create({
    data: {
      name: "Phí an ninh trật tự",
      description: "Thu theo hộ, hàng tháng",
      isMandatory: true,
      unitPrice: 20000,
      isActive: true,
      fromDate: new Date(2025, 0, 1),
      toDate: null,
    },
  })

  const feeType3 = await prisma.feeType.create({
    data: {
      name: "Ủng hộ quỹ khuyến học",
      description: "Tự nguyện, thu theo đợt",
      isMandatory: false,
      unitPrice: null,
      isActive: true,
      fromDate: new Date(2025, 2, 1),
      toDate: new Date(2025, 2, 31),
    },
  })

  // =========================
  // FEE RECORDS (mỗi hộ 2 khoản bắt buộc tháng 03/2025 + 1 khoản khuyến học (một số hộ))
  // =========================
  const mandatoryMonth = "Thu tháng 03/2025"

  for (const hh of households) {
    await prisma.feeRecord.create({
      data: {
        amount: 30000,
        status: 2, // paid
        description: mandatoryMonth,
        householdId: hh.id,
        feeTypeId: feeType1.id,
        managerId: accountantUser.id,
      },
    })

    await prisma.feeRecord.create({
      data: {
        amount: 20000,
        status: 2, // paid
        description: mandatoryMonth,
        householdId: hh.id,
        feeTypeId: feeType2.id,
        managerId: accountantUser.id,
      },
    })
  }

  // 4 hộ đóng khuyến học
  const donateMap = [
    { householdIndex: 0, amount: 100000 },
    { householdIndex: 2, amount: 50000 },
    { householdIndex: 5, amount: 200000 },
    { householdIndex: 7, amount: 100000 },
  ]
  for (const d of donateMap) {
    await prisma.feeRecord.create({
      data: {
        amount: d.amount,
        status: 2,
        description: "Ủng hộ quỹ khuyến học đợt 03/2025",
        householdId: households[d.householdIndex].id,
        feeTypeId: feeType3.id,
        managerId: deputyUser.id,
      },
    })
  }

  // =========================
  // FINAL CHECK
  // =========================
  const totalResidents = await prisma.resident.count()
  const totalHouseholds = await prisma.household.count()
  const totalTemp = await prisma.temporaryResidence.count()

  console.log("Seeded TDP 7 La Khê (manual, non-random) successfully!")
  console.log({ totalHouseholds, totalResidents, totalTemp })
}

main()
  .catch((err) => console.error(err))
  .finally(async () => prisma.$disconnect())
