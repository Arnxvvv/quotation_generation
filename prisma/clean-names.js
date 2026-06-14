const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 1. Clean <NAME> tags from category names
  const categories = await prisma.category.findMany();
  let fixedCats = 0;
  for (const cat of categories) {
    let cleanName = cat.name
      .replace(/<NAME>/gi, "")
      .replace(/<\/NAME>/gi, "")
      .replace(/&amp;/g, "&")
      .replace(/&#\d+;\s*/g, "")  // remove HTML entities like &#4;
      .trim();

    if (cleanName !== cat.name) {
      // Check if a category with the clean name already exists
      const existing = await prisma.category.findUnique({ where: { name: cleanName } });
      if (existing && existing.id !== cat.id) {
        // Move products from this duplicate to the existing clean one
        await prisma.product.updateMany({
          where: { categoryId: cat.id },
          data: { categoryId: existing.id },
        });
        await prisma.category.delete({ where: { id: cat.id } });
        console.log(`  Merged "${cat.name}" → "${cleanName}" (moved products to existing)`);
      } else {
        await prisma.category.update({ where: { id: cat.id }, data: { name: cleanName } });
        console.log(`  Fixed: "${cat.name}" → "${cleanName}"`);
      }
      fixedCats++;
    }
  }
  console.log(`Fixed ${fixedCats} category names.\n`);

  // 2. Handle junk categories (empty string, "Primary", etc.)
  const junkNames = ["", "Primary"];
  for (const junk of junkNames) {
    const junkCat = await prisma.category.findUnique({ where: { name: junk } });
    if (junkCat) {
      const productCount = await prisma.product.count({ where: { categoryId: junkCat.id } });
      if (productCount > 0) {
        // Create or find "Other" category and move products there
        let otherCat = await prisma.category.findUnique({ where: { name: "Other" } });
        if (!otherCat) {
          otherCat = await prisma.category.create({ data: { name: "Other", sortOrder: 999 } });
        }
        await prisma.product.updateMany({
          where: { categoryId: junkCat.id },
          data: { categoryId: otherCat.id },
        });
        console.log(`Moved ${productCount} products from "${junk || '(empty)'}" → "Other"`);
      }
      await prisma.category.delete({ where: { id: junkCat.id } });
      console.log(`Deleted junk category: "${junk || '(empty)'}"`);
    }
  }

  // 3. Clean <NAME> and HTML entities from product names
  const products = await prisma.product.findMany();
  let fixedProds = 0;
  for (const p of products) {
    let cleanName = p.name
      .replace(/<NAME>/gi, "")
      .replace(/<\/NAME>/gi, "")
      .replace(/&amp;/g, "&")
      .replace(/&#\d+;\s*/g, "")
      .trim();

    if (cleanName !== p.name) {
      await prisma.product.update({ where: { id: p.id }, data: { name: cleanName } });
      fixedProds++;
    }
  }
  console.log(`Fixed ${fixedProds} product names.\n`);

  // 4. Remove empty categories (no products)
  const allCats = await prisma.category.findMany();
  let removed = 0;
  for (const cat of allCats) {
    const count = await prisma.product.count({ where: { categoryId: cat.id } });
    if (count === 0) {
      await prisma.category.delete({ where: { id: cat.id } });
      console.log(`  Removed empty category: "${cat.name}"`);
      removed++;
    }
  }
  console.log(`Removed ${removed} empty categories.\n`);

  // Final stats
  const catCount = await prisma.category.count();
  const prodCount = await prisma.product.count();
  console.log(`--- Done ---`);
  console.log(`Categories: ${catCount}`);
  console.log(`Products: ${prodCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
