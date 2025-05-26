import { NextRequest, NextResponse } from "next/server";
import PDFParser, { Output } from "pdf2json";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file: ${res.status}` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await res.arrayBuffer());

    let text = "";
    if (contentType.includes("application/pdf") || url.endsWith(".pdf")) {
      const pdfParser = new PDFParser();

      const pdfData: Output = await new Promise((resolve, reject) => {
        pdfParser.on("pdfParser_dataError", (err) => reject(err));
        pdfParser.on("pdfParser_dataReady", (data) => resolve(data));
        pdfParser.parseBuffer(buffer);
      });

      for (const page of pdfData.Pages) {
        for (const textItem of page.Texts) {
          for (const segment of textItem.R) {
            text += decodeURIComponent(segment.T);
          }
          text += " ";
        }
        text += "\n\n";
      }
    } else {
      text = buffer.toString("utf-8");
    }
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Error extracting text:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
