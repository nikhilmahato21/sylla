import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const [subjects, allTopics, sessions, reminders] = await Promise.all([
      prisma.subject.findMany({
        where: { userId },
        include: { topics: { select: { status: true } } },
      }),
      prisma.topic.findMany({
        where: { subject: { userId } },
        select: { id: true, status: true, name: true, subjectId: true, estimatedMinutes: true },
      }),
      prisma.studySession.findMany({
        where: { userId, startedAt: { gte: new Date(Date.now() - 7 * 86400000) } },
        select: { startedAt: true, durationMin: true },
      }),
      prisma.reminder.findMany({
        where: { userId, sent: false, scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
    ]);

    // Overall completion
    const totalTopics = allTopics.length;
    const doneTopics = allTopics.filter((t) => t.status === "DONE").length;
    const completion = totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0;

    // Weekly hours
    const weeklyMinutes = sessions.reduce((sum, s) => sum + s.durationMin, 0);

    // Subject progress
    const subjectProgress = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      examDate: s.examDate,
      totalTopics: s.topics.length,
      completedTopics: s.topics.filter((t) => t.status === "DONE").length,
      completion: s.topics.length
        ? Math.round((s.topics.filter((t) => t.status === "DONE").length / s.topics.length) * 100)
        : 0,
    }));

    // Upcoming exam
    const upcomingExam = subjects
      .filter((s) => s.examDate && s.examDate > new Date())
      .sort((a, b) => a.examDate!.getTime() - b.examDate!.getTime())[0];

    const examDaysLeft = upcomingExam
      ? Math.ceil((upcomingExam.examDate!.getTime() - Date.now()) / 86400000)
      : null;

    // Today's schedule - topics that are IN_PROGRESS or highest priority pending
    const todayTopics = allTopics
      .filter((t) => t.status === "IN_PROGRESS" || t.status === "PENDING")
      .slice(0, 4);

    res.json({
      completion,
      totalTopics,
      doneTopics,
      weeklyHours: Math.round((weeklyMinutes / 60) * 10) / 10,
      subjectProgress,
      upcomingExam: upcomingExam
        ? { name: upcomingExam.name, daysLeft: examDaysLeft, date: upcomingExam.examDate }
        : null,
      reminders,
      todayTopics,
      subjectCount: subjects.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});
