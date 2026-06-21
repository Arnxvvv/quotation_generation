import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req) {
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  }
  const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
  if (existing) {
    return NextResponse.json({ error: "Category already exists." }, { status: 400 });
  }
  const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.category.create({
    data: { name: name.trim(), sortOrder: (maxSort._max.sortOrder ?? -1) + 1 },
  });
  return NextResponse.json(category, { status: 201 });
}

export async function DELETE(req) {
  const { id } = await req.json();
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${productCount} product(s) still in this category. Remove them first.` },
      { status: 400 }
    );
  }
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
