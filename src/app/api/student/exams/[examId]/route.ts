import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getStudentId() {
  const session = await getServerSession(authOptions);

  return session?.user?.role === "STUDENT" ? session.user.id : null;
}

async function getAssignedExam(examId: string, studentId: string) {
  return prisma.examAssignment.findFirst({
    where: { examId, studentId },
    select: {
      exam: {
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          windowStart: true,
          windowEnd: true,
          status: true,
          course: { select: { name: true } },
          questions: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              orderIndex: true,
              question: {
                select: {
                  id: true,
                  type: true,
                  prompt: true,
                  points: true,
                  options: { select: { id: true, optionText: true }, orderBy: { optionText: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: { examId: string } },
) {
  const studentId = await getStudentId();

  if (!studentId) {
    return NextResponse.json({ error: "You are not authorized to view this exam." }, { status: 403 });
  }

  const assignment = await getAssignedExam(params.examId, studentId);

  if (!assignment) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  const attempt = await prisma.examAttempt.findUnique({
    where: { examId_studentId: { examId: params.examId, studentId } },
    select: { id: true, startedAt: true, submittedAt: true, status: true },
  });

  return NextResponse.json({ data: { exam: assignment.exam, attempt } });
}

export async function POST(
  _request: Request,
  { params }: { params: { examId: string } },
) {
  const studentId = await getStudentId();

  if (!studentId) {
    return NextResponse.json({ error: "You are not authorized to start this exam." }, { status: 403 });
  }

  const assignment = await getAssignedExam(params.examId, studentId);

  if (!assignment) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  const now = new Date();
  const exam = assignment.exam;

  if (!["SCHEDULED", "ACTIVE"].includes(exam.status) || now < exam.windowStart || now > exam.windowEnd) {
    return NextResponse.json({ error: "This exam is not currently available." }, { status: 409 });
  }

  const existingAttempt = await prisma.examAttempt.findUnique({
    where: { examId_studentId: { examId: exam.id, studentId } },
    select: { id: true },
  });

  if (existingAttempt) {
    return NextResponse.json({ error: "You have already started this exam." }, { status: 409 });
  }

  try {
    const attempt = await prisma.examAttempt.create({
      data: { examId: exam.id, studentId, startedAt: now },
      select: { id: true, startedAt: true, status: true },
    });

    return NextResponse.json({ data: { attempt, exam } }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "You have already started this exam." }, { status: 409 });
    }

    throw error;
  }
}