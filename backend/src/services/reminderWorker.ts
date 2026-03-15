import cron from "node-cron";
import { redis } from "../lib/redis";
import { prisma } from "../lib/prisma";

export function startReminderWorker() {
  // Check every minute for due reminders
  cron.schedule("* * * * *", async () => {
    try {
      const now = Date.now();

      // Get all reminders scheduled up to now
      const due = await redis.zrangebyscore("reminders:scheduled", 0, now);

      if (due.length === 0) return;

      for (const item of due) {
        try {
          const reminder = JSON.parse(item);

          // Mark as sent in DB
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { sent: true },
          });

          // In production: send push notification, email, etc.
          console.log(`📬 Reminder sent: [${reminder.userId}] ${reminder.title}`);

          // Store in a notifications list for the user to see
          await redis.lpush(
            `notifications:${reminder.userId}`,
            JSON.stringify({
              id: reminder.id,
              title: reminder.title,
              message: reminder.message,
              sentAt: new Date().toISOString(),
            })
          );
          await redis.ltrim(`notifications:${reminder.userId}`, 0, 49); // Keep last 50
        } catch (err) {
          console.error("Failed to process reminder:", err);
        }
      }

      // Remove processed reminders
      await redis.zremrangebyscore("reminders:scheduled", 0, now);
    } catch (err) {
      console.error("Reminder worker error:", err);
    }
  });

  console.log("⏰ Reminder worker started");
}
