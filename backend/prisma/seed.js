import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // XÓA DỮ LIỆU THEO ĐÚNG THỨ TỰ QUAN HỆ
    await prisma.resident.deleteMany();
    await prisma.household.deleteMany();
    await prisma.user.deleteMany();

    // =========================
    // CREATE USERS (HEAD, DEPUTY)
    // =========================
    const hashedHead = await bcrypt.hash('totruong@123', 8);
    const hashedDeputy = await bcrypt.hash('topho@123', 8);

    const head = await prisma.user.create({
        data: {
            username: 'to_truong',
            password: hashedHead,
            fullname: 'Nguyễn Văn A',
            phone: '0912345678',
            role: 'HEAD',
        }
    });

    const deputy = await prisma.user.create({
        data: {
            username: 'to_pho',
            password: hashedDeputy,
            fullname: 'Nguyễn Thị B',
            phone: '0987654321',
            role: 'DEPUTY',
        }
    });

    // =========================
    // CREATE HOUSEHOLDS
    // =========================
    const household1 = await prisma.household.create({
        data: {
            address: "Số 12, ngõ 34, TDP 7, phường La Khê",
            registrationDate: new Date("2010-04-12"),
            nbrOfResident: 4,
            status: 0
        }
    });

    const household2 = await prisma.household.create({
        data: {
            address: "Số 45, ngõ 16, TDP 7, phường La Khê",
            registrationDate: new Date("2015-09-20"),
            nbrOfResident: 3,
            status: 0
        }
    });

    const household3 = await prisma.household.create({
        data: {
            address: "Số 89, tổ 7, phường La Khê",
            registrationDate: new Date("2018-06-11"),
            nbrOfResident: 2,
            status: 0
        }
    });

    const household4 = await prisma.household.create({
        data: {
            address: "Số 21B, ngõ 90, tổ dân phố 7, La Khê",
            registrationDate: new Date("2012-01-01"),
            nbrOfResident: 3,
            status: 0
        }
    });

    const household5 = await prisma.household.create({
        data: {
            address: "Số 102, tổ 7, phường La Khê",
            registrationDate: new Date("2020-02-15"),
            nbrOfResident: 3,
            status: 0
        }
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
            householdId: household1.id
        }
    });

    await prisma.resident.create({
        data: {
            residentCCCD: "001202001112",
            fullname: "Phạm Thị Hoa",
            dob: new Date("1974-09-21"),
            gender: "F",
            relationToOwner: "Vợ",
            status: 0,
            householdId: household1.id
        }
    });

    await prisma.resident.create({
        data: {
            residentCCCD: "001202001113",
            fullname: "Nguyễn Văn Nam",
            dob: new Date("2000-11-11"),
            gender: "M",
            relationToOwner: "Con trai",
            status: 1,
            householdId: household1.id
        }
    });

    await prisma.resident.create({
        data: {
            residentCCCD: "001202001114",
            fullname: "Nguyễn Thị Linh",
            dob: new Date("2005-01-01"),
            gender: "F",
            relationToOwner: "Con gái",
            status: 0,
            householdId: household1.id
        }
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
            householdId: household2.id
        }
    });

    await prisma.resident.create({
        data: {
            residentCCCD: "001202002222",
            fullname: "Nguyễn Thị Yến",
            dob: new Date("1984-04-25"),
            gender: "F",
            relationToOwner: "Vợ",
            status: 0,
            householdId: household2.id
        }
    });

    await prisma.resident.create({
        data: {
            residentCCCD: "001202002223",
            fullname: "Trần Minh Khang",
            dob: new Date("2012-08-12"),
            gender: "M",
            relationToOwner: "Con",
            status: 0,
            householdId: household2.id
        }
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
            householdId: household3.id
        }
    });

    await prisma.resident.create({
        data: {
            residentCCCD: "001202003332",
            fullname: "Lê Thị Hồng",
            dob: new Date("1958-02-22"),
            gender: "F",
            relationToOwner: "Vợ",
            status: 4,
            householdId: household3.id
        }
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
            householdId: household4.id
        }
    });

    await prisma.resident.create({
        data: {
            residentCCCD: "001202004442",
            fullname: "Hoàng Thu Trang",
            dob: new Date("1993-04-14"),
            gender: "F",
            relationToOwner: "Vợ",
            status: 0,
            householdId: household4.id
        }
    });

    await prisma.resident.create({
        data: {
            residentCCCD: "001202004443",
            fullname: "Phan Bảo Anh",
            dob: new Date("2020-10-10"),
            gender: "F",
            relationToOwner: "Con",
            status: 0,
            householdId: household4.id
        }
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
            householdId: household5.id
        }
    });

    await prisma.resident.create({
        data: {
            residentCCCD: "001202005552",
            fullname: "Đỗ Việt Anh",
            dob: new Date("2010-12-12"),
            gender: "M",
            relationToOwner: "Con",
            status: 2,
            householdId: household5.id
        }
    });

    await prisma.resident.create({
        data: {
            residentCCCD: "001202005553",
            fullname: "Đỗ Thu Hương",
            dob: new Date("1988-03-03"),
            gender: "F",
            relationToOwner: "Vợ",
            status: 0,
            householdId: household5.id
        }
    });

    // =========================
    // SET OWNER (THEO ID THẬT)
    // =========================
    await prisma.household.update({
        where: { id: household1.id },
        data: { ownerId: r1.id }
    });

    await prisma.household.update({
        where: { id: household2.id },
        data: { ownerId: r2.id }
    });

    await prisma.household.update({
        where: { id: household3.id },
        data: { ownerId: r3.id }
    });

    await prisma.household.update({
        where: { id: household4.id },
        data: { ownerId: r4.id }
    });

    await prisma.household.update({
        where: { id: household5.id },
        data: { ownerId: r5.id }
    });

    console.log("Seeded successfully!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => prisma.$disconnect());
