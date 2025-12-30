import cron from 'node-cron';
import prisma from '../../prisma/prismaClient.js';

const checkAndRemindFees = async () => {
  console.log('⏰ [CRON] Đang quét công nợ để nhắc nhở...');

  try {
    const activeMandatoryFees = await prisma.feeType.findMany({
      where: {
        isMandatory: true,
        isActive: true,
      },
    });

    if (activeMandatoryFees.length === 0) return;

    const households = await prisma.household.findMany({
      where: { status: 1 },
      include: {
        residents: { select: { status: true } },
        account: true
      }
    });

    for (const hh of households) {
      if (!hh.account) continue;

      const memberCount = hh.residents.filter(r => r.status === 0 || r.status === 1).length;
      if (memberCount === 0) continue;

      for (const fee of activeMandatoryFees) {
        const unitPrice = fee.unitPrice || 0;
        const expected = unitPrice * memberCount;
        
        const paidAgg = await prisma.feeRecord.aggregate({
          where: {
            householdId: hh.id,
            feeTypeId: fee.id,
            status: { in: [1, 2] }
          },
          _sum: { amount: true }
        });
        const paid = paidAgg._sum.amount || 0;

        if (expected > paid) {
          const remaining = expected - paid;

          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

          const existingNoti = await prisma.notification.findFirst({
            where: {
              type: 'FEE_REMINDER',
              relatedId: fee.id,
              createdAt: { gt: threeDaysAgo },
              recipients: { some: { userId: hh.account.id } }
            }
          });

          if (!existingNoti) {
            const noti = await prisma.notification.create({
              data: {
                title: `⚠️ Nhắc nhở đóng phí: ${fee.name}`,
                message: `Gia đình bạn chưa hoàn thành khoản phí "${fee.name}". Số tiền còn thiếu: ${remaining.toLocaleString('vi-VN')} VNĐ. Vui lòng thanh toán sớm.`,
                type: 'FEE_REMINDER',
                relatedId: fee.id,
                recipients: {
                  create: [{ userId: hh.account.id }]
                }
              }
            });
            console.log(`   -> Đã nhắc hộ ${hh.householdCode} nợ phí ${fee.name}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Lỗi checkAndRemindFees:', error);
  }
};

const checkBirthdays = async () => {
  console.log('🎂 [CRON] Đang quét sinh nhật hôm nay...');
  try {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;

    const residents = await prisma.resident.findMany({
      where: { status: 0 },
      include: { household: { include: { account: true } } }
    });

    const birthdayFolks = residents.filter(r => {
      const dob = new Date(r.dob);
      return dob.getDate() === currentDay && dob.getMonth() + 1 === currentMonth;
    });

    for (const person of birthdayFolks) {
      const userAccount = person.household?.account;
      if (userAccount) {
        const startOfDay = new Date(today.setHours(0,0,0,0));
        const existed = await prisma.notification.findFirst({
            where: {
                type: 'EVENT',
                message: { contains: person.fullname },
                createdAt: { gte: startOfDay },
                recipients: { some: { userId: userAccount.id } }
            }
        });

        if (!existed) {
            const noti = await prisma.notification.create({
            data: {
                title: '🎂 Chúc mừng sinh nhật!',
                message: `Ban quản lý xin gửi lời chúc mừng sinh nhật nồng nhiệt nhất tới thành viên ${person.fullname}. Chúc bạn tuổi mới nhiều sức khỏe và niềm vui!`,
                type: 'EVENT',
            }
            });
            await prisma.notificationRecipient.create({
            data: { userId: userAccount.id, notificationId: noti.id }
            });
        }
      }
    }
  } catch (error) {
    console.error('Lỗi checkBirthdays:', error);
  }
};

const checkPublicHolidays = async () => {
  console.log('🎉 [CRON] Kiểm tra ngày lễ...');
  try {
    const today = new Date();
    const dateKey = `${today.getDate()}/${today.getMonth() + 1}`;
    
    const holidays = {
        '1/1': { title: '🎉 Chúc Mừng Năm Mới', msg: 'Ban quản lý kính chúc toàn thể cư dân một năm mới An Khang - Thịnh Vượng!' },
        '30/4': { title: '🇻🇳 Chào mừng ngày Thống nhất', msg: 'Chào mừng kỷ niệm ngày Giải phóng miền Nam, thống nhất đất nước 30/4.' },
        '1/5': { title: '🛠️ Ngày Quốc tế Lao động', msg: 'Chúc cư dân có kỳ nghỉ lễ 1/5 vui vẻ bên gia đình.' },
        '2/9': { title: '🇻🇳 Chúc mừng Quốc Khánh', msg: 'Tự hào chào mừng ngày Quốc Khánh nước CHXHCN Việt Nam 2/9.' },
        '1/6': { title: '👶 Ngày Quốc tế Thiếu nhi', msg: 'Chúc các bé thiếu nhi trong khu dân cư luôn chăm ngoan, học giỏi!' }
    };

    const holiday = holidays[dateKey];

    if (holiday) {
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const alreadySent = await prisma.notification.findFirst({
        where: {
            title: holiday.title,
            createdAt: { gte: startOfDay }
        }
      });

      if (!alreadySent) {
        const noti = await prisma.notification.create({
            data: {
            title: holiday.title,
            message: holiday.msg,
            type: 'EVENT',
            }
        });

        const allUsers = await prisma.user.findMany({
            where: { role: 'HOUSEHOLD', isActive: true },
            select: { id: true }
        });

        const recipients = allUsers.map(user => ({
            userId: user.id,
            notificationId: noti.id
        }));

        if (recipients.length > 0) {
            await prisma.notificationRecipient.createMany({ data: recipients });
            console.log(`   -> Đã gửi thông báo lễ "${holiday.title}" tới ${recipients.length} hộ.`);
        }
      }
    }
  } catch (error) {
    console.error('Lỗi checkPublicHolidays:', error);
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