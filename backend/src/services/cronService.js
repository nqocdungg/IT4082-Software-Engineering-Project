import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const checkAndRemindFees = async () => {
  console.log('⏰ [CRON] Đang quét các khoản phí sắp hết hạn...');

  const today = new Date();
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);

  const startOfDay = new Date(threeDaysLater.setHours(0, 0, 0, 0));
  const endOfDay = new Date(threeDaysLater.setHours(23, 59, 59, 999));

  const feesDueSoon = await prisma.feeType.findMany({
    where: {
      isMandatory: true,
      toDate: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  for (const feeType of feesDueSoon) {
    const unpaidRecords = await prisma.feeRecord.findMany({
      where: {
        feeTypeId: feeType.id,
        status: 0
      },
      include: {
        household: {
          include: { account: true }
        }
      }
    });

    if (unpaidRecords.length > 0) {
      const notification = await prisma.notification.create({
        data: {
          title: `⚠️ Nhắc nhở đóng phí: ${feeType.name}`,
          message: `Khoản phí "${feeType.name}" sẽ hết hạn vào ngày ${feeType.toDate.toLocaleDateString('vi-VN')}. Vui lòng thanh toán sớm để tránh bị phạt.`,
          type: 'WARNING',
          createdAt: new Date()
        }
      });

      const recipients = unpaidRecords
        .filter(record => record.household.account)
        .map(record => ({
          userId: record.household.account.id,
          notificationId: notification.id,
          isRead: false
        }));

      if (recipients.length > 0) {
        await prisma.notificationRecipient.createMany({ data: recipients });
        console.log(`   -> Đã nhắc nhở ${recipients.length} hộ dân về phí ${feeType.name}`);
      }
    }
  }
};

const checkBirthdays = async () => {
  console.log('🎂 [CRON] Đang quét sinh nhật hôm nay...');

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;

  const residents = await prisma.resident.findMany({
    where: { status: 0 },
    include: {
      household: {
        include: { account: true }
      }
    }
  });

  const birthdayFolks = residents.filter(r => {
    const dob = new Date(r.dob);
    return dob.getDate() === currentDay && dob.getMonth() + 1 === currentMonth;
  });

  if (birthdayFolks.length === 0) return;

  for (const person of birthdayFolks) {
    const userAccount = person.household?.account;

    if (userAccount) {
      const noti = await prisma.notification.create({
        data: {
          title: '🎂 Chúc mừng sinh nhật!',
          message: `Ban quản lý xin gửi lời chúc mừng sinh nhật nồng nhiệt nhất tới thành viên ${person.fullname}. Chúc bạn tuổi mới nhiều sức khỏe và niềm vui!`,
          type: 'EVENT',
          createdAt: new Date()
        }
      });

      await prisma.notificationRecipient.create({
        data: {
          userId: userAccount.id,
          notificationId: noti.id,
          isRead: false
        }
      });
    }
  }

  console.log(`   -> Đã gửi lời chúc sinh nhật tới ${birthdayFolks.length} cư dân.`);
};

const checkPublicHolidays = async () => {
  console.log('🎉 [CRON] Kiểm tra ngày lễ...');

  const today = new Date();
  const dateKey = `${today.getDate()}/${today.getMonth() + 1}`;

  const holidays = {
    '1/1': {
      title: '🎉 Chúc Mừng Năm Mới',
      msg: 'Ban quản lý kính chúc toàn thể cư dân một năm mới An Khang - Thịnh Vượng!'
    },
    '30/4': {
      title: '🇻🇳 Chào mừng ngày Thống nhất',
      msg: 'Chào mừng kỷ niệm ngày Giải phóng miền Nam, thống nhất đất nước 30/4.'
    },
    '1/5': {
      title: '🛠️ Ngày Quốc tế Lao động',
      msg: 'Chúc cư dân có kỳ nghỉ lễ 1/5 vui vẻ bên gia đình.'
    },
    '2/9': {
      title: '🇻🇳 Chúc mừng Quốc Khánh',
      msg: 'Tự hào chào mừng ngày Quốc Khánh nước CHXHCN Việt Nam 2/9.'
    },
    '1/6': {
      title: '👶 Ngày Quốc tế Thiếu nhi',
      msg: 'Chúc các bé thiếu nhi trong khu dân cư luôn chăm ngoan, học giỏi!'
    }
  };

  const holiday = holidays[dateKey];

  if (holiday) {
    const noti = await prisma.notification.create({
      data: {
        title: holiday.title,
        message: holiday.msg,
        type: 'EVENT',
        createdAt: new Date()
      }
    });

    const allUsers = await prisma.user.findMany({
      where: { role: 'HOUSEHOLD', isActive: true },
      select: { id: true }
    });

    const recipients = allUsers.map(user => ({
      userId: user.id,
      notificationId: noti.id,
      isRead: false
    }));

    if (recipients.length > 0) {
      await prisma.notificationRecipient.createMany({ data: recipients });
      console.log(`   -> Đã gửi thông báo lễ "${holiday.title}" tới ${recipients.length} hộ.`);
    }
  }
};

export const startCronJobs = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('--- BẮT ĐẦU CHẠY CRON JOBS ---');
    await checkAndRemindFees();
    await checkBirthdays();
    await checkPublicHolidays();
    console.log('--- KẾT THÚC CRON JOBS ---');
  });
};
