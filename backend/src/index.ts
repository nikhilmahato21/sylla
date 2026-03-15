import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import path from "path";



import { validateEnv } from "./lib/env";
validateEnv();

import { authRouter } from "./routes/auth";
import { subjectsRouter } from "./routes/subjects";
import { topicsRouter } from "./routes/topics";
import { sessionsRouter } from "./routes/sessions";
import { aiRouter } from "./routes/ai";
import { plansRouter } from "./routes/plans";
import { remindersRouter } from "./routes/reminders";
import { paymentsRouter } from "./routes/payments";
import { dashboardRouter } from "./routes/dashboard";
import { profileRouter } from "./routes/profile";
import { notificationsRouter } from "./routes/notifications";
import { errorHandler } from "./middleware/errorHandler";
import { authLimiter, apiLimiter, aiLimiter } from "./middleware/rateLimiter";
import { startReminderWorker } from "./services/reminderWorker";

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rate limiting
app.use("/api/auth", authLimiter);
app.use("/api/ai", aiLimiter);
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/auth", profileRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/topics", topicsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/plans", plansRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/notifications", notificationsRouter);

// Health check
app.get("/health", (_, res) => res.json({
  status: "ok",
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV,
}));

// 404
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// Error handler (must be last)
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Sylla backend running`);
  console.log(`   Port : ${PORT}`);
  console.log(`   Env  : ${process.env.NODE_ENV}`);
  console.log(`   URL  : http://localhost:${PORT}\n`);
  startReminderWorker();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => process.exit(0));
});

export default app;
