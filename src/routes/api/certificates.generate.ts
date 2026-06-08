import { createFileRoute } from "@tanstack/react-router";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { getAuthenticatedUser } from "./-_auth";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// ── helpers ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

function centerText(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  y: number,
  color: [number, number, number] = [0.1, 0.1, 0.1]
) {
  const { width } = page.getSize();
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (width - textWidth) / 2,
    y,
    size,
    font,
    color: rgb(...color),
  });
}

// ── PDF builder ───────────────────────────────────────────────────────

async function buildCertificatePdf(cert: {
  certificate_number: string;
  issued_at: string;
  expires_at?: string | null;
  student: { full_name: string; student_number: string };
  exam: { title: string };
  organization: { name: string };
  grade?: string | null;
  percentage?: number | null;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // A4 landscape: 841.89 × 595.28 pt
  const page = doc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  // Fonts
  const boldFont     = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont  = await doc.embedFont(StandardFonts.Helvetica);
  const italicFont   = await doc.embedFont(StandardFonts.HelveticaOblique);
  const timesItalic  = await doc.embedFont(StandardFonts.TimesRomanItalic);

  // ── Background gradient simulation (two filled rectangles) ──
  const indigo: [number, number, number] = hexToRgb("#4f46e5");
  const violet: [number, number, number] = hexToRgb("#7c3aed");

  // Left accent bar
  page.drawRectangle({ x: 0, y: 0, width: 18, height, color: rgb(...indigo) });
  // Right accent bar
  page.drawRectangle({ x: width - 18, y: 0, width: 18, height, color: rgb(...violet) });
  // Top bar
  page.drawRectangle({ x: 18, y: height - 10, width: width - 36, height: 10, color: rgb(...indigo) });
  // Bottom bar
  page.drawRectangle({ x: 18, y: 0, width: width - 36, height: 10, color: rgb(...violet) });

  // ── Inner border ──
  page.drawRectangle({
    x: 30, y: 18, width: width - 60, height: height - 36,
    borderColor: rgb(...indigo), borderWidth: 1.5,
    opacity: 0,
  });

  // ── Institution name ──
  centerText(page, cert.organization.name.toUpperCase(), boldFont, 11, height - 52, [0.31, 0.27, 0.9]);

  // ── "Certificate of Achievement" heading ──
  centerText(page, "CERTIFICATE OF ACHIEVEMENT", boldFont, 28, height - 110, [0.1, 0.05, 0.3]);

  // ── Decorative divider ──
  const divY = height - 125;
  const divW = 200;
  page.drawLine({ start: { x: (width - divW) / 2, y: divY }, end: { x: (width + divW) / 2, y: divY }, thickness: 1, color: rgb(...indigo) });

  // ── "This is to certify that" ──
  centerText(page, "This is to certify that", italicFont, 13, height - 160, [0.35, 0.35, 0.35]);

  // ── Recipient name ──
  centerText(page, cert.student.full_name, timesItalic, 36, height - 215, [0.1, 0.05, 0.3]);

  // ── Underline for name ──
  const nameW = timesItalic.widthOfTextAtSize(cert.student.full_name, 36);
  page.drawLine({
    start: { x: (width - nameW) / 2, y: height - 220 },
    end:   { x: (width + nameW) / 2, y: height - 220 },
    thickness: 0.8, color: rgb(0.6, 0.6, 0.6),
  });

  // ── "has successfully completed" ──
  centerText(page, "has successfully completed the examination:", italicFont, 13, height - 256, [0.35, 0.35, 0.35]);

  // ── Exam title ──
  const examTitle = cert.exam.title;
  centerText(page, examTitle, boldFont, 18, height - 290, [0.18, 0.1, 0.5]);

  // ── Grade / Score (if available) ──
  if (cert.grade || cert.percentage != null) {
    const gradeText = [
      cert.grade ? `Grade: ${cert.grade}` : null,
      cert.percentage != null ? `Score: ${cert.percentage.toFixed(1)}%` : null,
    ].filter(Boolean).join("   •   ");
    centerText(page, gradeText, boldFont, 12, height - 318, hexToRgb("#4f46e5"));
  }

  // ── Issue date ──
  const issuedDate = new Date(cert.issued_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const expiryNote = cert.expires_at
    ? `  (valid until ${new Date(cert.expires_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })})`
    : "";
  centerText(page, `Issued on ${issuedDate}${expiryNote}`, regularFont, 10, height - 350, [0.5, 0.5, 0.5]);

  // ── Certificate number ──
  centerText(page, `Certificate No: ${cert.certificate_number}`, regularFont, 9, height - 368, [0.6, 0.6, 0.6]);

  // ── Verification URL ──
  centerText(page, "Verify at: https://assess.orcalis.io/verify", regularFont, 9, height - 384, [0.31, 0.27, 0.9]);

  // ── Signature line ──
  const sigX = width / 2 - 80;
  page.drawLine({ start: { x: sigX, y: 80 }, end: { x: sigX + 160, y: 80 }, thickness: 0.8, color: rgb(0.7, 0.7, 0.7) });
  centerText(page, "Authorised Signatory", regularFont, 9, 65, [0.5, 0.5, 0.5]);
  centerText(page, cert.organization.name, regularFont, 8, 53, [0.6, 0.6, 0.6]);

  // ── Student number (bottom left) ──
  page.drawText(`Student: ${cert.student.student_number}`, {
    x: 36, y: 30, size: 8, font: regularFont, color: rgb(0.7, 0.7, 0.7),
  });

  // ── Metadata ──
  doc.setTitle(`Certificate of Achievement — ${cert.student.full_name}`);
  doc.setAuthor(cert.organization.name);
  doc.setSubject(cert.exam.title);
  doc.setKeywords(["certificate", "achievement", "orcalis", cert.certificate_number]);
  doc.setCreationDate(new Date(cert.issued_at));

  return doc.save();
}

// ── Route handler ─────────────────────────────────────────────────────

export const Route = createFileRoute("/api/certificates/generate")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await getAuthenticatedUser(request);

        const url = new URL(request.url);
        const certId = url.searchParams.get("cert_id");
        if (!certId) {
          return Response.json({ error: "Missing cert_id" }, { status: 400 });
        }

        const supabaseUrl  = process.env.VITE_SUPABASE_URL  ?? process.env.SUPABASE_URL ?? "";
        const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";
        const sb = createClient<Database>(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });

        // Fetch certificate + related data
        const { data: cert, error } = await (sb as any)
          .from("certificates")
          .select(`
            *,
            students ( full_name, student_number ),
            exams ( title ),
            organizations ( name ),
            results ( percentage, grade )
          `)
          .eq("id", certId)
          .single();

        if (error || !cert) {
          return Response.json({ error: "Certificate not found" }, { status: 404 });
        }

        if (cert.revoked) {
          return Response.json({ error: "Certificate has been revoked" }, { status: 410 });
        }

        const pdfBytes = await buildCertificatePdf({
          certificate_number: cert.certificate_number,
          issued_at:          cert.issued_at,
          expires_at:         cert.expires_at,
          student:            cert.students ?? { full_name: "Unknown", student_number: "N/A" },
          exam:               cert.exams    ?? { title: "Unknown Examination" },
          organization:       cert.organizations ?? { name: "Orcalis Assess Institution" },
          grade:              cert.results?.grade,
          percentage:         cert.results?.percentage,
        });

        return new Response(pdfBytes.buffer as ArrayBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="certificate-${cert.certificate_number}.pdf"`,
            "Cache-Control": "private, max-age=3600",
          },
        });
      },
    },
  },
});
