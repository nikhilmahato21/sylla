import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export interface AuthRequest extends Request {
  userId?: string;
  userPlan?: string;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, plan: true },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.userId = user.id;
    req.userPlan = user.plan;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requirePro(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userPlan !== "PRO") {
    res.status(403).json({ error: "This feature requires a Pro plan", upgrade: true });
    return;
  }
  next();
}
