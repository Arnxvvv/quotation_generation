import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
  await prisma.quotation.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
