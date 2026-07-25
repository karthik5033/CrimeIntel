import { NextRequest, NextResponse } from "next/server";
import { getCatalystApp } from "@/lib/catalyst";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to temp file
    const tempDir = os.tmpdir();
    // Using simple random string instead of uuid since uuid package isn't installed
    const randomId = Math.random().toString(36).substring(2, 15);
    const tempFilePath = path.join(tempDir, `${randomId}-${file.name}`);
    fs.writeFileSync(tempFilePath, buffer);

    try {
      // Catalyst initialization
      const app = getCatalystApp(req);
      const zia = app.zia();

      // Read from temp file for Zia OCR
      const readStream = fs.createReadStream(tempFilePath);
      const result = await zia.extractOpticalCharacters(readStream, { language: 'eng', modelType: 'OCR' });
      
      const rawText = result.text || "";

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      // --- Simple Parsing Logic to simulate "Dataset Generation" ---
      // We parse the raw text to extract some structured fields
      const lines = rawText.split('\n').map((l: string) => l.trim()).filter(Boolean);
      
      // Basic heuristic to parse fields
      const dataset: Record<string, string> = {
        docType: "Incident Report", // default
        date: new Date().toISOString().split('T')[0],
        location: "Unknown",
        suspect: "Unknown",
        description: "No description found",
      };

      for (const line of lines) {
        if (line.toLowerCase().includes("report")) dataset.docType = line;
        if (line.toLowerCase().startsWith("date:")) dataset.date = line.split(":")[1].trim();
        if (line.toLowerCase().startsWith("incident:")) dataset.location = line.split(":")[1].trim();
        if (line.toLowerCase().startsWith("suspect:")) dataset.suspect = line.split(":")[1].trim();
        if (line.toLowerCase().startsWith("details:")) dataset.description = line.split(":")[1].trim();
      }

      return NextResponse.json({ 
        success: true, 
        rawText,
        dataset
      });
      
    } catch (apiError: any) {
      // Clean up on error
      if (fs.existsSync(tempFilePath)) {
         fs.unlinkSync(tempFilePath);
      }
      throw apiError;
    }

  } catch (error: any) {
    console.error("OCR Error:", error);
    return NextResponse.json(
      { error: "Failed to process OCR request", details: error.message },
      { status: 500 }
    );
  }
}
