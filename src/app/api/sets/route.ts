import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId: clerkId } = getAuth(req);
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
  const { userId: clerkId } = getAuth(req);
  if (!clerkId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { name, cards } = await req.json();
  if (typeof name !== "string" || !name.trim())
    return NextResponse.json({ error: "Invalid set name" }, { status: 400 });

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
