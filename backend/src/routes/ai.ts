import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { authenticate, AuthRequest } from "../middleware/auth";
import { parseSyllabusPDF, generateStudyPlan, getTopicRecommendations, chatWithAI } from "../services/ai";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

export const aiRouter = Router();
aiRouter.use(authenticate);

// Configure multer
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760") },
  fileFilter: (_, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

// Extract text from PDF using pdfjs-dist
async function extractPdfText(filePath: string): Promise<{ text: string; numPages: number }> {
  // The legacy build stays Node-safe while still letting us use `getDocument` directly.
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const fileBuffer = fs.readFileSync(filePath);
  const data = new Uint8Array(fileBuffer);

  const doc = await getDocument({
    data,
    disableWorker: true,
    standardFontDataUrl: path.join(
      path.dirname(require.resolve("pdfjs-dist/package.json")),
      "standard_fonts/"
    ),
    useSystemFonts: true,
    verbosity: 0,
  } as any).promise;

  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }

  return { text, numPages: doc.numPages };
}

// Parse syllabus PDF
aiRouter.post("/parse-syllabus", upload.single("pdf"), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No PDF file uploaded" });
    return;
  }

  const { subjectId } = req.body;
  if (!subjectId) {
    res.status(400).json({ error: "subjectId is required" });
    return;
  }

  // Check Gemini API key is configured before doing any work
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_AI_API_KEY && !process.env.GOOGLE_API_KEY) {
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "AI service not configured. Add GEMINI_API_KEY to your .env file." });
    return;
  }

  try {
    const { text, numPages } = await extractPdfText(req.file.path);

    if (!text.trim()) {
      res.status(400).json({ error: "Could not extract text from PDF. Make sure it is not a scanned image." });
      return;
    }

    const parsed = await parseSyllabusPDF(text);

    // Save syllabus URL reference on the subject
    await prisma.subject.update({
      where: { id: subjectId, userId: req.userId },
      data: { syllabusUrl: `/uploads/${req.file.filename}` },
    });

    res.json({
      ...parsed,
      filename: req.file.filename,
      pageCount: numPages,
    });
  } catch (err: any) {
    console.error("PDF parse error:", err);

    // Clean up uploaded file on failure
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Return a meaningful error instead of generic 500
    if (err?.status === 400 && err?.message?.includes("API key")) {
      res.status(500).json({
        error: "Invalid Gemini API key. Get one free at https://aistudio.google.com/apikey and add it to your .env as GEMINI_API_KEY",
      });
      return;
    }

    res.status(500).json({ error: err?.message || "Failed to parse syllabus" });
  }
});

// Generate study plan
aiRouter.post("/study-plan", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { availableHoursPerDay, examDate, preferences } = req.body;

    const subjects = await prisma.subject.findMany({
      where: { userId: req.userId },
      include: { topics: { select: { status: true } } },
    });

    const subjectData = subjects.map((s) => ({
      name: s.name,
      completion: s.topics.length
        ? Math.round((s.topics.filter((t) => t.status === "DONE").length / s.topics.length) * 100)
        : 0,
      examDate: s.examDate?.toISOString(),
      topicCount: s.topics.length,
    }));

    const plan = await generateStudyPlan({
      subjects: subjectData,
      availableHoursPerDay: availableHoursPerDay || 4,
      examDate,
      preferences,
    });

    const saved = await prisma.studyPlan.create({
      data: {
        userId: req.userId!,
        title: `AI Study Plan - ${new Date().toLocaleDateString()}`,
        content: plan as any,
        aiGenerated: true,
      },
    });

    res.json({ ...plan, id: saved.id });
  } catch {
    res.status(500).json({ error: "Failed to generate study plan" });
  }
});

// Topic recommendations
aiRouter.get("/recommendations/:subjectId", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectId } = z.object({ subjectId: z.string() }).parse(req.params);
    const cacheKey = `recommendations:${req.userId}:${subjectId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: req.userId },
      include: { topics: true },
    });

    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    const recs = await getTopicRecommendations({
      subject: subject.name,
      completedTopics: subject.topics.filter((t) => t.status === "DONE").map((t) => t.name),
      pendingTopics: subject.topics.filter((t) => t.status !== "DONE").map((t) => t.name),
      examDate: subject.examDate?.toISOString(),
    });

    await redis.setex(cacheKey, 3600, JSON.stringify(recs));
    res.json(recs);
  } catch {
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

// AI chat
aiRouter.post("/chat", async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const subjects = await prisma.subject.findMany({
      where: { userId: req.userId },
      select: { name: true },
    });

    const reply = await chatWithAI(message, {
      subjects: subjects.map((s) => s.name),
    });

    res.json({ reply });
  } catch {
    res.status(500).json({ error: "AI chat failed" });
  }
});


// Duplicate router and routes removed to avoid redeclaration of `aiRouter`.
