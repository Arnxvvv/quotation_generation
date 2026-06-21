import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Get direct child elements with a given local name inside namespace W */
function wChildren(parent, localName) {
  const out = [];
  for (let i = 0; i < parent.childNodes.length; i++) {
    const n = parent.childNodes[i];
    if (n.nodeType === 1 && n.localName === localName && n.namespaceURI === W) {
      out.push(n);
    }
  }
  return out;
}

/** Recursively collect all text from w:t descendants */
function textOf(el) {
  let txt = "";
  if (!el) return txt;
  if (el.nodeType === 3) return el.nodeValue || "";
  for (let i = 0; i < el.childNodes.length; i++) {
    txt += textOf(el.childNodes[i]);
  }
  return txt;
}

/** Parse an XML fragment string into a DOM element, using our doc as owner */
function fragment(doc, xml) {
  const wrapped = `<root xmlns:w="${W}">${xml}</root>`;
  const parsed = new DOMParser().parseFromString(wrapped, "text/xml");
  const root = parsed.documentElement;
  // Import first child (the actual element) into our document
  const child = root.firstChild;
  return doc.importNode(child, true);
}

// XML-safe font run-properties snippet (Times New Roman)
const TNR = `<w:rFonts xmlns:w="${W}" w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>`;

function xe(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function makeProductRowXml(sno, name, desc, qty, priceExcl, total) {
  const instr = xe(` =PRODUCT(LEFT) \\# "#,##0.00" `);
  const totalFormatted = total.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `<w:tr xmlns:w="${W}">
  <w:trPr><w:trHeight w:val="199"/></w:trPr>
  <w:tc><w:tcPr><w:tcW w:w="918" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr>${TNR}</w:rPr></w:pPr><w:r><w:rPr>${TNR}</w:rPr><w:t>${xe(sno)}</w:t></w:r></w:p></w:tc>
  <w:tc><w:tcPr><w:tcW w:w="2970" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr>${TNR}</w:rPr></w:pPr><w:r><w:rPr>${TNR}</w:rPr><w:t>${xe(name)}</w:t></w:r></w:p></w:tc>
  <w:tc><w:tcPr><w:tcW w:w="2689" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr>${TNR}</w:rPr></w:pPr><w:r><w:rPr>${TNR}</w:rPr><w:t>${xe(desc)}</w:t></w:r></w:p></w:tc>
  <w:tc><w:tcPr><w:tcW w:w="731" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr>${TNR}</w:rPr></w:pPr><w:r><w:rPr>${TNR}</w:rPr><w:t>${xe(String(qty))}</w:t></w:r></w:p></w:tc>
  <w:tc><w:tcPr><w:tcW w:w="1530" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr>${TNR}</w:rPr></w:pPr><w:r><w:rPr>${TNR}</w:rPr><w:t>${priceExcl.toFixed(2)}</w:t></w:r></w:p></w:tc>
  <w:tc><w:tcPr><w:tcW w:w="1735" w:type="dxa"/></w:tcPr>
    <w:p><w:pPr><w:rPr>${TNR}<w:b/><w:bCs/></w:rPr></w:pPr>
      <w:fldSimple w:instr="${instr}"><w:r><w:rPr>${TNR}<w:b/><w:bCs/></w:rPr><w:t>${totalFormatted}</w:t></w:r></w:fldSimple>
    </w:p></w:tc>
</w:tr>`;
}

function makeSummaryRowXml(label, instr, bold = false, topBorder = false) {
  const b = bold
    ? `<w:b xmlns:w="${W}"/><w:bCs xmlns:w="${W}"/>`
    : "";
  const bdr = topBorder
    ? `<w:tcBorders xmlns:w="${W}"><w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/></w:tcBorders>`
    : "";
  return `<w:tr xmlns:w="${W}">
  <w:trPr><w:trHeight w:val="260"/></w:trPr>
  <w:tc>
    <w:tcPr><w:tcW w:w="8037" w:type="dxa"/><w:gridSpan w:val="5"/>${bdr}</w:tcPr>
    <w:p>
      <w:pPr><w:jc w:val="right"/><w:rPr>${TNR}${b}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr>
      <w:r><w:rPr>${TNR}${b}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
        <w:t xml:space="preserve">${xe(label)}</w:t></w:r>
    </w:p>
  </w:tc>
  <w:tc>
    <w:tcPr><w:tcW w:w="1735" w:type="dxa"/>${bdr}</w:tcPr>
    <w:p>
      <w:pPr><w:rPr>${TNR}${b}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr>
      <w:fldSimple w:instr="${xe(instr)}">
        <w:r><w:rPr>${TNR}${b}<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>0.00</w:t></w:r>
      </w:fldSimple>
    </w:p>
  </w:tc>
</w:tr>`;
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const { items, companyName } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided." },
        { status: 400 }
      );
    }

    // 1. Load template docx as zip
    const templatePath = path.join(
      process.cwd(),
      "public",
      "Quotation_Letterhead.docx"
    );
    const templateBuf = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(templateBuf);

    // 2. Parse document.xml with a real XML DOM parser
    const docXmlStr = await zip.file("word/document.xml").async("string");
    const doc = new DOMParser().parseFromString(docXmlStr, "text/xml");
    const body = doc.getElementsByTagNameNS(W, "body")[0];

    // 3. Collect all w:tbl elements in document order
    const allTables = Array.from(doc.getElementsByTagNameNS(W, "tbl"));

    if (allTables.length < 3) {
      return NextResponse.json(
        { error: "Template table structure unexpected — need at least 3 tables." },
        { status: 500 }
      );
    }

    // ── Update date in 2nd table (index 1) ──────────────────────────────────
    const dateTable = allTables[1];
    const dateTrs = wChildren(dateTable, "tr");
    if (dateTrs.length > 0) {
      const dateTcs = wChildren(dateTrs[0], "tc");
      if (dateTcs.length > 0) {
        // Walk all w:t nodes in first cell looking for "Date:"
        const tNodes = dateTcs[0].getElementsByTagNameNS(W, "t");
        const today = new Date();
        const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(
          today.getMonth() + 1
        ).padStart(2, "0")}/${today.getFullYear()}`;

        for (let i = 0; i < tNodes.length; i++) {
          const tNode = tNodes[i];
          if (tNode.textContent && tNode.textContent.includes("Date:")) {
            tNode.textContent = `Date: ${dateStr}`;
            // Clear any subsequent text runs in the same paragraph
            for (let j = i + 1; j < tNodes.length; j++) {
              tNodes[j].textContent = "";
            }
            break;
          }
        }
      }
    }

    // ── Update company name in 2nd table, row 1 (the "To" block) ────────────
    if (companyName && dateTrs.length > 1) {
      const toCellTcs = wChildren(dateTrs[1], "tc");
      if (toCellTcs.length > 0) {
        const toTNodes = toCellTcs[0].getElementsByTagNameNS(W, "t");
        for (let i = 0; i < toTNodes.length; i++) {
          const tNode = toTNodes[i];
          if (tNode.textContent && tNode.textContent.includes("Alliance Associates")) {
            tNode.textContent = tNode.textContent.replace("Alliance Associates", companyName);
            break;
          }
        }
      }
    }

    // ── Rebuild 3rd table (index 2) — the items table ───────────────────────
    const itemsTable = allTables[2];
    const existingRows = wChildren(itemsTable, "tr");

    // Keep only the first row (header)
    for (let i = existingRows.length - 1; i >= 1; i--) {
      itemsTable.removeChild(existingRows[i]);
    }

    // Add product rows
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const priceExcl = item.priceWithGst / 1.18;
      const total = priceExcl * item.qty;
      const rowXml = makeProductRowXml(
        `${i + 1}.`,
        item.name,
        item.description || "",
        item.qty,
        priceExcl,
        total
      );
      itemsTable.appendChild(fragment(doc, rowXml));
    }

    // Add summary rows
    const n = items.length;
    const fRange = `F2:F${1 + n}`;

    const summarySpecs = [
      { label: "Sub Total (Without GST)  \u20b9", instr: ` =SUM(${fRange}) \\# "#,##0.00" `, bold: true, border: true },
      { label: "CGST @ 9%  \u20b9", instr: ` =SUM(${fRange})*0.09 \\# "#,##0.00" `, bold: false, border: false },
      { label: "SGST @ 9%  \u20b9", instr: ` =SUM(${fRange})*0.09 \\# "#,##0.00" `, bold: false, border: false },
      { label: "Grand Total  (Incl. 18% GST)  \u20b9", instr: ` =SUM(${fRange})*1.18 \\# "#,##0.00" `, bold: true, border: false },
    ];

    for (const s of summarySpecs) {
      const xml = makeSummaryRowXml(s.label, s.instr, s.bold, s.border);
      itemsTable.appendChild(fragment(doc, xml));
    }

    // ── Remove old hardcoded CGST paragraph if present ──────────────────────
    const allParas = Array.from(body.getElementsByTagNameNS(W, "p"));
    for (const para of allParas) {
      const txt = textOf(para);
      if (txt.includes("CGST") && (txt.includes("1315") || txt.includes("\u2013"))) {
        para.parentNode.removeChild(para);
        break;
      }
    }

    // 4. Serialize DOM back to XML string and save into zip
    const serializer = new XMLSerializer();
    const outputXml = serializer.serializeToString(doc);
    zip.file("word/document.xml", outputXml);

    // 5. Generate output buffer and respond
    const outputBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const today = new Date();
    const fileDateStr = `${String(today.getDate()).padStart(2, "0")}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${today.getFullYear()}`;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Quotation_${fileDateStr}.docx"`,
      },
    });
  } catch (err) {
    console.error("Quotation generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
