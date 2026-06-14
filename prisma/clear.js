const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Delete all products first (foreign key constraint)
  const deletedProducts = await prisma.product.deleteMany({});
  console.log(`Deleted ${deletedProducts.count} products.`);

  // Delete all categories
  const deletedCategories = await prisma.category.deleteMany({});
  console.log(`Deleted ${deletedCategories.count} categories.`);

  console.log("Database cleared.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
