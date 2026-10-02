import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const questionBankSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
});

async function getLecturerSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "LECTURER") {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await getLecturerSession();

  if (!session) {
    return NextResponse.json({ error: "You are not authorized to view question banks." }, { status: 403 });
  }

  const [courses, questionBanks] = await Promise.all([
    prisma.course.findMany({
      where: { lecturerId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.questionBank.findMany({
      where: { course: { lecturerId: session.user.id } },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        course: { select: { id: true, name: true } },
        _count: { select: { questions: true } },
        questions: {
          orderBy: { prompt: "asc" },
          select: {
            id: true,
            type: true,
            prompt: true,
            points: true,
            correctAnswer: true,
            options: { select: { id: true, optionText: true, isCorrect: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ data: { courses, questionBanks } });
}

export async function POST(request: Request) {
  const session = await getLecturerSession();

  if (!session) {
    return NextResponse.json({ error: "You are not authorized to create question banks." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = questionBankSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid course and question bank title." }, { status: 400 });
  }

  const course = await prisma.course.findFirst({
    where: { id: parsed.data.courseId, lecturerId: session.user.id },
    select: { id: true },
  });

  if (!course) {
    return NextResponse.json({ error: "You can only use courses assigned to you." }, { status: 403 });
  }

  const questionBank = await prisma.questionBank.create({
    data: {
      title: parsed.data.title,
      courseId: course.id,
    },
    select: { id: true, title: true, courseId: true },
  });

  return NextResponse.json({ data: questionBank }, { status: 201 });
}