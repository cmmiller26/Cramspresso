import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params;

  const { userId: clerkId } = getAuth(req);
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
