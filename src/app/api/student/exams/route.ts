import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "You are not authorized to view assigned exams." }, { status: 403 });
  }

  const assignments = await prisma.examAssignment.findMany({
    where: { studentId: session.user.id },
    orderBy: { exam: { windowStart: "asc" } },
    select: {
      assignedAt: true,
      exam: {
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
      },
    },
  });

  return NextResponse.json({ data: assignments });
}