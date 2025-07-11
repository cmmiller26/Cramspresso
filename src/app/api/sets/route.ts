import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sets = await prisma.flashcardSet.findMany({
    where: { userId: user.id },
    include: { _count: { select: { cards: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sets);
}

export async function POST(req: NextRequest) {
  // 1. Input validation FIRST
  const { name, cards } = await req.json();
  if (typeof name !== "string" || !name.trim())
    return NextResponse.json({ error: "Invalid set name" }, { status: 400 });
  if (!Array.isArray(cards) || cards.length === 0)
    return NextResponse.json({ error: "Invalid cards data" }, { status: 400 });
  for (let index = 0; index < cards.length; index++) {
    const card = cards[index];
    if (
      typeof card?.question !== "string" ||
      typeof card?.answer !== "string"
    ) {
      return NextResponse.json(
        { error: `Invalid card format at index ${index}` },
        { status: 400 }
      );
    }
  }

  // 2. Then auth check
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const newSet = await prisma.flashcardSet.create({
      data: {
        name: name.trim(),
        user: { connectOrCreate: { where: { clerkId }, create: { clerkId } } },
        cards: {
          create: Array.isArray(cards)
            ? cards.map((c: { question: string; answer: string }) => ({ ...c }))
            : [],
        },
      },
      include: { cards: true },
    });
    return NextResponse.json(newSet, { status: 201 });
  } catch (err) {
    console.error("Error creating set:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}
