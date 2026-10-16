import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const submissionSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    selectedOptionId: z.string().uuid().optional(),
    answerText: z.string().trim().max(2000).optional(),
  })).max(100),
});

async function getStudentId() {
  const session = await getServerSession(authOptions);

  return session?.user?.role === "STUDENT" ? session.user.id : null;
}

export async function POST(
  request: Request,
  { params }: { params: { examId: string } },
) {
  const studentId = await getStudentId();

  if (!studentId) {
    return NextResponse.json({ error: "You are not authorized to submit this exam." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = submissionSchema.safeParse(body);

  if (!parsed.success || new Set(parsed.data.answers.map((answer) => answer.questionId)).size !== parsed.data.answers.length) {
    return NextResponse.json({ error: "Enter valid, non-duplicate answers." }, { status: 400 });
  }

  const attempt = await prisma.examAttempt.findUnique({
    where: { examId_studentId: { examId: params.examId, studentId } },
    include: {
      exam: {
        select: {
          durationMinutes: true,
          windowEnd: true,
          questions: {
            select: {
              questionId: true,
              question: {
                select: {
                  id: true,
                  type: true,
                  points: true,
                  correctAnswer: true,
                  options: { select: { id: true, isCorrect: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Start this exam before submitting answers." }, { status: 409 });
  }

  if (attempt.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "This exam attempt has already been submitted." }, { status: 409 });
  }

  const questions = new Map(attempt.exam.questions.map((examQuestion) => [examQuestion.questionId, examQuestion.question]));

  if (parsed.data.answers.some((answer) => !questions.has(answer.questionId))) {
    return NextResponse.json({ error: "Every answer must belong to this exam." }, { status: 400 });
  }

  const now = new Date();
  const deadline = new Date(Math.min(
    attempt.startedAt.getTime() + attempt.exam.durationMinutes * 60 * 1000,
    attempt.exam.windowEnd.getTime(),
  ));
  const status = now > deadline ? "AUTO_SUBMITTED" : "SUBMITTED";
  let score = 0;

  const responses = parsed.data.answers.map((answer) => {
    const question = questions.get(answer.questionId)!;
    const selectedOption = answer.selectedOptionId
      ? question.options.find((option) => option.id === answer.selectedOptionId)
      : undefined;
    const isCorrect = question.type === "MCQ"
      ? Boolean(selectedOption?.isCorrect)
      : question.type === "TRUE_FALSE" && answer.answerText?.toUpperCase() === question.correctAnswer?.toUpperCase();
    const pointsAwarded = isCorrect ? question.points : 0;
    score += pointsAwarded;

    return {
      attemptId: attempt.id,
      questionId: question.id,
      selectedOptionId: selectedOption?.id,
      answerText: answer.answerText,
      isCorrect,
      pointsAwarded,
    };
  });

  const submittedAt = now;
  await prisma.$transaction(async (transaction) => {
    await transaction.answerResponse.createMany({ data: responses });
    await transaction.examAttempt.update({
      where: { id: attempt.id },
      data: { status, submittedAt, score },
    });
  });

  return NextResponse.json({ data: { status, score, submittedAt } }, { status: 200 });
}