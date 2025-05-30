import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: NextRequest,
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
    include: { cards: true },
  });
  if (!set)
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  return NextResponse.json(set);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params;

  const { name } = await req.json();
  if (typeof name !== "string" || name.trim() === "")
    return NextResponse.json({ error: "Invalid set name" }, { status: 400 });

  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    await prisma.flashcardSet.update({
      where: { id: setId, userId: user.id },
      data: { name },
    });
    return NextResponse.json({ message: "Set name updated successfully" });
  } catch (err) {
    console.error("Error updating set name:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
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

  try {
    await prisma.flashcardSet.delete({ where: { id: setId } });
    return NextResponse.json({ message: "Set deleted successfully" });
  } catch (err) {
    console.error("Error deleting set:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
