import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { examId: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "LECTURER") {
    return NextResponse.json({ error: "You are not authorized to view these results." }, { status: 403 });
  }

  const exam = await prisma.exam.findFirst({
    where: { id: params.examId, course: { lecturerId: session.user.id } },
    select: {
      id: true,
      title: true,
      course: { select: { name: true } },
      attempts: {
        orderBy: { submittedAt: "asc" },
        select: {
          id: true,
          score: true,
          status: true,
          submittedAt: true,
          student: { select: { fullName: true, email: true } },
          _count: { select: { integrityEvents: true } },
        },
      },
    },
  });

  if (!exam) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  return NextResponse.json({ data: exam });
}