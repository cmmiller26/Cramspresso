import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ setId: string; cardId: string }> }
) {
  const { setId, cardId } = await params;

  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { question, answer } = await req.json();
  if (typeof question !== "string" || typeof answer !== "string")
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );

  try {
    const card = await prisma.flashcard.findUnique({
      where: { id: cardId, set: { id: setId, userId: user.id } },
    });
    if (!card)
      return NextResponse.json({ error: "Card not found" }, { status: 404 });

    await prisma.flashcard.update({
      where: { id: cardId },
      data: { question, answer },
    });

    return NextResponse.json({ message: "Card updated successfully" });
  } catch (err) {
    console.error("Error updating card:", err);
    return NextResponse.json(
      { error: "Failed to update card in set" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ setId: string; cardId: string }> }
) {
  const { setId, cardId } = await params;

  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const card = await prisma.flashcard.findUnique({
      where: { id: cardId, set: { id: setId, userId: user.id } },
    });
    if (!card)
      return NextResponse.json({ error: "Card not found" }, { status: 404 });

    await prisma.flashcard.delete({ where: { id: cardId } });

    return NextResponse.json({ message: "Card deleted successfully" });
  } catch (err) {
    console.error("Error deleting card:", err);
    return NextResponse.json(
      { error: "Failed to delete card from set" },
      { status: 500 }
    );
  }
}
