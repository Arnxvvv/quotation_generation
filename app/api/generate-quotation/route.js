import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

export async function POST(req) {
  try {
    const { items } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided." }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), "public", "Quotation_Letterhead.docx");
    
    // Ensure tmp folder exists
    const tempDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate unique names for temp files to support concurrent requests safely
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const outputPath = path.join(tempDir, `Quotation_Temp_${uniqueId}.docx`);

    const pythonScriptPath = path.join(process.cwd(), "lib", "generate_quotation.py");

    const inputData = {
      template_path: templatePath,
      output_path: outputPath,
      items: items
    };

    // Run the Python script
    const pyProcess = spawn("python", [pythonScriptPath]);

    let pyStdout = "";
    let pyStderr = "";

    pyProcess.stdout.on("data", (data) => {
      pyStdout += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      pyStderr += data.toString();
    });

    // Write input data to Python process stdin
    pyProcess.stdin.write(JSON.stringify(inputData));
    pyProcess.stdin.end();

    const exitCode = await new Promise((resolve) => {
      pyProcess.on("close", resolve);
    });

    if (exitCode !== 0) {
      console.error("Python script error:", pyStderr);
      return NextResponse.json({ error: "Failed to generate quotation: " + pyStderr }, { status: 500 });
    }

    // Read the output file
    if (!fs.existsSync(outputPath)) {
      return NextResponse.json({ error: "Generated file not found." }, { status: 500 });
    }

    const outputBuffer = fs.readFileSync(outputPath);

    // Delete the temporary file
    try {
      fs.unlinkSync(outputPath);
    } catch (e) {
      console.error("Error deleting temp file:", e);
    }

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Quotation_${dateStr}.docx"`,
      },
    });

  } catch (err) {
    console.error("Quotation generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

