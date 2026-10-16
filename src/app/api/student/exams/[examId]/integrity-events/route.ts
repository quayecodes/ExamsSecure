import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const eventSchema = z.object({
  eventType: z.enum(["TAB_SWITCH", "FOCUS_LOSS", "TIME_OUT"]),
});

export async function POST(request: Request, { params }: { params: { examId: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "You are not authorized to log this event." }, { status: 403 });
  }

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid integrity event." }, { status: 400 });
  }

  const attempt = await prisma.examAttempt.findUnique({
    where: { examId_studentId: { examId: params.examId, studentId: session.user.id } },
    select: { id: true, status: true },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Exam attempt not found." }, { status: 404 });
  }

  if (attempt.status !== "IN_PROGRESS" && parsed.data.eventType !== "TIME_OUT") {
    return NextResponse.json({ error: "Integrity events can only be logged during an active attempt." }, { status: 409 });
  }

  const event = await prisma.integrityEvent.create({
    data: { attemptId: attempt.id, eventType: parsed.data.eventType, occurredAt: new Date() },
    select: { id: true, eventType: true, occurredAt: true },
  });

  return NextResponse.json({ data: event }, { status: 201 });
}