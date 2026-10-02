import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const assignmentSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1).max(500),
});

async function getLecturerId() {
  const session = await getServerSession(authOptions);

  return session?.user?.role === "LECTURER" ? session.user.id : null;
}

async function getOwnedExam(examId: string, lecturerId: string) {
  return prisma.exam.findFirst({
    where: { id: examId, course: { lecturerId } },
    select: { id: true, course: { select: { institutionId: true } } },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: { examId: string } },
) {
  const lecturerId = await getLecturerId();

  if (!lecturerId) {
    return NextResponse.json({ error: "You are not authorized to manage assignments." }, { status: 403 });
  }

  const exam = await getOwnedExam(params.examId, lecturerId);

  if (!exam) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  const [students, assignments] = await Promise.all([
    prisma.user.findMany({
      where: { institutionId: exam.course.institutionId, role: "STUDENT" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, email: true },
    }),
    prisma.examAssignment.findMany({
      where: { examId: exam.id },
      select: { studentId: true },
    }),
  ]);

  return NextResponse.json({ data: { students, assignedStudentIds: assignments.map((assignment) => assignment.studentId) } });
}

export async function POST(
  request: Request,
  { params }: { params: { examId: string } },
) {
  const lecturerId = await getLecturerId();

  if (!lecturerId) {
    return NextResponse.json({ error: "You are not authorized to assign exams." }, { status: 403 });
  }

  const exam = await getOwnedExam(params.examId, lecturerId);

  if (!exam) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = assignmentSchema.safeParse(body);

  if (!parsed.success || new Set(parsed.data.studentIds).size !== parsed.data.studentIds.length) {
    return NextResponse.json({ error: "Select one or more unique students." }, { status: 400 });
  }

  const students = await prisma.user.findMany({
    where: {
      id: { in: parsed.data.studentIds },
      institutionId: exam.course.institutionId,
      role: "STUDENT",
    },
    select: { id: true },
  });

  if (students.length !== parsed.data.studentIds.length) {
    return NextResponse.json({ error: "Students must belong to this exam's institution." }, { status: 403 });
  }

  const result = await prisma.examAssignment.createMany({
    data: parsed.data.studentIds.map((studentId) => ({ examId: exam.id, studentId })),
    skipDuplicates: true,
  });

  return NextResponse.json({ data: { assignedCount: result.count } }, { status: 201 });
}