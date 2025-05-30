import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    create: { clerkId: clerkUser.id },
    update: {},
  });

  const { cards } = await req.json();
  const result = await prisma.flashcard.createMany({
    data: cards.map((card: { question: string; answer: string }) => ({
      ...card,
      userId: dbUser.id,
    })),
    skipDuplicates: true,
  });
  return NextResponse.json({ savedCount: result.count });
}
