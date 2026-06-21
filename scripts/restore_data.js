const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync("data_dump.json", "utf-8"));

  console.log("Restoring Categories...");
  for (const cat of data.categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      create: cat,
      update: cat,
    });
  }

  console.log("Restoring Products...");
  // Bulk inserting products to speed it up
  const BATCH_SIZE = 500;
  for (let i = 0; i < data.products.length; i += BATCH_SIZE) {
    const batch = data.products.slice(i, i + BATCH_SIZE);
    await prisma.product.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  console.log("Restoring Quotations...");
  for (const q of data.quotations) {
    // Dates need to be parsed
    if (q.quotationDate) q.quotationDate = new Date(q.quotationDate);
    if (q.createdAt) q.createdAt = new Date(q.createdAt);
    await prisma.quotation.upsert({
      where: { id: q.id },
      create: q,
      update: q,
    });
  }

  console.log("Restoring Quotation Items...");
  for (const item of data.quotationItems) {
    await prisma.quotationItem.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
  }

  // Reset Postgres sequences
  try {
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Category"', 'id'), coalesce(max(id),0) + 1, false) FROM "Category";`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Product"', 'id'), coalesce(max(id),0) + 1, false) FROM "Product";`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Quotation"', 'id'), coalesce(max(id),0) + 1, false) FROM "Quotation";`);
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"QuotationItem"', 'id'), coalesce(max(id),0) + 1, false) FROM "QuotationItem";`);
    console.log("Sequences updated successfully.");
  } catch (e) {
    console.warn("Could not reset sequences (ignore if you are not using Postgres yet):", e.message);
  }

  console.log("Data restore complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
