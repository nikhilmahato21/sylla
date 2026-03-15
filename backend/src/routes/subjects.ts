import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const subjectsRouter = Router();
subjectsRouter.use(authenticate);

const subjectSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().optional(),
  examDate: z.string().datetime().optional().nullable(),
});

subjectsRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { userId: req.userId },
      include: {
        topics: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const enriched = subjects.map((s) => ({
      ...s,
      totalTopics: s.topics.length,
      completedTopics: s.topics.filter((t) => t.status === "DONE").length,
      completion: s.topics.length
        ? Math.round((s.topics.filter((t) => t.status === "DONE").length / s.topics.length) * 100)
        : 0,
    }));

    res.json(enriched);
  } catch {
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

subjectsRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = subjectSchema.parse(req.body);
    const subject = await prisma.subject.create({
      data: {
        userId: req.userId!,
        name: data.name,
        color: data.color || "#22c55e",
        examDate: data.examDate ? new Date(data.examDate) : null,
      },
    });
    res.status(201).json(subject);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to create subject" });
  }
});

subjectsRouter.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = subjectSchema.partial().parse(req.body);
    const subject = await prisma.subject.update({
      where: { id: req.params.id, userId: req.userId },
      data: {
        ...data,
        examDate: data.examDate ? new Date(data.examDate) : undefined,
      },
    });
    res.json(subject);
  } catch {
    res.status(500).json({ error: "Failed to update subject" });
  }
});

subjectsRouter.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id, userId: req.userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete subject" });
  }
});
