import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  institutionName: z.string().trim().min(2).max(150),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registrationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter valid registration details." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json({ error: "Unable to create this account." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction(async (transaction) => {
    const institution =
      (await transaction.institution.findFirst({
        where: { name: parsed.data.institutionName },
      })) ??
      (await transaction.institution.create({
        data: { name: parsed.data.institutionName },
      }));

    await transaction.user.create({
      data: {
        fullName: parsed.data.fullName,
        email,
        passwordHash,
        role: "STUDENT",
        institutionId: institution.id,
      },
    });
  });

  return NextResponse.json({ message: "Account created. You can now sign in." }, { status: 201 });
}