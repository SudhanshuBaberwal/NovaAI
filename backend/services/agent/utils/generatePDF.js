import PDFDocument from "pdfkit";

const COLORS = {
  obsidian: "#09090B",
  zinc900: "#18181B",
  zinc700: "#3F3F46",
  zinc500: "#71717A",
  zinc400: "#A1A1AA",
  zinc200: "#E4E4E7",
  zinc100: "#F4F4F5",
};

const ensureSpace = (doc, requiredHeight) => {
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + requiredHeight > bottomLimit) {
    doc.addPage();
  }
};

// Splits "Key Term: Detailed explanation..." so the lead-in renders in bold
const splitLeadIn = (text) => {
  const match = String(text || "").match(/^([^:]{2,48}:)\s+([\s\S]+)$/);
  if (match) {
    return { lead: match[1], body: match[2] };
  }
  return { lead: "", body: String(text || "") };
};

export const generatePDF = async (data = {}) => {
  return new Promise((resolve, reject) => {
    const title = String(data?.title || "Generated Document").trim();
    const subtitle = String(data?.subtitle || "").trim();
    const sections = Array.isArray(data?.sections) ? data.sections : [];

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 54, bottom: 62, left: 52, right: 52 },
      bufferPages: true,
      info: {
        Author: "NovaAI",
        Title: title,
        Creator: "NovaAI",
      },
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;

    const formattedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // 1. Top Document Brand Header
    doc.rect(left, doc.y, 28, 3).fill(COLORS.zinc900);
    doc.moveDown(0.6);

    const metaY = doc.y;
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(COLORS.zinc500)
      .text("NOVAAI  •  EXECUTIVE BRIEF", left, metaY, {
        characterSpacing: 0.8,
      });

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(COLORS.zinc500)
      .text(formattedDate, left, metaY, {
        width: contentWidth,
        align: "right",
      });

    doc.moveDown(1.1);

    // 2. Document Title & Subtitle
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor(COLORS.obsidian)
      .text(title, left, doc.y, {
        width: contentWidth,
        lineGap: 3,
      });

    if (subtitle) {
      doc.moveDown(0.45);
      doc
        .font("Helvetica")
        .fontSize(11.5)
        .fillColor(COLORS.zinc500)
        .text(subtitle, left, doc.y, {
          width: contentWidth,
          lineGap: 3,
        });
    }

    doc.moveDown(1.1);

    // Header Divider Line
    const dividerY = doc.y;
    doc
      .moveTo(left, dividerY)
      .lineTo(right, dividerY)
      .lineWidth(1)
      .strokeColor(COLORS.zinc200)
      .stroke();

    doc.moveDown(1.4);

    // 3. Document Sections & Bullets
    sections.forEach((section, secIdx) => {
      const heading = String(
        section?.heading || `Section ${secIdx + 1}`,
      ).trim();
      const points = Array.isArray(section?.points) ? section.points : [];

      // Prevent orphaned headings at the bottom of a page
      doc.font("Helvetica-Bold").fontSize(13.5);
      const headingHeight = doc.heightOfString(heading, {
        width: contentWidth - 28,
      });
      ensureSpace(doc, headingHeight + 52);

      const sectionNumber = String(secIdx + 1).padStart(2, "0");
      const headerStartY = doc.y;

      // Numbered monochrome badge
      doc.roundedRect(left, headerStartY + 1, 22, 16, 4).fill(COLORS.zinc100);

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(COLORS.zinc700)
        .text(sectionNumber, left, headerStartY + 4.5, {
          width: 22,
          align: "center",
        });

      // Section Heading
      doc
        .font("Helvetica-Bold")
        .fontSize(13.5)
        .fillColor(COLORS.zinc900)
        .text(heading, left + 30, headerStartY, {
          width: contentWidth - 30,
          lineGap: 2,
        });

      doc.moveDown(0.55);

      // Bullet Points with Hanging Indents
      const bulletIndent = left + 12;
      const textIndent = left + 24;
      const textWidth = right - textIndent;

      points.forEach((rawPoint) => {
        const cleanPoint = String(rawPoint || "").trim();
        if (!cleanPoint) return;

        doc.font("Helvetica").fontSize(10.5);
        const pointHeight = doc.heightOfString(cleanPoint, {
          width: textWidth,
          lineGap: 3.5,
        });

        ensureSpace(doc, pointHeight + 10);

        const bulletY = doc.y;

        // Crisp circular bullet dot
        doc.circle(bulletIndent + 2, bulletY + 5.5, 2).fill(COLORS.zinc400);

        const { lead, body } = splitLeadIn(cleanPoint);

        if (lead) {
          doc
            .font("Helvetica-Bold")
            .fontSize(10.5)
            .fillColor(COLORS.zinc900)
            .text(`${lead} `, textIndent, bulletY, {
              width: textWidth,
              lineGap: 3.5,
              continued: true,
            })
            .font("Helvetica")
            .fillColor(COLORS.zinc700)
            .text(body, {
              width: textWidth,
              lineGap: 3.5,
            });
        } else {
          doc
            .font("Helvetica")
            .fontSize(10.5)
            .fillColor(COLORS.zinc700)
            .text(body, textIndent, bulletY, {
              width: textWidth,
              lineGap: 3.5,
            });
        }

        doc.moveDown(0.45);
      });

      doc.moveDown(0.85);
    });

    // 4. Running Footer Across All Pages
    const pageRange = doc.bufferedPageRange();
    for (let i = 0; i < pageRange.count; i++) {
      doc.switchToPage(pageRange.start + i);

      const prevBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      const footerLineY = doc.page.height - 44;
      const footerTextY = doc.page.height - 34;

      doc
        .moveTo(left, footerLineY)
        .lineTo(right, footerLineY)
        .lineWidth(0.75)
        .strokeColor(COLORS.zinc200)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(COLORS.zinc400)
        .text("Generated by NovaAI", left, footerTextY, {
          lineBreak: false,
        });

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(COLORS.zinc400)
        .text(`Page ${i + 1} of ${pageRange.count}`, left, footerTextY, {
          width: contentWidth,
          align: "right",
          lineBreak: false,
        });

      doc.page.margins.bottom = prevBottomMargin;
    }

    doc.end();
  });
};
