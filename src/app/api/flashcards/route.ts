import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });
  if (!dbUser) {
    return NextResponse.json({ cards: [] });
  }

  const cards = await prisma.flashcard.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ cards });
}
