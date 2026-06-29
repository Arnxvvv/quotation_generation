import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  const { id } = await params;
  await prisma.quotation.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
