import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const sessionsRouter = Router();
sessionsRouter.use(authenticate);

sessionsRouter.post("/start", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { topicId } = z.object({ topicId: z.string() }).parse(req.body);

    const topic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        subject: { userId: req.userId },
      },
    });
    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    const activeSession = await prisma.studySession.findFirst({
      where: { userId: req.userId, endedAt: null },
      orderBy: { startedAt: "desc" },
    });
    if (activeSession) {
      res.status(409).json({ error: "An active study session is already running" });
      return;
    }

    const session = await prisma.studySession.create({
      data: {
        userId: req.userId!,
        topicId,
        startedAt: new Date(),
      },
    });

    // Update topic status
    await prisma.topic.update({
      where: { id: topicId },
      data: { status: "IN_PROGRESS" },
    });

    res.status(201).json(session);
  } catch {
    res.status(500).json({ error: "Failed to start session" });
  }
});

sessionsRouter.patch("/:id/end", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { notes } = z.object({ notes: z.string().optional() }).parse(req.body);

    const existing = await prisma.studySession.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    if (existing.endedAt) {
      res.status(409).json({ error: "Session already ended" });
      return;
    }

    const endedAt = new Date();
    const durationMin = Math.round(
      (endedAt.getTime() - existing.startedAt.getTime()) / 60000
    );

    const session = await prisma.studySession.update({
      where: { id },
      data: { endedAt, durationMin, notes },
    });

    res.json(session);
  } catch {
    res.status(500).json({ error: "Failed to end session" });
  }
});

sessionsRouter.get("/streak", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await prisma.studySession.findMany({
      where: { userId: req.userId, endedAt: { not: null } },
      orderBy: { endedAt: "desc" },
      select: { endedAt: true },
    });

    const dates = [
      ...new Set(
        sessions
          .map((s) => s.endedAt?.toISOString().split("T")[0])
          .filter((date): date is string => Boolean(date))
      ),
    ];

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      if (dates[i] === expected || (i === 0 && dates[0] === today)) {
        streak++;
      } else {
        break;
      }
    }

    res.json({ streak, dates });
  } catch {
    res.status(500).json({ error: "Failed to compute streak" });
  }
});

sessionsRouter.get("/weekly", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const sessions = await prisma.studySession.findMany({
      where: {
        userId: req.userId,
        startedAt: { gte: sevenDaysAgo },
        endedAt: { not: null },
      },
      select: { startedAt: true, durationMin: true },
    });

    const days: Record<string, number> = {};
    sessions.forEach((s) => {
      const day = s.startedAt.toLocaleDateString("en-US", { weekday: "short" });
      days[day] = (days[day] || 0) + s.durationMin;
    });

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const data = weekdays.map((d) => ({ day: d, minutes: days[d] || 0, hours: ((days[d] || 0) / 60).toFixed(1) }));
    const total = sessions.reduce((sum, s) => sum + s.durationMin, 0) / 60;

    res.json({ data, totalHours: Math.round(total * 10) / 10 });
  } catch {
    res.status(500).json({ error: "Failed to fetch weekly data" });
  }
});
