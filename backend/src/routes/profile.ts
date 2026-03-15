import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const profileRouter = Router();
profileRouter.use(authenticate);

// Update profile (name/email)
profileRouter.put("/profile", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = z
      .object({
        name: z.string().min(2).max(50).optional(),
        email: z.string().email().optional(),
      })
      .parse(req.body);

    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id: req.userId } },
      });
      if (existing) {
        res.status(400).json({ error: "Email already in use" });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, name: true, email: true, plan: true, avatarUrl: true },
    });

    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change password
profileRouter.put("/password", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash } });

    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Delete account
profileRouter.delete("/account", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete account" });
  }
});
