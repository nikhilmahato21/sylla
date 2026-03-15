import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  PORT: z.string().default("3001"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_FILE_SIZE: z.string().default("10485760"),
}).superRefine((env, ctx) => {
  if (!env.GEMINI_API_KEY && !env.GOOGLE_AI_API_KEY && !env.GOOGLE_API_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "One of GEMINI_API_KEY, GOOGLE_AI_API_KEY, or GOOGLE_API_KEY is required",
      path: ["GEMINI_API_KEY"],
    });
  }
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    result.error.errors.forEach((e) => {
      console.error(`  • ${e.path.join(".")}: ${e.message}`);
    });
    process.exit(1);
  }
  console.log("✅ Environment validated");
  return result.data;
}
