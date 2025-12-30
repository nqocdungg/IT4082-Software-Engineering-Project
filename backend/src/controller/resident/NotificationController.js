import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await prisma.notificationRecipient.findMany({
      where: {
        userId: userId
      },
      include: {
        notification: true
      },
      orderBy: {
        notification: {
          createdAt: "desc"
        }
      }
    });

    const formatted = notifications.map(item => ({
      id: item.notification.id,
      recipientId: item.id,
      title: item.notification.title,
      message: item.notification.message,
      type: item.notification.type,
      createdAt: item.notification.createdAt,
      isRead: item.isRead,
      readAt: item.readAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await prisma.notificationRecipient.updateMany({
      where: {
        userId: userId,
        notificationId: parseInt(id)
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to update read status" });
  }
};
