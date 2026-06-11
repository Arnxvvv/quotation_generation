import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: [{ categoryId: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(products);
}

export async function POST(req) {
  const body = await req.json();
  if (!body.name?.trim() || !body.categoryId) {
    return NextResponse.json({ error: "Name and category are required." }, { status: 400 });
  }
  const product = await prisma.product.create({
    data: {
      name: body.name.trim(),
      categoryId: Number(body.categoryId),
      brand: body.brand?.trim() || null,
      specs: body.specs?.trim() || null,
      notes: body.notes?.trim() || null,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
