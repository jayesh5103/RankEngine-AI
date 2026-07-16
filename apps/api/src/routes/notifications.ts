import { Router, Request, Response } from 'express';
import requireAuth from '../middleware/requireAuth';
import { Notification } from '../models/Notification';

const router = Router();

/**
 * GET /api/notifications
 * Returns current user's notifications, most recent first, plus unread count.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ userId, read: false }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('[Notifications] GET /api/notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read. Only the owning user may mark their own.
 */
router.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (err) {
    console.error('[Notifications] PATCH error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
