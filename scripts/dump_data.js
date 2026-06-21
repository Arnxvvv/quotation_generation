const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  const products = await prisma.product.findMany();
  const quotations = await prisma.quotation.findMany();
  const quotationItems = await prisma.quotationItem.findMany();

  const data = {
    categories,
    products,
    quotations,
    quotationItems,
  };

  fs.writeFileSync("data_dump.json", JSON.stringify(data, null, 2));
  console.log(`Dumped ${categories.length} categories, ${products.length} products, ${quotations.length} quotations, and ${quotationItems.length} quotation items to data_dump.json`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
