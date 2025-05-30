import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params;

  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const set = await prisma.flashcardSet.findFirst({
    where: { id: setId, userId: user.id },
  });
  if (!set)
    return NextResponse.json({ error: "Set not found" }, { status: 404 });

  const { cards } = await req.json();
  if (!Array.isArray(cards || cards.length === 0))
    return NextResponse.json({ error: "Invalid cards data" }, { status: 400 });

  try {
    const result = await prisma.flashcard.createMany({
      data: cards.map((card: { question: string; answer: string }) => ({
        ...card,
        setId,
      })),
      skipDuplicates: true,
    });
    return NextResponse.json({ inserted: result.count });
  } catch (err) {
    console.error("Error creating cards:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
