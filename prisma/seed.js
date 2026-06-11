const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CATEGORIES = [
  "CPU",
  "CPU Cooler",
  "Motherboard",
  "RAM",
  "Storage",
  "Graphics Card",
  "Power Supply",
  "Case",
  "Monitor",
  "Keyboard",
  "Mouse",
  "Accessories",
  "Other Components",
];

const SAMPLE_PRODUCTS = [
  { category: "CPU", name: "Ryzen 5 7600", brand: "AMD" },
  { category: "CPU", name: "Ryzen 7 7700X", brand: "AMD" },
  { category: "CPU", name: "Intel i5 14600K", brand: "Intel" },
  { category: "Graphics Card", name: "RTX 4060", brand: "NVIDIA" },
  { category: "Graphics Card", name: "RTX 4070", brand: "NVIDIA" },
  { category: "Graphics Card", name: "RX 7800 XT", brand: "AMD" },
];

async function main() {
  for (let i = 0; i < CATEGORIES.length; i++) {
    await prisma.category.upsert({
      where: { name: CATEGORIES[i] },
      update: { sortOrder: i },
      create: { name: CATEGORIES[i], sortOrder: i },
    });
  }

  for (const p of SAMPLE_PRODUCTS) {
    const category = await prisma.category.findUnique({ where: { name: p.category } });
    const existing = await prisma.product.findFirst({
      where: { name: p.name, categoryId: category.id },
    });
    if (!existing) {
      await prisma.product.create({
        data: { name: p.name, brand: p.brand, categoryId: category.id },
      });
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
