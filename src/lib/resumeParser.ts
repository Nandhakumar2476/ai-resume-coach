// Resume parsing utilities — PDF (pdfjs), DOCX (mammoth), or plain text.
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore - vite worker import
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export async function parsePdf(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => it.str);
    text += strings.join(" ") + "\n";
  }
  return text.trim();
}

export async function parseDocx(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result.value || "").trim();
}

export async function parseResumeFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return parsePdf(file);
  }
  if (
    name.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return parseDocx(file);
  }
  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return (await file.text()).trim();
  }
  throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
}
