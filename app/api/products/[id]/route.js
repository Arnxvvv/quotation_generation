import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  const body = await req.json();
  if (!body.name?.trim() || !body.categoryId) {
    return NextResponse.json({ error: "Name and category are required." }, { status: 400 });
  }
  const product = await prisma.product.update({
    where: { id: Number(params.id) },
    data: {
      name: body.name.trim(),
      categoryId: Number(body.categoryId),
      brand: body.brand?.trim() || null,
      specs: body.specs?.trim() || null,
      notes: body.notes?.trim() || null,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(req, { params }) {
  await prisma.product.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
