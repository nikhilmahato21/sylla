import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const topicsRouter = Router();
topicsRouter.use(authenticate);

const topicSchema = z.object({
  subjectId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "REVISION"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  order: z.number().int().optional(),
});

topicsRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectId, status } = z
      .object({
        subjectId: z.string(),
        status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "REVISION"]).optional(),
      })
      .parse(req.query);

    const topics = await prisma.topic.findMany({
      where: {
        subjectId,
        subject: { userId: req.userId },
        ...(status ? { status } : {}),
      },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    res.json(topics);
  } catch {
    res.status(500).json({ error: "Failed to fetch topics" });
  }
});

topicsRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = topicSchema.parse(req.body);

    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, userId: req.userId },
    });
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    const topic = await prisma.topic.create({ data });
    res.status(201).json(topic);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to create topic" });
  }
});

topicsRouter.patch("/:id/status", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const { status } = z
      .object({ status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "REVISION"]) })
      .parse(req.body);

    const topic = await prisma.topic.update({
      where: { id },
      data: { status },
    });
    res.json(topic);
  } catch {
    res.status(500).json({ error: "Failed to update topic status" });
  }
});

topicsRouter.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const data = topicSchema.partial().omit({ subjectId: true }).parse(req.body);
    const topic = await prisma.topic.update({
      where: { id },
      data,
    });
    res.json(topic);
  } catch {
    res.status(500).json({ error: "Failed to update topic" });
  }
});

topicsRouter.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    await prisma.topic.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete topic" });
  }
});

// Bulk create topics (from AI parsing)
topicsRouter.post("/bulk", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectId, topics } = z
      .object({
        subjectId: z.string(),
        topics: z.array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            estimatedMinutes: z.number().optional(),
            priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
            order: z.number().optional(),
          })
        ),
      })
      .parse(req.body);

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: req.userId },
    });
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    await prisma.topic.createMany({
      data: topics.map((t, i) => ({
        subjectId,
        name: t.name,
        description: t.description,
        estimatedMinutes: t.estimatedMinutes || 60,
        priority: t.priority || "MEDIUM",
        order: t.order ?? i,
      })),
    });

    const created = await prisma.topic.findMany({ where: { subjectId } });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: "Failed to bulk create topics" });
  }
});
