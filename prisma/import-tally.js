const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const TALLY_URL = "http://localhost:9000";
const COMPANY = "21st (RINKI JAIN)";

// --- XML request builders ---

function stockGroupsXML() {
  return `<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>StockGroups</ID></HEADER>
  <BODY><DESC>
    <STATICVARIABLES><SVCURRENTCOMPANY>${COMPANY}</SVCURRENTCOMPANY></STATICVARIABLES>
    <TDL><TDLMESSAGE>
      <COLLECTION NAME="StockGroups" ISMODIFY="No">
        <TYPE>StockGroup</TYPE>
        <FETCH>NAME,PARENT</FETCH>
      </COLLECTION>
    </TDLMESSAGE></TDL>
  </DESC></BODY>
</ENVELOPE>`;
}

function stockItemsXML() {
  return `<ENVELOPE>
  <HEADER><VERSION>1</VERSION><TALLYREQUEST>Export</TALLYREQUEST><TYPE>Collection</TYPE><ID>StockItems</ID></HEADER>
  <BODY><DESC>
    <STATICVARIABLES><SVCURRENTCOMPANY>${COMPANY}</SVCURRENTCOMPANY></STATICVARIABLES>
    <TDL><TDLMESSAGE>
      <COLLECTION NAME="StockItems" ISMODIFY="No">
        <TYPE>StockItem</TYPE>
        <FETCH>NAME,PARENT</FETCH>
      </COLLECTION>
    </TDLMESSAGE></TDL>
  </DESC></BODY>
</ENVELOPE>`;
}

// --- Simple XML value extractor ---
function extractAll(xml, tagName) {
  const results = [];
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[1].trim());
  }
  return results;
}

function extractFirst(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

// --- Main ---
async function main() {
  console.log(`Connecting to Tally at ${TALLY_URL}...`);
  console.log(`Company: ${COMPANY}\n`);

  // 1. Fetch stock groups
  console.log("Fetching stock groups...");
  const groupsRes = await fetch(TALLY_URL, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: stockGroupsXML(),
  });
  const groupsXml = await groupsRes.text();
  
  const groupBlocks = extractAll(groupsXml, "STOCKGROUP");
  const groups = groupBlocks.map((block) => ({
    name: extractFirst(block, "NAME"),
    parent: extractFirst(block, "PARENT"),
  })).filter((g) => g.name);

  console.log(`Found ${groups.length} stock groups.`);

  // 2. Fetch stock items
  console.log("Fetching stock items...");
  const itemsRes = await fetch(TALLY_URL, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: stockItemsXML(),
  });
  const itemsXml = await itemsRes.text();

  const itemBlocks = extractAll(itemsXml, "STOCKITEM");
  const items = itemBlocks.map((block) => ({
    name: extractFirst(block, "NAME"),
    parent: extractFirst(block, "PARENT"),
  })).filter((it) => it.name);

  console.log(`Found ${items.length} stock items.\n`);

  // 3. Get unique group names that actually have items (use as categories)
  const usedGroupNames = [...new Set(items.map((it) => it.parent).filter(Boolean))];
  // Also include groups that have no items but are not "Primary"
  const allGroupNames = [...new Set([
    ...usedGroupNames,
    ...groups.map((g) => g.name).filter((n) => n !== "Primary"),
  ])];

  console.log(`Creating ${allGroupNames.length} categories...`);
  for (let i = 0; i < allGroupNames.length; i++) {
    const name = allGroupNames[i];
    await prisma.category.upsert({
      where: { name },
      update: { sortOrder: i },
      create: { name, sortOrder: i },
    });
    console.log(`  ✓ ${name}`);
  }

  // 4. Create products
  console.log(`\nCreating ${items.length} products...`);
  let created = 0;
  let skipped = 0;
  for (const item of items) {
    const categoryName = item.parent || "Other";
    const category = await prisma.category.findUnique({ where: { name: categoryName } });
    if (!category) {
      console.log(`  ⚠ Skipped "${item.name}" — category "${categoryName}" not found.`);
      skipped++;
      continue;
    }
    // Check if product already exists
    const existing = await prisma.product.findFirst({
      where: { name: item.name, categoryId: category.id },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.product.create({
      data: { name: item.name, categoryId: category.id },
    });
    console.log(`  ✓ ${item.name} → ${categoryName}`);
    created++;
  }

  console.log(`\n--- Done ---`);
  console.log(`Categories: ${allGroupNames.length}`);
  console.log(`Products created: ${created}`);
  console.log(`Products skipped (duplicates): ${skipped}`);
}

main()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
