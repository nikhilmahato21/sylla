import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { redis } from "../lib/redis";

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const key = `notifications:${req.userId}`;
    const raw = await redis.lrange(key, 0, 19); // last 20
    const notifications = raw.map((n) => {
      try { return JSON.parse(n); } catch { return null; }
    }).filter(Boolean);
    res.json(notifications);
  } catch {
    res.json([]);
  }
});

notificationsRouter.delete("/clear", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await redis.del(`notifications:${req.userId}`);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});
