import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const quotations = await prisma.quotation.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(quotations);
}

export async function POST(req) {
  const { customer, items } = await req.json();


  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "At least one component is required." },
      { status: 400 }
    );
  }

  const year = new Date().getFullYear();
  const countThisYear = await prisma.quotation.count({
    where: { refNumber: { startsWith: `Q-${year}-` } },
  });
  const refNumber = `Q-${year}-${String(countThisYear + 1).padStart(4, "0")}`;

  const grandTotal = items.reduce(
    (sum, it) => sum + Number(it.unitPrice) * Number(it.quantity),
    0
  );

  const quotation = await prisma.quotation.create({
    data: {
      refNumber,
      customerName: customer?.name?.trim() || "",
      customerPhone: customer?.phone?.trim() || "",
      customerEmail: customer?.email?.trim() || null,
      quotationDate: new Date(customer?.date || Date.now()),
      grandTotal,
      items: {
        create: items.map((it) => ({
          productId: it.productId || null,
          productNameSnapshot: it.productName,
          categorySnapshot: it.categoryName,
          brandSnapshot: it.brand || null,
          unitPrice: Number(it.unitPrice),
          quantity: Number(it.quantity),
          lineTotal: Number(it.unitPrice) * Number(it.quantity),
        })),
      },
    },
  });

  return NextResponse.json(quotation, { status: 201 });
}
