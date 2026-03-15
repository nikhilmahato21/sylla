import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { redis } from "../lib/redis";

export const remindersRouter = Router();
remindersRouter.use(authenticate);

const reminderSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1),
  scheduledAt: z.string().datetime(),
  type: z.enum(["STUDY", "REVISION", "EXAM"]).optional(),
});

remindersRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: req.userId },
      orderBy: { scheduledAt: "asc" },
    });
    res.json(reminders);
  } catch {
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

remindersRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = reminderSchema.parse(req.body);

    const reminder = await prisma.reminder.create({
      data: {
        userId: req.userId!,
        title: data.title,
        message: data.message,
        scheduledAt: new Date(data.scheduledAt),
        type: data.type || "STUDY",
      },
    });

    // Queue in Redis for worker
    const delay = new Date(data.scheduledAt).getTime() - Date.now();
    if (delay > 0) {
      await redis.zadd(
        "reminders:scheduled",
        new Date(data.scheduledAt).getTime(),
        JSON.stringify({ id: reminder.id, userId: req.userId, title: data.title, message: data.message })
      );
    }

    res.status(201).json(reminder);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to create reminder" });
  }
});

remindersRouter.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await prisma.reminder.delete({ where: { id, userId: req.userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});
