import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ setId: string; cardId: string }> }
) {
  const { setId, cardId } = await params;

  const { question, answer } = await req.json();
  if (typeof question !== "string" || typeof answer !== "string")
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );

  try {
    const card = await prisma.flashcard.findUnique({
      where: { id: cardId, setId },
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
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}
