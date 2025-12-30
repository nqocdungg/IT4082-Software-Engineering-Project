import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: "Vui lòng nhập tiêu đề và nội dung." });
    }
    const notificationType = type || "ANNOUNCEMENT";

    const recipients = await prisma.user.findMany({
      where: {
        role: "HOUSEHOLD",
        isActive: true,
      },
      select: { id: true },
    });

    if (recipients.length === 0) {
      return res.status(400).json({ message: "Không tìm thấy cư dân nào để gửi thông báo." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newNotification = await tx.notification.create({
        data: {
          title,
          message,
          type: notificationType,
          createdAt: new Date(),
        },
      });

      const recipientData = recipients.map((user) => ({
        userId: user.id,
        notificationId: newNotification.id,
        isRead: false,
      }));

      const batchResult = await tx.notificationRecipient.createMany({
        data: recipientData,
      });

      return { notification: newNotification, count: batchResult.count };
    });

    return res.status(201).json({
      message: "Gửi thông báo thành công.",
      data: result.notification,
      totalRecipients: result.count,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi gửi thông báo." });
  }
};

export const getSentNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        type: { in: ["ANNOUNCEMENT", "WARNING", "EVENT"] } 
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { recipients: true },
        },
      },
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching sent notifications:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id);

    await prisma.$transaction(async (tx) => {
      await tx.notificationRecipient.deleteMany({
        where: { notificationId },
      });

      await tx.notification.delete({
        where: { id: notificationId },
      });
    });

    res.json({ message: "Đã xóa thông báo thành công." });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Không thể xóa thông báo này." });
  }
};