import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const examSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(2).max(150),
  durationMinutes: z.number().int().min(1).max(480),
  windowStart: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid start time."),
  windowEnd: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid end time."),
  questionIds: z.array(z.string().uuid()).min(1).max(100),
  randomizeQuestions: z.boolean().default(true),
}).superRefine((exam, context) => {
  const windowStart = new Date(exam.windowStart);
  const windowEnd = new Date(exam.windowEnd);

  if (windowEnd <= windowStart) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["windowEnd"], message: "End time must be after start time." });
  }

  if (windowStart <= new Date()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["windowStart"], message: "Start time must be in the future." });
  }

  if (new Set(exam.questionIds).size !== exam.questionIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["questionIds"], message: "Questions cannot be selected more than once." });
  }
});

async function getLecturerId() {
  const session = await getServerSession(authOptions);

  return session?.user?.role === "LECTURER" ? session.user.id : null;
}

export async function GET() {
  const lecturerId = await getLecturerId();

  if (!lecturerId) {
    return NextResponse.json({ error: "You are not authorized to view exams." }, { status: 403 });
  }

  const [courses, questionBanks, exams] = await Promise.all([
    prisma.course.findMany({
      where: { lecturerId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.questionBank.findMany({
      where: { course: { lecturerId } },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        courseId: true,
        questions: { orderBy: { prompt: "asc" }, select: { id: true, prompt: true, type: true, points: true } },
      },
    }),
    prisma.exam.findMany({
      where: { course: { lecturerId } },
      orderBy: { windowStart: "asc" },
      select: {
        id: true,
        title: true,
        durationMinutes: true,
        windowStart: true,
        windowEnd: true,
        status: true,
        course: { select: { name: true } },
        _count: { select: { questions: true } },
      },
    }),
  ]);

  return NextResponse.json({ data: { courses, questionBanks, exams } });
}

export async function POST(request: Request) {
  const lecturerId = await getLecturerId();

  if (!lecturerId) {
    return NextResponse.json({ error: "You are not authorized to create exams." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = examSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid future exam window and select at least one question." }, { status: 400 });
  }

  const course = await prisma.course.findFirst({
    where: { id: parsed.data.courseId, lecturerId },
    select: { id: true },
  });

  if (!course) {
    return NextResponse.json({ error: "You can only use courses assigned to you." }, { status: 403 });
  }

  const ownedQuestions = await prisma.question.findMany({
    where: {
      id: { in: parsed.data.questionIds },
      questionBank: { courseId: course.id },
    },
    select: { id: true },
  });

  if (ownedQuestions.length !== parsed.data.questionIds.length) {
    return NextResponse.json({ error: "Every selected question must belong to the chosen course." }, { status: 403 });
  }

  const exam = await prisma.exam.create({
    data: {
      courseId: course.id,
      title: parsed.data.title,
      durationMinutes: parsed.data.durationMinutes,
      windowStart: new Date(parsed.data.windowStart),
      windowEnd: new Date(parsed.data.windowEnd),
      randomizeQuestions: parsed.data.randomizeQuestions,
      status: "DRAFT",
      questions: {
        create: parsed.data.questionIds.map((questionId, index) => ({ questionId, orderIndex: index })),
      },
    },
    select: { id: true, title: true, status: true, courseId: true, windowStart: true, windowEnd: true, durationMinutes: true },
  });

  return NextResponse.json({ data: exam }, { status: 201 });
}