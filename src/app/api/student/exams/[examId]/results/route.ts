import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { examId: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "You are not authorized to view this result." }, { status: 403 });
  }

  const assignment = await prisma.examAssignment.findUnique({
    where: { examId_studentId: { examId: params.examId, studentId: session.user.id } },
    select: { exam: { select: { id: true, title: true, course: { select: { name: true } } } } },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  const attempt = await prisma.examAttempt.findUnique({
    where: { examId_studentId: { examId: params.examId, studentId: session.user.id } },
    select: { score: true, status: true, submittedAt: true },
  });

  if (!attempt || attempt.status === "IN_PROGRESS") {
    return NextResponse.json({ error: "Your result is not available yet." }, { status: 409 });
  }

  return NextResponse.json({ data: { exam: assignment.exam, result: attempt } });
}