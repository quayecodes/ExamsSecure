import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const optionSchema = z.object({
  optionText: z.string().trim().min(1).max(200),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  type: z.enum(["MCQ", "TRUE_FALSE"]),
  prompt: z.string().trim().min(2).max(1000),
  points: z.number().int().min(1).max(100),
  correctAnswer: z.enum(["TRUE", "FALSE"]).optional(),
  options: z.array(optionSchema).max(6).optional(),
}).superRefine((question, context) => {
  if (question.type === "TRUE_FALSE" && !question.correctAnswer) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["correctAnswer"], message: "Select the correct answer." });
  }

  if (question.type === "MCQ") {
    if (!question.options || question.options.length < 2) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["options"], message: "Add at least two options." });
    } else if (question.options.filter((option) => option.isCorrect).length !== 1) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["options"], message: "Mark exactly one option as correct." });
    }
  }
});

async function getLecturerId() {
  const session = await getServerSession(authOptions);

  return session?.user?.role === "LECTURER" ? session.user.id : null;
}

async function getOwnedQuestionBank(questionBankId: string, lecturerId: string) {
  return prisma.questionBank.findFirst({
    where: { id: questionBankId, course: { lecturerId } },
    select: { id: true },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: { questionBankId: string } },
) {
  const lecturerId = await getLecturerId();

  if (!lecturerId) {
    return NextResponse.json({ error: "You are not authorized to view questions." }, { status: 403 });
  }

  const questionBank = await getOwnedQuestionBank(params.questionBankId, lecturerId);

  if (!questionBank) {
    return NextResponse.json({ error: "Question bank not found." }, { status: 404 });
  }

  const questions = await prisma.question.findMany({
    where: { questionBankId: questionBank.id },
    orderBy: { prompt: "asc" },
    select: {
      id: true,
      type: true,
      prompt: true,
      points: true,
      correctAnswer: true,
      options: { select: { id: true, optionText: true, isCorrect: true } },
    },
  });

  return NextResponse.json({ data: questions });
}

export async function POST(
  request: Request,
  { params }: { params: { questionBankId: string } },
) {
  const lecturerId = await getLecturerId();

  if (!lecturerId) {
    return NextResponse.json({ error: "You are not authorized to create questions." }, { status: 403 });
  }

  const questionBank = await getOwnedQuestionBank(params.questionBankId, lecturerId);

  if (!questionBank) {
    return NextResponse.json({ error: "Question bank not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = questionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter valid question details." }, { status: 400 });
  }

  const question = await prisma.question.create({
    data: {
      questionBankId: questionBank.id,
      type: parsed.data.type,
      prompt: parsed.data.prompt,
      points: parsed.data.points,
      correctAnswer: parsed.data.type === "TRUE_FALSE" ? parsed.data.correctAnswer : null,
      options: parsed.data.type === "MCQ" ? { create: parsed.data.options } : undefined,
    },
    select: {
      id: true,
      type: true,
      prompt: true,
      points: true,
      correctAnswer: true,
      options: { select: { id: true, optionText: true, isCorrect: true } },
    },
  });

  return NextResponse.json({ data: question }, { status: 201 });
}