import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const plansRouter = Router();
plansRouter.use(authenticate);

plansRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plans = await prisma.studyPlan.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(plans);
  } catch {
    res.status(500).json({ error: "Failed to fetch study plans" });
  }
});

plansRouter.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plan = await prisma.studyPlan.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }
    res.json(plan);
  } catch {
    res.status(500).json({ error: "Failed to fetch plan" });
  }
});

plansRouter.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.studyPlan.delete({ where: { id: req.params.id, userId: req.userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete plan" });
  }
});
